import { z } from "zod";

/**
 * Where a piece of CareerProfile data came from. `rawText` is stored
 * exactly as pasted/typed - no trimming or reformatting - so later
 * quote-matching against it stays exact, mirroring JobDescription.
 */
export const evidenceSourceSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["naukri_profile", "resume", "user_addendum"]),
    rawText: z.string().min(1),
    importedAt: z.iso.datetime(),
  })
  .strict();

export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;
