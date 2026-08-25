import { z } from "zod";

const experienceLogicSchema = z.enum(["SINGLE", "AND", "OR"]);

/**
 * Structured years-of-experience data for a `Requirement` whose JD
 * sentence states one. `unit` is a literal for V1 (years only) but kept
 * as a field, not implied, so a future unit (e.g. months) doesn't require
 * a shape migration.
 */
export const experienceDetailsSchema = z
  .object({
    minimumYears: z.number().min(0),
    maximumYears: z.number().min(0).optional(),
    unit: z.literal("years"),
    logic: experienceLogicSchema,
    subjects: z.array(z.string().min(1)),
  })
  .strict()
  .superRefine((experience, ctx) => {
    if (
      experience.maximumYears !== undefined &&
      experience.maximumYears < experience.minimumYears
    ) {
      ctx.addIssue({
        code: "custom",
        message: "maximumYears must be >= minimumYears",
        path: ["maximumYears"],
      });
    }

    if (experience.logic === "SINGLE" && experience.subjects.length !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "subjects must contain exactly 1 entry when logic is SINGLE",
        path: ["subjects"],
      });
    }

    if (
      (experience.logic === "AND" || experience.logic === "OR") &&
      experience.subjects.length < 2
    ) {
      ctx.addIssue({
        code: "custom",
        message: "subjects must contain at least 2 entries when logic is AND or OR",
        path: ["subjects"],
      });
    }
  });

export type ExperienceDetails = z.infer<typeof experienceDetailsSchema>;

/**
 * One atomic, JD-derived requirement statement. `experience` is present
 * only when the statement states a years-of-experience constraint; a
 * `Requirement` with no `experience` is still a valid, traceable node
 * source (e.g. "must have led an SRE team").
 */
export const requirementSchema = z
  .object({
    id: z.string().min(1),
    jobDescriptionId: z.string().min(1),
    sourceText: z.string().min(1),
    experience: experienceDetailsSchema.optional(),
  })
  .strict();

export type Requirement = z.infer<typeof requirementSchema>;
