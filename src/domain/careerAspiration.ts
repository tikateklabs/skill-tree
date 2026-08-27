import { z } from "zod";

/**
 * A free-text statement of what the user wants to be known for - kept
 * structurally separate from CareerEvidence (not a third status on it)
 * since an aspiration by definition has no evidence backing it; a
 * shared shape would allow an incoherent "PROVEN aspiration" state.
 * `relatedNodeHint` is an optional, unvalidated free-text hint, not a
 * referential-integrity-checked reference - resolving an aspiration to
 * specific market capability nodes is a later change's job.
 */
export const careerAspirationSchema = z
  .object({
    id: z.string().min(1),
    sourceText: z.string().min(1),
    relatedNodeHint: z.string().min(1).optional(),
  })
  .strict();

export type CareerAspiration = z.infer<typeof careerAspirationSchema>;
