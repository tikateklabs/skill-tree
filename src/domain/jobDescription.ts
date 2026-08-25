import { z } from "zod";

/**
 * `rawText` is stored exactly as imported - no trimming or
 * reformatting - so later quote-matching against it stays exact.
 */
export const jobDescriptionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    company: z.string().min(1).optional(),
    rawText: z.string().min(1),
    importedAt: z.iso.datetime(),
  })
  .strict();

export type JobDescription = z.infer<typeof jobDescriptionSchema>;
