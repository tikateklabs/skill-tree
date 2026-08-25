import { describe, expect, it } from "vitest";
import { validateCareerGraphImport } from "./validate.js";
import { buildCareerGraphFixture, nodeIds } from "../fixtures/careerGraphFixture.js";

describe("validateCareerGraphImport - two-layer contract", () => {
  it("accepts a candidate that passes both the JSON Schema and domain layers", () => {
    const result = validateCareerGraphImport(buildCareerGraphFixture());
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.graph.role.name).toBe("Principal Engineer");
    }
  });

  it("rejects at the json-schema stage when a structural constraint is violated, without reaching the domain stage", () => {
    // Empty provenance violates `minItems: 1`, which IS expressible (and
    // present) in the generated JSON Schema, so this must be caught
    // before Zod is ever consulted.
    const graph = buildCareerGraphFixture();
    const prometheus = graph.nodes.find((n) => n.id === nodeIds.technologyPrometheusId)!;
    prometheus.provenance = [];

    const result = validateCareerGraphImport(graph);
    expect(result.accepted).toBe(false);
    if (!result.accepted) {
      expect(result.stage).toBe("json-schema");
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("passes the json-schema stage but is rejected at the domain stage for a semantic-only violation (parentIds cycle)", () => {
    // A parentIds cycle between two Capability nodes is structurally
    // indistinguishable from a valid graph to JSON Schema (both are just
    // arrays of strings) - only Zod's superRefine can detect it. This is
    // the case where the two layers deliberately do NOT have rejection
    // parity.
    const graph = buildCareerGraphFixture();
    const aiops = graph.nodes.find((n) => n.id === nodeIds.capabilityAIOpsId)!;
    const sre = graph.nodes.find((n) => n.id === nodeIds.capabilitySREId)!;
    aiops.parentIds = [sre.id];
    sre.parentIds = [aiops.id];

    const result = validateCareerGraphImport(graph);
    expect(result.accepted).toBe(false);
    if (!result.accepted) {
      expect(result.stage).toBe("domain");
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("rejects a candidate that is not even a valid CareerGraph shape (json-schema stage)", () => {
    const result = validateCareerGraphImport({ not: "a career graph" });
    expect(result.accepted).toBe(false);
    if (!result.accepted) {
      expect(result.stage).toBe("json-schema");
    }
  });
});
