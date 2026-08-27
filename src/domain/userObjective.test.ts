import { describe, expect, it } from "vitest";
import { compensationFigureSchema, userObjectiveSchema } from "./userObjective.js";

function emptyObjective() {
  return {
    currentCompensation: null,
    targetCompensation: null,
    locationPreference: null,
    companyPreference: null,
    roleDirectionPreference: null,
    industryPreferences: { prefer: [], avoid: [] },
    otherPreferences: [],
  };
}

describe("userObjectiveSchema", () => {
  it("accepts a minimal objective with only compensation figures", () => {
    const objective = {
      ...emptyObjective(),
      currentCompensation: { amount: 4_000_000, currency: "INR", period: "annual" as const },
      targetCompensation: { amount: 8_000_000, currency: "INR", period: "annual" as const },
    };
    const result = userObjectiveSchema.parse(objective);
    expect(result.currentCompensation?.amount).toBe(4_000_000);
    expect(result.targetCompensation?.amount).toBe(8_000_000);
  });

  it("stores compensation figures as given with no interpretation step", () => {
    const shape = compensationFigureSchema.def.shape;
    expect(Object.keys(shape).sort()).toEqual(["amount", "currency", "period"]);
  });

  it("stores an interpreted preference alongside its verbatim source text", () => {
    const objective = {
      ...emptyObjective(),
      companyPreference: {
        sourceText:
          "I prefer working for a product company compared to services companies that primarily work for clients or contract engagements",
        interpreted: "product",
      },
    };
    const result = userObjectiveSchema.parse(objective);
    expect(result.companyPreference?.sourceText).toContain("product company");
    expect(result.companyPreference?.interpreted).toBe("product");
  });

  it("stores an uninterpretable preference with a null interpretation, never fabricated", () => {
    const objective = {
      ...emptyObjective(),
      roleDirectionPreference: {
        sourceText: "something ambiguous the AI couldn't confidently structure",
        interpreted: null,
      },
    };
    const result = userObjectiveSchema.parse(objective);
    expect(result.roleDirectionPreference?.interpreted).toBeNull();
    expect(result.roleDirectionPreference?.sourceText).toBeTruthy();
  });

  it("allows only an avoid-list to be stated, with prefer defaulting to empty", () => {
    const objective = {
      ...emptyObjective(),
      industryPreferences: {
        prefer: [],
        avoid: [{ sourceText: "avoid pure services/staffing companies", interpreted: "services" }],
      },
    };
    const result = userObjectiveSchema.parse(objective);
    expect(result.industryPreferences.prefer).toEqual([]);
    expect(result.industryPreferences.avoid).toHaveLength(1);
  });

  it("does not mark targetCompensation as achievable or validated - that evaluation belongs to a later change", () => {
    const shape = compensationFigureSchema.def.shape;
    // If achievability tracking existed, it would live on
    // CompensationFigure (the type targetCompensation uses) or as a
    // sibling field on UserObjective - neither exists here.
    expect(Object.keys(shape)).not.toContain("achievable");
    expect(Object.keys(shape)).not.toContain("validated");
    const objectiveShape = userObjectiveSchema.def.shape;
    expect(Object.keys(objectiveShape)).not.toContain("targetAchievable");
  });

  it("rejects an invalid compensation period", () => {
    const objective = {
      ...emptyObjective(),
      currentCompensation: { amount: 100, currency: "INR", period: "weekly" },
    };
    expect(() => userObjectiveSchema.parse(objective)).toThrow();
  });
});
