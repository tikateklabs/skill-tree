import { describe, expect, it } from "vitest";
import { careerProfileSchema } from "../domain/careerProfile.js";
import { userObjectiveSchema } from "../domain/userObjective.js";
import {
  buildCareerProfileFixture,
  careerProfileFixtureNodeIds,
  KUBERNETES_PROVEN_TEXT,
  PYTHON_EMERGING_TEXT,
} from "./careerProfileFixture.js";
import { buildUserObjectiveFixture } from "./userObjectiveFixture.js";
import { buildCareerGraphFixture, nodeIds as careerGraphNodeIds } from "./careerGraphFixture.js";

describe("careerProfileFixture", () => {
  it("validates against the CareerProfile schema", () => {
    const parsed = careerProfileSchema.parse(buildCareerProfileFixture());
    expect(parsed.nodes.length).toBeGreaterThan(0);
  });

  it("has a node demonstrated across both role-history entries", () => {
    const profile = careerProfileSchema.parse(buildCareerProfileFixture());
    const kubernetes = profile.nodes.find(
      (n) => n.id === careerProfileFixtureNodeIds.technologyKubernetesId,
    )!;
    expect(kubernetes.roleHistoryEntryIds).toEqual(
      expect.arrayContaining([
        careerProfileFixtureNodeIds.roleAcmeId,
        careerProfileFixtureNodeIds.roleGlobexId,
      ]),
    );
  });

  it("has both a PROVEN and an EMERGING evidence entry, verbatim", () => {
    const profile = careerProfileSchema.parse(buildCareerProfileFixture());
    const proven = profile.evidence.find((e) => e.status === "PROVEN")!;
    const emerging = profile.evidence.find((e) => e.status === "EMERGING")!;
    expect(proven.sourceText).toBe(KUBERNETES_PROVEN_TEXT);
    expect(emerging.sourceText).toBe(PYTHON_EMERGING_TEXT);
  });

  it("has an aspiration requiring no evidence", () => {
    const profile = careerProfileSchema.parse(buildCareerProfileFixture());
    expect(profile.aspirations).toHaveLength(1);
  });

  it("shares its Python node's canonical id with the CareerGraph reference fixture", () => {
    const careerProfile = careerProfileSchema.parse(buildCareerProfileFixture());
    const careerGraph = buildCareerGraphFixture();

    const profilePythonId = careerProfileFixtureNodeIds.technologyPythonId;
    const graphPythonId = careerGraphNodeIds.technologyPythonId;

    expect(profilePythonId).toBe(graphPythonId);
    expect(careerProfile.nodes.some((n) => n.id === profilePythonId)).toBe(true);
    expect(careerGraph.nodes.some((n) => n.id === graphPythonId)).toBe(true);
  });
});

describe("careerProfileFixture - rejection paths", () => {
  it("rejects an empty-provenance variant", () => {
    const profile = buildCareerProfileFixture();
    profile.nodes[0]!.provenance = [];
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });

  it("rejects a mismatched sourceId/evidenceId pairing variant", () => {
    const profile = buildCareerProfileFixture();
    profile.sources.push({
      id: "src_other",
      kind: "resume",
      rawText: "other resume text",
      importedAt: "2026-08-27T00:00:00.000Z",
    });
    profile.nodes[0]!.provenance = [
      { sourceId: "src_other", evidenceId: profile.evidence[0]!.id },
    ];
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });

  it("rejects a dangling role-history reference variant", () => {
    const profile = buildCareerProfileFixture();
    profile.nodes[0]!.roleHistoryEntryIds = ["role_does_not_exist"];
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });
});

describe("userObjectiveFixture", () => {
  it("validates against the UserObjective schema", () => {
    const parsed = userObjectiveSchema.parse(buildUserObjectiveFixture());
    expect(parsed.currentCompensation?.amount).toBe(4_000_000);
    expect(parsed.targetCompensation?.amount).toBe(8_000_000);
  });

  it("has at least one preference with a non-null interpretation and one with null", () => {
    const objective = userObjectiveSchema.parse(buildUserObjectiveFixture());
    expect(objective.companyPreference?.interpreted).not.toBeNull();
    expect(objective.roleDirectionPreference?.interpreted).toBeNull();
    expect(objective.roleDirectionPreference?.sourceText).toBeTruthy();
  });
});
