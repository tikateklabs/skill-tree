import { describe, expect, it } from "vitest";
import { careerGraphSchema } from "../domain/graph.js";
import {
  AIOPS_OR_REQUIREMENT_TEXT,
  buildCareerGraphFixture,
  nodeIds,
  PYTHON_REQUIREMENT_TEXT,
} from "./careerGraphFixture.js";

describe("careerGraphFixture", () => {
  it("validates against the CareerGraph schema", () => {
    const parsed = careerGraphSchema.parse(buildCareerGraphFixture());
    expect(parsed.nodes.length).toBeGreaterThan(0);
  });

  it("contains a multi-level chain Role -> Capability -> Skill -> Technology", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const prometheus = graph.nodes.find((n) => n.id === nodeIds.technologyPrometheusId)!;
    const observability = graph.nodes.find((n) => n.id === nodeIds.skillObservabilityId)!;
    const aiops = graph.nodes.find((n) => n.id === nodeIds.capabilityAIOpsId)!;

    expect(prometheus.parentIds).toContain(observability.id);
    expect(observability.parentIds).toContain(aiops.id);
    expect(aiops.parentIds).toContain(graph.role.id);
  });

  it("contains a node with two parents (Observability under AIOps and SRE)", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const observability = graph.nodes.find((n) => n.id === nodeIds.skillObservabilityId)!;
    expect(observability.parentIds).toEqual(
      expect.arrayContaining([nodeIds.capabilityAIOpsId, nodeIds.capabilitySREId]),
    );
    expect(observability.parentIds).toHaveLength(2);
  });

  it("contains two same-kind/same-name nodes distinguished only by namespace", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const atlasMongo = graph.nodes.find((n) => n.id === nodeIds.technologyAtlasMongoId)!;
    const atlasInternal = graph.nodes.find(
      (n) => n.id === nodeIds.technologyAtlasInternalId,
    )!;
    expect(atlasMongo.name).toBe("Atlas");
    expect(atlasInternal.name).toBe("Atlas");
    expect(atlasMongo.kind).toBe("technology");
    expect(atlasInternal.kind).toBe("technology");
    expect(atlasMongo.namespace).not.toBe(atlasInternal.namespace);
    expect(atlasMongo.id).not.toBe(atlasInternal.id);
  });

  it("asserts the exact structured value for the SINGLE-logic Python requirement", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const req = graph.requirements.find((r) => r.id === "req_python")!;
    expect(req.sourceText).toBe(PYTHON_REQUIREMENT_TEXT);
    expect(req.sourceText).toBe("4+ years of experience with Python");
    expect(req.experience).toEqual({
      minimumYears: 4,
      unit: "years",
      logic: "SINGLE",
      subjects: ["Python"],
    });
  });

  it("asserts the exact structured value for the OR-logic AIOps/SRE requirement", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const req = graph.requirements.find((r) => r.id === "req_aiops_or")!;
    expect(req.sourceText).toBe(AIOPS_OR_REQUIREMENT_TEXT);
    expect(req.sourceText).toBe(
      "5+ years of experience in AIOps, SRE, production engineering, or large-scale distributed systems operations",
    );
    expect(req.experience).toEqual({
      minimumYears: 5,
      unit: "years",
      logic: "OR",
      subjects: [
        "AIOps",
        "SRE",
        "Production Engineering",
        "Large-scale distributed systems operations",
      ],
    });
    expect(req.experience?.subjects).toHaveLength(4);
  });

  it("contains at least one non-experience requirement", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const nonExperience = graph.requirements.filter((r) => r.experience === undefined);
    expect(nonExperience.length).toBeGreaterThan(0);
  });

  it("is end-to-end traceable: Prometheus node -> req_014 -> JobDescription", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const prometheus = graph.nodes.find((n) => n.id === nodeIds.technologyPrometheusId)!;
    const provenance = prometheus.provenance[0]!;
    const requirement = graph.requirements.find((r) => r.id === provenance.requirementId)!;
    const jobDescription = graph.sourceJobDescriptions.find(
      (jd) => jd.id === requirement.jobDescriptionId,
    )!;

    expect(requirement.sourceText).toBe(
      "Experience with observability tooling such as Prometheus, Splunk, and OpenTelemetry",
    );
    expect(jobDescription.rawText).toContain(requirement.sourceText);
  });
});

describe("careerGraphFixture - rejection paths", () => {
  it("rejects a parentIds cycle variant", () => {
    const graph = buildCareerGraphFixture();
    const aiops = graph.nodes.find((n) => n.id === nodeIds.capabilityAIOpsId)!;
    const sre = graph.nodes.find((n) => n.id === nodeIds.capabilitySREId)!;
    // Both are legal capability parents kind-wise (capability -> capability
    // is allowed); the only violation introduced here is the 2-cycle.
    aiops.parentIds = [sre.id];
    sre.parentIds = [aiops.id];

    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });

  it("rejects an empty-provenance variant", () => {
    const graph = buildCareerGraphFixture();
    const prometheus = graph.nodes.find((n) => n.id === nodeIds.technologyPrometheusId)!;
    prometheus.provenance = [];

    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });

  it("rejects a mismatched provenance jobDescriptionId variant", () => {
    const graph = buildCareerGraphFixture();
    graph.sourceJobDescriptions.push({
      id: "job_other",
      title: "Other Role",
      rawText: "Other JD text",
      importedAt: "2026-08-25T00:00:00.000Z",
    });
    const prometheus = graph.nodes.find((n) => n.id === nodeIds.technologyPrometheusId)!;
    // req_014 belongs to job_wellsfargo_principal, not job_other.
    prometheus.provenance = [{ jobDescriptionId: "job_other", requirementId: "req_014" }];

    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });
});
