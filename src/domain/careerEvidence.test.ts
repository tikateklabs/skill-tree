import { describe, expect, it } from "vitest";
import { careerEvidenceSchema } from "./careerEvidence.js";

describe("careerEvidenceSchema", () => {
  it("stores PROVEN evidence verbatim", () => {
    const sourceText =
      "Led migration of 40+ microservices to Kubernetes, reducing deployment time by 60%";
    const result = careerEvidenceSchema.parse({
      id: "ev_1",
      sourceId: "src_naukri",
      sourceText,
      status: "PROVEN",
    });
    expect(result.sourceText).toBe(sourceText);
    expect(result.status).toBe("PROVEN");
  });

  it("distinguishes EMERGING from PROVEN evidence", () => {
    const result = careerEvidenceSchema.parse({
      id: "ev_2",
      sourceId: "src_naukri",
      sourceText: "Kubernetes",
      status: "EMERGING",
    });
    expect(result.status).toBe("EMERGING");
  });

  it("rejects an invalid status", () => {
    expect(() =>
      careerEvidenceSchema.parse({
        id: "ev_3",
        sourceId: "src_naukri",
        sourceText: "text",
        status: "ASPIRATIONAL",
      }),
    ).toThrow();
  });
});
