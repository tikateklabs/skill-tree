import { describe, expect, it } from "vitest";
import { buildCareerGraphFixture, nodeIds } from "../../fixtures/careerGraphFixture.js";
import { resolveNodeInspectorData } from "./nodeInspectorData.js";

describe("resolveNodeInspectorData", () => {
  it("shows the originating JD wording for a node with one provenance entry", () => {
    const graph = buildCareerGraphFixture();
    const data = resolveNodeInspectorData(graph, nodeIds.technologyPrometheusId)!;

    expect(data.provenance).toHaveLength(1);
    expect(data.provenance[0]!.sourceText).toBe(
      "Experience with observability tooling such as Prometheus, Splunk, and OpenTelemetry",
    );
    expect(data.provenance[0]!.jobDescriptionTitle).toBe("Principal Engineer");
    expect(data.provenance[0]!.jobDescriptionCompany).toBe("Wells Fargo");
  });

  it("shows an attached experience requirement", () => {
    const graph = buildCareerGraphFixture();
    const data = resolveNodeInspectorData(graph, nodeIds.skillProgrammingLanguagesId)!;

    expect(data.experienceRequirements).toHaveLength(1);
    expect(data.experienceRequirements[0]!.minimumYears).toBe(4);
    expect(data.experienceRequirements[0]!.logic).toBe("SINGLE");
    expect(data.experienceRequirements[0]!.subjects).toEqual(["Python"]);
  });

  it("shows every provenance entry for a node with more than one", () => {
    const graph = buildCareerGraphFixture();
    const data = resolveNodeInspectorData(graph, nodeIds.capabilitySREId)!;
    expect(data.provenance.length).toBeGreaterThanOrEqual(2);
  });

  it("resolves relatedNodeIds to names", () => {
    const graph = buildCareerGraphFixture();
    const data = resolveNodeInspectorData(graph, nodeIds.technologyAtlasMongoId)!;
    expect(data.relatedNodes).toEqual([{ id: nodeIds.technologyAtlasInternalId, name: "Atlas" }]);
  });

  it("lists children", () => {
    const graph = buildCareerGraphFixture();
    const data = resolveNodeInspectorData(graph, nodeIds.skillObservabilityId)!;
    const childIds = data.children.map((c) => c.id).sort();
    expect(childIds).toEqual(
      [
        nodeIds.technologyPrometheusId,
        nodeIds.technologySplunkId,
        nodeIds.technologyOpenTelemetryId,
      ].sort(),
    );
  });

  it("returns null for an unknown node id", () => {
    const graph = buildCareerGraphFixture();
    expect(resolveNodeInspectorData(graph, "technology:generic:nonexistent")).toBeNull();
  });
});
