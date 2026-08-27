import { describe, expect, it } from "vitest";
import { evidenceSourceSchema } from "./evidenceSource.js";

describe("evidenceSourceSchema", () => {
  it("preserves rawText verbatim across all source kinds", () => {
    const rawText = "Senior Engineer\n  - Led migration...\n\t* Kubernetes, Docker";
    const result = evidenceSourceSchema.parse({
      id: "src_naukri",
      kind: "naukri_profile",
      rawText,
      importedAt: "2026-08-27T00:00:00.000Z",
    });
    expect(result.rawText).toBe(rawText);
  });

  it("accepts each source kind", () => {
    for (const kind of ["naukri_profile", "resume", "user_addendum"] as const) {
      const result = evidenceSourceSchema.parse({
        id: `src_${kind}`,
        kind,
        rawText: "text",
        importedAt: "2026-08-27T00:00:00.000Z",
      });
      expect(result.kind).toBe(kind);
    }
  });

  it("rejects an unknown kind", () => {
    expect(() =>
      evidenceSourceSchema.parse({
        id: "src_x",
        kind: "linkedin_pdf",
        rawText: "text",
        importedAt: "2026-08-27T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
