import { describe, expect, it } from "vitest";
import { deriveNodeId } from "./id.js";
import { graphNodeSchema, roleSchema } from "./node.js";

const provenance = [{ jobDescriptionId: "job_a", requirementId: "req_a" }];

describe("graphNodeSchema", () => {
  it("accepts a node whose id matches its derived canonical id", () => {
    const id = deriveNodeId("technology", "generic", "Prometheus");
    const node = graphNodeSchema.parse({
      id,
      kind: "technology",
      namespace: "generic",
      name: "Prometheus",
      parentIds: ["skill:generic:observability"],
      relatedNodeIds: [],
      provenance,
    });
    expect(node.id).toBe("technology:generic:prometheus");
  });

  it("rejects a node whose stored id does not match its derivation", () => {
    expect(() =>
      graphNodeSchema.parse({
        id: "technology:generic:wrong-id",
        kind: "technology",
        namespace: "generic",
        name: "Prometheus",
        parentIds: ["skill:generic:observability"],
        relatedNodeIds: [],
        provenance,
      }),
    ).toThrow();
  });

  it("rejects a node with empty provenance", () => {
    expect(() =>
      graphNodeSchema.parse({
        id: deriveNodeId("technology", "generic", "Prometheus"),
        kind: "technology",
        namespace: "generic",
        name: "Prometheus",
        parentIds: ["skill:generic:observability"],
        relatedNodeIds: [],
        provenance: [],
      }),
    ).toThrow();
  });

  it("rejects a non-Role node with empty parentIds", () => {
    expect(() =>
      graphNodeSchema.parse({
        id: deriveNodeId("technology", "generic", "Prometheus"),
        kind: "technology",
        namespace: "generic",
        name: "Prometheus",
        parentIds: [],
        relatedNodeIds: [],
        provenance,
      }),
    ).toThrow();
  });

  it("rejects an invalid kind discriminant (e.g. 'role' is not a graph node)", () => {
    expect(() =>
      graphNodeSchema.parse({
        id: "role:generic:principal-engineer",
        kind: "role",
        namespace: "generic",
        name: "Principal Engineer",
        parentIds: [],
        relatedNodeIds: [],
        provenance,
      }),
    ).toThrow();
  });
});

describe("roleSchema", () => {
  it("accepts a Role with empty parentIds and an opaque id", () => {
    const role = roleSchema.parse({
      id: "role_principal_engineer",
      kind: "role",
      namespace: "generic",
      name: "Principal Engineer",
      parentIds: [],
      relatedNodeIds: [],
      provenance,
    });
    expect(role.parentIds).toEqual([]);
  });

  it("rejects a Role with a non-empty parentIds", () => {
    expect(() =>
      roleSchema.parse({
        id: "role_principal_engineer",
        kind: "role",
        namespace: "generic",
        name: "Principal Engineer",
        parentIds: ["capability:generic:something"],
        relatedNodeIds: [],
        provenance,
      }),
    ).toThrow();
  });
});
