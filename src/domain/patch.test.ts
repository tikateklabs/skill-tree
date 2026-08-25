import { describe, expect, it } from "vitest";
import { careerGraphSchema } from "./graph.js";
import { applyCareerGraphPatch } from "./patch.js";
import { buildCareerGraphFixture, nodeIds } from "../fixtures/careerGraphFixture.js";

describe("applyCareerGraphPatch", () => {
  it("applies a valid patch and returns the updated graph", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const result = applyCareerGraphPatch(
      graph,
      [{ op: "replace", path: "/role/name", value: "Principal SRE Engineer" }],
      graph.version,
    );

    expect(result.status).toBe("applied");
    if (result.status === "applied") {
      expect(result.graph.role.name).toBe("Principal SRE Engineer");
    }
  });

  it("rejects a patch that would remove a node's only provenance entry, leaving the original graph unchanged", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const originalSnapshot = JSON.parse(JSON.stringify(graph));

    const prometheusIndex = graph.nodes.findIndex(
      (n) => n.id === nodeIds.technologyPrometheusId,
    );
    const result = applyCareerGraphPatch(
      graph,
      [{ op: "replace", path: `/nodes/${prometheusIndex}/provenance`, value: [] }],
      graph.version,
    );

    expect(result.status).toBe("invalid");
    expect(graph).toEqual(originalSnapshot);
  });

  it("flags a patch generated against a stale version and does not apply it", () => {
    const graph = careerGraphSchema.parse(buildCareerGraphFixture());
    const newerGraph = { ...graph, version: graph.version + 2 };

    const result = applyCareerGraphPatch(
      newerGraph,
      [{ op: "replace", path: "/role/name", value: "Whatever" }],
      graph.version,
    );

    expect(result.status).toBe("stale");
    if (result.status === "stale") {
      expect(result.baseVersion).toBe(graph.version);
      expect(result.currentVersion).toBe(newerGraph.version);
    }
    expect(newerGraph.role.name).not.toBe("Whatever");
  });
});
