import { describe, expect, it } from "vitest";
import { careerGraphSchema } from "../../domain/index.js";
import {
  addJobDescription,
  addNode,
  addRequirement,
  computeDeleteCascade,
  createFirstGraph,
  deleteNode,
  editRequirementExperience,
  renameNode,
} from "./graphOperations.js";

function makeFirstGraph() {
  return createFirstGraph({
    jobDescription: { title: "Principal Engineer", rawText: "Full JD text" },
    requirement: { sourceText: "Principal Engineer" },
    role: { name: "Principal Engineer" },
  });
}

describe("createFirstGraph", () => {
  it("produces a schema-valid CareerGraph with Role provenance referencing the first Requirement", () => {
    const graph = makeFirstGraph();
    const parsed = careerGraphSchema.parse(graph);
    expect(parsed.role.provenance[0]!.requirementId).toBe(parsed.requirements[0]!.id);
  });
});

describe("addJobDescription / addRequirement / editRequirementExperience", () => {
  it("appends a JobDescription and a Requirement, then edits its experience", () => {
    let graph = makeFirstGraph();
    graph = addJobDescription(graph, { title: "Staff SRE", rawText: "Other JD" });
    expect(graph.sourceJobDescriptions).toHaveLength(2);

    const newJdId = graph.sourceJobDescriptions[1]!.id;
    graph = addRequirement(graph, {
      jobDescriptionId: newJdId,
      sourceText: "4+ years of experience with Python",
    });
    const req = graph.requirements.find((r) => r.sourceText.includes("Python"))!;
    expect(req.experience).toBeUndefined();

    graph = editRequirementExperience(graph, req.id, {
      minimumYears: 4,
      unit: "years",
      logic: "SINGLE",
      subjects: ["Python"],
    });
    const updated = graph.requirements.find((r) => r.id === req.id)!;
    expect(updated.experience?.minimumYears).toBe(4);

    expect(() => careerGraphSchema.parse(graph)).not.toThrow();
  });
});

describe("addNode", () => {
  it("derives the node id and adds it to the graph", () => {
    let graph = makeFirstGraph();
    const requirementId = graph.requirements[0]!.id;
    const jobDescriptionId = graph.sourceJobDescriptions[0]!.id;

    graph = addNode(graph, {
      kind: "capability",
      name: "AIOps",
      parentIds: [graph.role.id],
      provenance: [{ jobDescriptionId, requirementId }],
    });

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]!.id).toBe("capability:generic:aiops");
    expect(() => careerGraphSchema.parse(graph)).not.toThrow();
  });
});

describe("renameNode", () => {
  it("cascades the new id to every other node's parentIds/relatedNodeIds", () => {
    let graph = makeFirstGraph();
    const requirementId = graph.requirements[0]!.id;
    const jobDescriptionId = graph.sourceJobDescriptions[0]!.id;
    const provenance = [{ jobDescriptionId, requirementId }];

    graph = addNode(graph, {
      kind: "capability",
      name: "AIOps",
      parentIds: [graph.role.id],
      provenance,
    });
    const capabilityId = graph.nodes[0]!.id;

    graph = addNode(graph, {
      kind: "skill",
      name: "Observability",
      parentIds: [capabilityId],
      provenance,
    });
    const skillId = graph.nodes[1]!.id;

    graph = renameNode(graph, { nodeId: capabilityId, name: "AI Operations" });
    const renamed = graph.nodes.find((n) => n.name === "AI Operations")!;
    expect(renamed.id).toBe("capability:generic:ai-operations");
    expect(renamed.id).not.toBe(capabilityId);

    const skill = graph.nodes.find((n) => n.id === skillId)!;
    expect(skill.parentIds).toEqual([renamed.id]);
    expect(skill.parentIds).not.toContain(capabilityId);

    expect(() => careerGraphSchema.parse(graph)).not.toThrow();
  });
});

describe("computeDeleteCascade / deleteNode", () => {
  function buildChain() {
    let graph = makeFirstGraph();
    const requirementId = graph.requirements[0]!.id;
    const jobDescriptionId = graph.sourceJobDescriptions[0]!.id;
    const provenance = [{ jobDescriptionId, requirementId }];

    graph = addNode(graph, { kind: "capability", name: "AIOps", parentIds: [graph.role.id], provenance });
    const capabilityId = graph.nodes[0]!.id;
    graph = addNode(graph, { kind: "skill", name: "Observability", parentIds: [capabilityId], provenance });
    const skillId = graph.nodes[1]!.id;
    graph = addNode(graph, { kind: "technology", name: "Prometheus", parentIds: [skillId], provenance });
    const technologyId = graph.nodes[2]!.id;
    return { graph, capabilityId, skillId, technologyId };
  }

  it("cascades to every descendant left with zero parents", () => {
    const { graph, capabilityId, skillId, technologyId } = buildChain();
    const removed = computeDeleteCascade(graph, capabilityId);
    expect(removed).toEqual(new Set([capabilityId, skillId, technologyId]));

    const result = deleteNode(graph, capabilityId);
    expect(result.nodes).toHaveLength(0);
    expect(() => careerGraphSchema.parse(result)).not.toThrow();
  });

  it("does not cascade to a node with a surviving second parent", () => {
    const { graph, capabilityId, skillId } = buildChain();
    let g = addNode(graph, {
      kind: "capability",
      name: "SRE",
      parentIds: [graph.role.id],
      provenance: [{ jobDescriptionId: graph.sourceJobDescriptions[0]!.id, requirementId: graph.requirements[0]!.id }],
    });
    const sreId = g.nodes.find((n) => n.name === "SRE")!.id;
    g = renameNode(g, { nodeId: skillId }); // no-op rename to keep types simple; then add sre as extra parent
    const skill = g.nodes.find((n) => n.id === skillId)!;
    g = {
      ...g,
      nodes: g.nodes.map((n) => (n.id === skillId ? { ...n, parentIds: [...n.parentIds, sreId] } : n)),
    };
    expect(skill).toBeDefined();

    const removed = computeDeleteCascade(g, capabilityId);
    expect(removed.has(skillId)).toBe(false);

    const result = deleteNode(g, capabilityId);
    const survivingSkill = result.nodes.find((n) => n.id === skillId)!;
    expect(survivingSkill.parentIds).toEqual([sreId]);
    expect(() => careerGraphSchema.parse(result)).not.toThrow();
  });
});
