import { describe, expect, it } from "vitest";
import { deriveNodeId } from "./id.js";
import { careerProfileNodeSchema } from "./careerProfileNode.js";

const provenance = [{ sourceId: "src_naukri", evidenceId: "ev_1" }];

describe("careerProfileNodeSchema", () => {
  it("derives the same canonical id as a CareerGraph node with the same kind/namespace/name", () => {
    const careerProfileId = deriveNodeId("technology", "generic", "Kubernetes");
    const careerGraphId = deriveNodeId("technology", "generic", "Kubernetes");
    expect(careerProfileId).toBe(careerGraphId);
    expect(careerProfileId).toBe("technology:generic:kubernetes");

    const node = careerProfileNodeSchema.parse({
      id: careerProfileId,
      kind: "technology",
      namespace: "generic",
      name: "Kubernetes",
      roleHistoryEntryIds: ["role_1"],
      provenance,
    });
    expect(node.id).toBe("technology:generic:kubernetes");
  });

  it("accepts a node demonstrated across multiple past roles", () => {
    const node = careerProfileNodeSchema.parse({
      id: deriveNodeId("skill", "generic", "Distributed Systems"),
      kind: "skill",
      namespace: "generic",
      name: "Distributed Systems",
      roleHistoryEntryIds: ["role_1", "role_2"],
      provenance,
    });
    expect(node.roleHistoryEntryIds).toEqual(["role_1", "role_2"]);
  });

  it("rejects a stored id that does not match its derivation", () => {
    expect(() =>
      careerProfileNodeSchema.parse({
        id: "technology:generic:wrong",
        kind: "technology",
        namespace: "generic",
        name: "Kubernetes",
        roleHistoryEntryIds: ["role_1"],
        provenance,
      }),
    ).toThrow();
  });

  it("rejects a node with empty provenance", () => {
    expect(() =>
      careerProfileNodeSchema.parse({
        id: deriveNodeId("technology", "generic", "Kubernetes"),
        kind: "technology",
        namespace: "generic",
        name: "Kubernetes",
        roleHistoryEntryIds: ["role_1"],
        provenance: [],
      }),
    ).toThrow();
  });

  it("rejects a node with no role history entries", () => {
    expect(() =>
      careerProfileNodeSchema.parse({
        id: deriveNodeId("technology", "generic", "Kubernetes"),
        kind: "technology",
        namespace: "generic",
        name: "Kubernetes",
        roleHistoryEntryIds: [],
        provenance,
      }),
    ).toThrow();
  });
});
