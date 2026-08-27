import { describe, expect, it } from "vitest";
import { buildCareerGraphFixture, nodeIds } from "../../fixtures/careerGraphFixture.js";
import { buildElements, computeHiddenNodeIds } from "./buildElements.js";

describe("buildElements", () => {
  it("renders a multi-parent node once, with one edge per parent", () => {
    const graph = buildCareerGraphFixture();
    const elements = buildElements(graph);

    const observabilityNodes = elements.filter(
      (el) => el.data.id === nodeIds.skillObservabilityId,
    );
    expect(observabilityNodes).toHaveLength(1);

    const incomingParentEdges = elements.filter(
      (el) => "target" in el.data && el.data.target === nodeIds.skillObservabilityId,
    );
    expect(incomingParentEdges).toHaveLength(2);
  });

  it("renders relatedNodeIds as edges distinct in kind from parentIds edges", () => {
    const graph = buildCareerGraphFixture();
    const elements = buildElements(graph);

    const relatedEdges = elements.filter((el) => el.data.kind === "related");
    const parentEdges = elements.filter((el) => el.data.kind === "parent");
    expect(relatedEdges.length).toBeGreaterThan(0);
    expect(parentEdges.length).toBeGreaterThan(0);
  });

  it("includes the role as a node with kind 'role'", () => {
    const graph = buildCareerGraphFixture();
    const elements = buildElements(graph);
    const roleEl = elements.find((el) => el.data.id === graph.role.id);
    expect(roleEl?.data.kind).toBe("role");
  });
});

describe("computeHiddenNodeIds / collapse", () => {
  it("hides a descendant only reachable through the collapsed node", () => {
    const graph = buildCareerGraphFixture();
    // Programming Languages (and its child, Python) are only reachable
    // through AIOps in the fixture - collapsing AIOps must hide them.
    const hidden = computeHiddenNodeIds(graph, new Set([nodeIds.capabilityAIOpsId]));
    expect(hidden.has(nodeIds.skillProgrammingLanguagesId)).toBe(true);
    expect(hidden.has(nodeIds.technologyPythonId)).toBe(true);
    // The collapsed node itself is not in the hidden set.
    expect(hidden.has(nodeIds.capabilityAIOpsId)).toBe(false);
  });

  it("does not hide a descendant that also has a non-collapsed parent", () => {
    const graph = buildCareerGraphFixture();
    // Observability has two parents (AIOps, SRE); collapsing only AIOps
    // must not hide it, or anything under it, since it's still reachable
    // via the uncollapsed SRE branch.
    const hidden = computeHiddenNodeIds(graph, new Set([nodeIds.capabilityAIOpsId]));
    expect(hidden.has(nodeIds.skillObservabilityId)).toBe(false);
    expect(hidden.has(nodeIds.technologyPrometheusId)).toBe(false);
  });

  it("hides a descendant only reachable via both of its collapsed parents", () => {
    const graph = buildCareerGraphFixture();
    const hidden = computeHiddenNodeIds(
      graph,
      new Set([nodeIds.capabilityAIOpsId, nodeIds.capabilitySREId]),
    );
    expect(hidden.has(nodeIds.skillObservabilityId)).toBe(true);
    expect(hidden.has(nodeIds.technologyPrometheusId)).toBe(true);
  });

  it("collapsing leaves the underlying graph data unchanged", () => {
    const graph = buildCareerGraphFixture();
    const before = JSON.parse(JSON.stringify(graph));
    buildElements(graph, new Set([nodeIds.capabilityAIOpsId]));
    expect(graph).toEqual(before);
  });
});
