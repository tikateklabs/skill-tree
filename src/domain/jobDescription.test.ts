import { describe, expect, it } from "vitest";
import { jobDescriptionSchema } from "./jobDescription.js";

describe("jobDescriptionSchema", () => {
  it("preserves rawText verbatim, including irregular whitespace and bullets", () => {
    const rawText = "Responsibilities:\n • 4+ years of experience with Python\n\t- 5+ years of experience in AIOps, SRE,   production engineering,\nor large-scale distributed systems operations\n";
    const result = jobDescriptionSchema.parse({
      id: "job_wellsfargo_principal",
      title: "Principal Engineer",
      company: "Wells Fargo",
      rawText,
      importedAt: "2026-08-25T00:00:00.000Z",
    });

    expect(result.rawText).toBe(rawText);
  });

  it("rejects empty rawText", () => {
    expect(() =>
      jobDescriptionSchema.parse({
        id: "job_x",
        title: "Role",
        rawText: "",
        importedAt: "2026-08-25T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
