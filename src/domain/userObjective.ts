import { z } from "zod";

/**
 * A plain structured compensation figure - not free text requiring
 * interpretation, since a stated compensation figure is already simple,
 * unambiguous data.
 */
export const compensationFigureSchema = z
  .object({
    amount: z.number().min(0),
    currency: z.string().min(1),
    period: z.enum(["annual", "monthly"]),
  })
  .strict();

export type CompensationFigure = z.infer<typeof compensationFigureSchema>;

/**
 * A free-text preference with an optional structured distillation.
 * `sourceText` is always the user's verbatim statement. `interpreted`
 * is a structured value when one can be confidently derived, and `null`
 * - never fabricated or guessed - when it cannot.
 */
export const interpretedPreferenceSchema = z
  .object({
    sourceText: z.string().min(1),
    interpreted: z.string().min(1).nullable(),
  })
  .strict();

export type InterpretedPreference = z.infer<typeof interpretedPreferenceSchema>;

/**
 * The user's compensation target and career preferences - the
 * constraint the rest of the system evaluates recommendations against,
 * not an assumption of what is achievable. Every field is optional: the
 * user is not required to state a preference they don't have.
 */
export const userObjectiveSchema = z
  .object({
    currentCompensation: compensationFigureSchema.nullable(),
    targetCompensation: compensationFigureSchema.nullable(),
    locationPreference: interpretedPreferenceSchema.nullable(),
    companyPreference: interpretedPreferenceSchema.nullable(),
    roleDirectionPreference: interpretedPreferenceSchema.nullable(),
    industryPreferences: z
      .object({
        prefer: z.array(interpretedPreferenceSchema),
        avoid: z.array(interpretedPreferenceSchema),
      })
      .strict(),
    otherPreferences: z.array(interpretedPreferenceSchema),
  })
  .strict();

export type UserObjective = z.infer<typeof userObjectiveSchema>;
