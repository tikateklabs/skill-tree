import { describe, expect, it } from "vitest";
import { careerProfileSchema, type CareerProfile } from "./careerProfile.js";
import { deriveNodeId } from "./id.js";

const source = {
  id: "src_naukri",
  kind: "naukri_profile" as const,
  rawText: "Full Naukri profile text",
  importedAt: "2026-08-27T00:00:00.000Z",
};

const roleA = { id: "role_a", title: "Senior Engineer", company: "Acme", sourceId: source.id };
const roleB = { id: "role_b", title: "Lead Engineer", company: "Globex", sourceId: source.id };

const evidence = {
  id: "ev_1",
  sourceId: source.id,
  sourceText: "Led Kubernetes migration",
  status: "PROVEN" as const,
};

function baseProfile(): CareerProfile {
  return {
    id: "profile_1",
    version: 1,
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    sources: [source],
    roleHistory: [roleA],
    nodes: [
      {
        id: deriveNodeId("technology", "generic", "Kubernetes"),
        kind: "technology",
        namespace: "generic",
        name: "Kubernetes",
        roleHistoryEntryIds: [roleA.id],
        provenance: [{ sourceId: source.id, evidenceId: evidence.id }],
      },
    ],
    evidence: [evidence],
    aspirations: [],
  };
}

describe("careerProfileSchema - structure", () => {
  it("accepts a minimal valid CareerProfile", () => {
    expect(() => careerProfileSchema.parse(baseProfile())).not.toThrow();
  });

  it("accepts multiple role-history entries from different companies", () => {
    const profile = baseProfile();
    profile.roleHistory.push(roleB);
    profile.nodes[0]!.roleHistoryEntryIds.push(roleB.id);
    expect(() => careerProfileSchema.parse(profile)).not.toThrow();
  });

  it("accepts aspirations with no corresponding evidence or node", () => {
    const profile = baseProfile();
    profile.aspirations.push({ id: "asp_1", sourceText: "I want to move toward AI leadership" });
    const parsed = careerProfileSchema.parse(profile);
    expect(parsed.aspirations).toHaveLength(1);
  });
});

describe("careerProfileSchema - referential integrity", () => {
  it("rejects a dangling roleHistoryEntryIds reference", () => {
    const profile = baseProfile();
    profile.nodes[0]!.roleHistoryEntryIds = ["role_does_not_exist"];
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });

  it("rejects a dangling provenance.evidenceId reference", () => {
    const profile = baseProfile();
    profile.nodes[0]!.provenance = [{ sourceId: source.id, evidenceId: "ev_does_not_exist" }];
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });

  it("rejects provenance referencing an aspiration id instead of an evidence id", () => {
    const profile = baseProfile();
    profile.aspirations.push({ id: "asp_1", sourceText: "AI leadership" });
    profile.nodes[0]!.provenance = [{ sourceId: source.id, evidenceId: "asp_1" }];
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });

  it("rejects a dangling CareerRoleHistoryEntry.sourceId reference", () => {
    const profile = baseProfile();
    profile.roleHistory[0]!.sourceId = "src_does_not_exist";
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });
});

describe("careerProfileSchema - provenance sourceId/evidenceId pairing", () => {
  it("rejects a provenance sourceId that disagrees with its evidence's sourceId", () => {
    const profile = baseProfile();
    profile.sources.push({
      id: "src_other",
      kind: "user_addendum",
      rawText: "addendum text",
      importedAt: "2026-08-27T00:00:00.000Z",
    });
    profile.nodes[0]!.provenance = [{ sourceId: "src_other", evidenceId: evidence.id }];
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });
});
