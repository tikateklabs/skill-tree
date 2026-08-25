import { describe, expect, it } from "vitest";
import { requirementSchema } from "./requirement.js";

const jobDescriptionId = "job_wellsfargo_principal";

describe("requirementSchema - experience", () => {
  it("accepts a SINGLE-subject requirement (4+ years of experience with Python)", () => {
    const sourceText = "4+ years of experience with Python";
    const result = requirementSchema.parse({
      id: "req_python",
      jobDescriptionId,
      sourceText,
      experience: {
        minimumYears: 4,
        unit: "years",
        logic: "SINGLE",
        subjects: ["Python"],
      },
    });

    expect(result.sourceText).toBe(sourceText);
    expect(result.experience).toEqual({
      minimumYears: 4,
      unit: "years",
      logic: "SINGLE",
      subjects: ["Python"],
    });
  });

  it("accepts an OR-logic requirement with 4 subjects", () => {
    const sourceText =
      "5+ years of experience in AIOps, SRE, production engineering, or large-scale distributed systems operations";
    const result = requirementSchema.parse({
      id: "req_014",
      jobDescriptionId,
      sourceText,
      experience: {
        minimumYears: 5,
        unit: "years",
        logic: "OR",
        subjects: [
          "AIOps",
          "SRE",
          "Production Engineering",
          "Large-scale distributed systems operations",
        ],
      },
    });

    expect(result.sourceText).toBe(sourceText);
    expect(result.experience?.logic).toBe("OR");
    expect(result.experience?.subjects).toHaveLength(4);
    expect(result.experience?.minimumYears).toBe(5);
  });

  it("accepts an AND-logic requirement", () => {
    const result = requirementSchema.parse({
      id: "req_kt",
      jobDescriptionId,
      sourceText: "3+ years combined experience in Kubernetes and Terraform",
      experience: {
        minimumYears: 3,
        unit: "years",
        logic: "AND",
        subjects: ["Kubernetes", "Terraform"],
      },
    });
    expect(result.experience?.logic).toBe("AND");
    expect(result.experience?.subjects).toEqual(["Kubernetes", "Terraform"]);
  });

  it("accepts a range requirement (3-5 years)", () => {
    const result = requirementSchema.parse({
      id: "req_aws",
      jobDescriptionId,
      sourceText: "3-5 years of experience with AWS",
      experience: {
        minimumYears: 3,
        maximumYears: 5,
        unit: "years",
        logic: "SINGLE",
        subjects: ["AWS"],
      },
    });
    expect(result.experience?.minimumYears).toBe(3);
    expect(result.experience?.maximumYears).toBe(5);
  });

  it("accepts a non-experience requirement with experience absent", () => {
    const result = requirementSchema.parse({
      id: "req_oncall",
      jobDescriptionId,
      sourceText: "Must have led an on-call rotation for a production SRE team",
    });
    expect(result.experience).toBeUndefined();
    expect("experience" in result).toBe(false);
  });

  it("rejects SINGLE logic with more than one subject", () => {
    expect(() =>
      requirementSchema.parse({
        id: "req_bad",
        jobDescriptionId,
        sourceText: "bad",
        experience: {
          minimumYears: 1,
          unit: "years",
          logic: "SINGLE",
          subjects: ["Python", "Go"],
        },
      }),
    ).toThrow();
  });

  it("rejects OR logic with fewer than two subjects", () => {
    expect(() =>
      requirementSchema.parse({
        id: "req_bad",
        jobDescriptionId,
        sourceText: "bad",
        experience: {
          minimumYears: 1,
          unit: "years",
          logic: "OR",
          subjects: ["Python"],
        },
      }),
    ).toThrow();
  });

  it("rejects maximumYears below minimumYears", () => {
    expect(() =>
      requirementSchema.parse({
        id: "req_bad",
        jobDescriptionId,
        sourceText: "bad",
        experience: {
          minimumYears: 5,
          maximumYears: 3,
          unit: "years",
          logic: "SINGLE",
          subjects: ["AWS"],
        },
      }),
    ).toThrow();
  });

  it("never represents personal experience - no such field exists on the schema", () => {
    const shape = requirementSchema.def.shape;
    expect(Object.keys(shape)).toEqual([
      "id",
      "jobDescriptionId",
      "sourceText",
      "experience",
    ]);
    const experienceShape = shape.experience.unwrap().def.shape;
    expect(Object.keys(experienceShape)).toEqual([
      "minimumYears",
      "maximumYears",
      "unit",
      "logic",
      "subjects",
    ]);
  });
});
