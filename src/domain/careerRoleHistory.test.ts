import { describe, expect, it } from "vitest";
import { careerRoleHistoryEntrySchema } from "./careerRoleHistory.js";

describe("careerRoleHistoryEntrySchema", () => {
  it("accepts a role history entry with company and dates", () => {
    const result = careerRoleHistoryEntrySchema.parse({
      id: "role_1",
      title: "Senior Engineer",
      company: "Acme Corp",
      startDate: "2020-01-01",
      endDate: "2023-06-30",
      sourceId: "src_naukri",
    });
    expect(result.title).toBe("Senior Engineer");
  });

  it("accepts a minimal entry with only title and sourceId", () => {
    const result = careerRoleHistoryEntrySchema.parse({
      id: "role_2",
      title: "Lead Engineer",
      sourceId: "src_naukri",
    });
    expect(result.company).toBeUndefined();
  });
});
