import { z } from "zod";

/**
 * An atomic, verbatim-sourced claim about something the user has
 * actually done. `PROVEN` = the source text substantiates it directly
 * (specifics, outcomes); `EMERGING` = mentioned but not strongly
 * substantiated (e.g. named once in a skills list with no supporting
 * description). Classified by the external AI during extraction (see
 * design.md) - this schema defines and validates the shape, not the
 * classification logic. Never represents something the user aspires to
 * but has not done - see CareerAspiration.
 */
export const careerEvidenceSchema = z
  .object({
    id: z.string().min(1),
    sourceId: z.string().min(1),
    sourceText: z.string().min(1),
    status: z.enum(["PROVEN", "EMERGING"]),
  })
  .strict();

export type CareerEvidence = z.infer<typeof careerEvidenceSchema>;
