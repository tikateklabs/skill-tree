import { describe, expect, it } from "vitest";
import { careerAspirationSchema } from "./careerAspiration.js";

describe("careerAspirationSchema", () => {
  it("stores an aspiration without requiring any evidence to exist", () => {
    const result = careerAspirationSchema.parse({
      id: "asp_1",
      sourceText: "I want to move toward AI leadership",
    });
    expect(result.sourceText).toBe("I want to move toward AI leadership");
  });

  it("has no status field distinguishing proven/emerging - structurally separate from CareerEvidence", () => {
    const shape = careerAspirationSchema.def.shape;
    expect(Object.keys(shape).sort()).toEqual(["id", "relatedNodeHint", "sourceText"].sort());
  });

  it("accepts an optional relatedNodeHint", () => {
    const result = careerAspirationSchema.parse({
      id: "asp_2",
      sourceText: "AI leadership",
      relatedNodeHint: "capability:generic:ai-strategy",
    });
    expect(result.relatedNodeHint).toBe("capability:generic:ai-strategy");
  });
});
