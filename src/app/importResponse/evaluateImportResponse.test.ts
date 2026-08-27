import { describe, expect, it } from "vitest";
import { careerGraphSchema } from "../../domain/index.js";
import { buildCareerGraphFixture, nodeIds } from "../../fixtures/careerGraphFixture.js";
import { evaluateImportResponse } from "./evaluateImportResponse.js";

function fixtureGraph() {
  return careerGraphSchema.parse(buildCareerGraphFixture());
}

describe("evaluateImportResponse - malformed input", () => {
  it("reports a parse error for text that is not valid JSON", () => {
    const result = evaluateImportResponse(fixtureGraph(), "{ not json");
    expect(result.status).toBe("parse-error");
  });

  it("reports unknown-shape for valid JSON matching neither expected shape", () => {
    const result = evaluateImportResponse(fixtureGraph(), JSON.stringify({ hello: "world" }));
    expect(result.status).toBe("unknown-shape");
  });
});

describe("evaluateImportResponse - full-graph responses", () => {
  it("rejects a structurally invalid full graph at the json-schema stage", () => {
    const graph = fixtureGraph();
    // `role` must stay present (as an object) for shape detection to
    // route this to the full-graph path at all; dropping just its `id`
    // (JSON.stringify omits an `undefined` property value, not the
    // parent object) is the structural violation under test - a
    // required field missing, exactly what minItems/required constraints
    // in the generated JSON Schema catch.
    const invalid = { ...graph, role: { ...graph.role, id: undefined } };
    const result = evaluateImportResponse(graph, JSON.stringify(invalid));
    expect(result.status).toBe("rejected");
    if (result.status === "rejected") expect(result.stage).toBe("json-schema");
  });

  it("passes json-schema but is rejected at the domain stage for a semantic-only violation", () => {
    const graph = fixtureGraph();
    const invalid = structuredClone(graph);
    const aiops = invalid.nodes.find((n) => n.id === nodeIds.capabilityAIOpsId)!;
    const sre = invalid.nodes.find((n) => n.id === nodeIds.capabilitySREId)!;
    aiops.parentIds = [sre.id];
    sre.parentIds = [aiops.id];

    const result = evaluateImportResponse(graph, JSON.stringify(invalid));
    expect(result.status).toBe("rejected");
    if (result.status === "rejected") expect(result.stage).toBe("domain");
  });

  it("accepts a valid full graph and computes a diff against the current graph", () => {
    const graph = fixtureGraph();
    const updated = structuredClone(graph);
    updated.version += 1;
    updated.nodes = updated.nodes.filter((n) => n.id !== nodeIds.technologySplunkId);

    const result = evaluateImportResponse(graph, JSON.stringify(updated));
    expect(result.status).toBe("accepted-full-graph");
    if (result.status === "accepted-full-graph") {
      expect(result.diff.removedNodeIds).toContain(nodeIds.technologySplunkId);
      expect(result.diff.addedNodeIds).toHaveLength(0);
    }
  });
});

describe("evaluateImportResponse - patch envelope responses", () => {
  it("applies a valid patch envelope and reports the operations", () => {
    const graph = fixtureGraph();
    const envelope = {
      baseVersion: graph.version,
      operations: [{ op: "replace", path: "/role/name", value: "Renamed Role" }],
    };
    const result = evaluateImportResponse(graph, JSON.stringify(envelope));
    expect(result.status).toBe("accepted-patch");
    if (result.status === "accepted-patch") {
      expect(result.graph.role.name).toBe("Renamed Role");
      expect(result.operations).toEqual(envelope.operations);
    }
  });

  it("flags a stale patch envelope and does not apply it", () => {
    const graph = fixtureGraph();
    const newerGraph = { ...graph, version: graph.version + 3 };
    const envelope = {
      baseVersion: graph.version,
      operations: [{ op: "replace", path: "/role/name", value: "Should not apply" }],
    };
    const result = evaluateImportResponse(newerGraph, JSON.stringify(envelope));
    expect(result.status).toBe("stale");
    if (result.status === "stale") {
      expect(result.baseVersion).toBe(graph.version);
      expect(result.currentVersion).toBe(newerGraph.version);
    }
  });

  it("applies a stale patch when the user explicitly forces it, against the current version", () => {
    const graph = fixtureGraph();
    const newerGraph = { ...graph, version: graph.version + 3 };
    const envelope = {
      baseVersion: graph.version,
      operations: [{ op: "replace", path: "/role/name", value: "Forced" }],
    };
    const result = evaluateImportResponse(newerGraph, JSON.stringify(envelope), {
      forceStaleProceed: true,
    });
    expect(result.status).toBe("accepted-patch");
    if (result.status === "accepted-patch") {
      expect(result.graph.role.name).toBe("Forced");
      // applyCareerGraphPatch applies exactly the given operations - it
      // doesn't auto-bump `version`, and this patch doesn't touch it.
      expect(result.graph.version).toBe(newerGraph.version);
    }
  });

  it("rejects a patch envelope that would produce an invalid graph", () => {
    const graph = fixtureGraph();
    const prometheusIndex = graph.nodes.findIndex((n) => n.id === nodeIds.technologyPrometheusId);
    const envelope = {
      baseVersion: graph.version,
      operations: [{ op: "replace", path: `/nodes/${prometheusIndex}/provenance`, value: [] }],
    };
    const result = evaluateImportResponse(graph, JSON.stringify(envelope));
    expect(result.status).toBe("rejected");
  });
});
