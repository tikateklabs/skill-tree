import { describe, expect, it } from "vitest";
import { careerGraphSchema, type CareerGraph } from "./graph.js";
import { deriveNodeId } from "./id.js";

const jd1 = {
  id: "job_a",
  title: "Principal Engineer",
  company: "Wells Fargo",
  rawText: "Full JD text A",
  importedAt: "2026-08-25T00:00:00.000Z",
};

const jd2 = {
  id: "job_b",
  title: "Staff SRE",
  company: "Acme",
  rawText: "Full JD text B",
  importedAt: "2026-08-25T00:00:00.000Z",
};

const req1 = {
  id: "req_001",
  jobDescriptionId: jd1.id,
  sourceText: "Experience with observability tooling",
};

const roleId = "role_principal_engineer";

function baseGraph(): CareerGraph {
  const capabilityId = deriveNodeId("capability", "generic", "AIOps");
  const skillId = deriveNodeId("skill", "generic", "Observability");

  return {
    id: "graph_1",
    version: 1,
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    sourceJobDescriptions: [jd1],
    role: {
      id: roleId,
      kind: "role",
      namespace: "generic",
      name: "Principal Engineer",
      parentIds: [],
      relatedNodeIds: [],
      provenance: [{ jobDescriptionId: jd1.id, requirementId: req1.id }],
    },
    nodes: [
      {
        id: capabilityId,
        kind: "capability",
        namespace: "generic",
        name: "AIOps",
        parentIds: [roleId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: jd1.id, requirementId: req1.id }],
      },
      {
        id: skillId,
        kind: "skill",
        namespace: "generic",
        name: "Observability",
        parentIds: [capabilityId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: jd1.id, requirementId: req1.id }],
      },
    ],
    requirements: [req1],
  };
}

describe("careerGraphSchema - structure", () => {
  it("accepts a minimal valid CareerGraph", () => {
    expect(() => careerGraphSchema.parse(baseGraph())).not.toThrow();
  });

  it("accepts a graph referencing multiple job descriptions", () => {
    const graph = baseGraph();
    const req2 = { id: "req_002", jobDescriptionId: jd2.id, sourceText: "text" };
    graph.sourceJobDescriptions.push(jd2);
    graph.requirements.push(req2);
    graph.nodes[0]!.provenance.push({
      jobDescriptionId: jd2.id,
      requirementId: req2.id,
    });
    expect(() => careerGraphSchema.parse(graph)).not.toThrow();
  });
});

describe("careerGraphSchema - node hierarchy", () => {
  it("accepts a node with multiple parents (e.g. Observability under AIOps and SRE)", () => {
    const graph = baseGraph();
    const sreCapabilityId = deriveNodeId("capability", "generic", "SRE");
    graph.nodes.push({
      id: sreCapabilityId,
      kind: "capability",
      namespace: "generic",
      name: "SRE",
      parentIds: [roleId],
      relatedNodeIds: [],
      provenance: [{ jobDescriptionId: jd1.id, requirementId: req1.id }],
    });
    const skill = graph.nodes.find((n) => n.kind === "skill")!;
    skill.parentIds.push(sreCapabilityId);

    const parsed = careerGraphSchema.parse(graph);
    const observability = parsed.nodes.find((n) => n.kind === "skill")!;
    expect(observability.parentIds).toEqual(
      expect.arrayContaining([
        deriveNodeId("capability", "generic", "AIOps"),
        sreCapabilityId,
      ]),
    );
  });

  it("rejects an invalid parent kind (Skill parented by Concept)", () => {
    const graph = baseGraph();
    const conceptId = deriveNodeId("concept", "generic", "Reliability");
    graph.nodes.push({
      id: conceptId,
      kind: "concept",
      namespace: "generic",
      name: "Reliability",
      parentIds: [deriveNodeId("skill", "generic", "Observability")],
      relatedNodeIds: [],
      provenance: [{ jobDescriptionId: jd1.id, requirementId: req1.id }],
    });
    const skill = graph.nodes.find((n) => n.kind === "skill")!;
    skill.parentIds = [conceptId];
    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });

  it("rejects dangling parentIds references", () => {
    const graph = baseGraph();
    graph.nodes[0]!.parentIds = ["role:does-not-exist"];
    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });

  it("rejects dangling relatedNodeIds references", () => {
    const graph = baseGraph();
    graph.nodes[0]!.relatedNodeIds = ["technology:generic:nonexistent"];
    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });
});

describe("careerGraphSchema - acyclicity", () => {
  it("rejects a direct cycle (node lists itself as a parent)", () => {
    const graph = baseGraph();
    graph.nodes[0]!.parentIds = [graph.nodes[0]!.id];
    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });

  it("rejects a transitive cycle", () => {
    const graph = baseGraph();
    const capability = graph.nodes.find((n) => n.kind === "capability")!;
    const skill = graph.nodes.find((n) => n.kind === "skill")!;
    // capability -> skill -> capability (skill is not a valid capability
    // parent kind-wise, but we only want to exercise cycle detection here,
    // so give capability an otherwise-valid extra parent kind: skill is
    // not allowed as a capability parent, so use a same-kind capability
    // cycle instead, which is kind-legal (capability's parent may be
    // capability).
    const cap2Id = deriveNodeId("capability", "generic", "SRE");
    graph.nodes.push({
      id: cap2Id,
      kind: "capability",
      namespace: "generic",
      name: "SRE",
      parentIds: [capability.id],
      relatedNodeIds: [],
      provenance: [{ jobDescriptionId: jd1.id, requirementId: req1.id }],
    });
    capability.parentIds = [cap2Id];
    void skill;
    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });

  it("allows a cycle in relatedNodeIds", () => {
    const graph = baseGraph();
    const capability = graph.nodes.find((n) => n.kind === "capability")!;
    const skill = graph.nodes.find((n) => n.kind === "skill")!;
    capability.relatedNodeIds = [skill.id];
    skill.relatedNodeIds = [capability.id];
    expect(() => careerGraphSchema.parse(graph)).not.toThrow();
  });
});

describe("careerGraphSchema - provenance and requirement integrity", () => {
  it("accumulates provenance from two requirements", () => {
    const graph = baseGraph();
    const req2 = { id: "req_002", jobDescriptionId: jd1.id, sourceText: "text 2" };
    graph.requirements.push(req2);
    const capability = graph.nodes.find((n) => n.kind === "capability")!;
    capability.provenance.push({
      jobDescriptionId: jd1.id,
      requirementId: req2.id,
    });
    const parsed = careerGraphSchema.parse(graph);
    const parsedCapability = parsed.nodes.find((n) => n.kind === "capability")!;
    expect(parsedCapability.provenance).toHaveLength(2);
  });

  it("rejects a dangling provenance.requirementId", () => {
    const graph = baseGraph();
    graph.nodes[0]!.provenance = [
      { jobDescriptionId: jd1.id, requirementId: "req_does_not_exist" },
    ];
    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });

  it("rejects a provenance jobDescriptionId that disagrees with its requirement's jobDescriptionId", () => {
    const graph = baseGraph();
    const req2 = { id: "req_002", jobDescriptionId: jd2.id, sourceText: "text 2" };
    graph.sourceJobDescriptions.push(jd2);
    graph.requirements.push(req2);
    graph.nodes[0]!.provenance = [
      { jobDescriptionId: jd1.id, requirementId: req2.id },
    ];
    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });

  it("rejects a Requirement with a dangling jobDescriptionId", () => {
    const graph = baseGraph();
    graph.requirements.push({
      id: "req_orphan",
      jobDescriptionId: "job_does_not_exist",
      sourceText: "orphan",
    });
    expect(() => careerGraphSchema.parse(graph)).toThrow();
  });
});
