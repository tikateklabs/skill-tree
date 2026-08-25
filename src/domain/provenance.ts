import { z } from "zod";

/**
 * Links a node to the Requirement it was derived from. Deliberately a
 * reference (`requirementId`), not a copy of the JD wording - the wording
 * itself lives once on `Requirement.sourceText`. See spec.md -
 * "Provenance establishes Job -> Requirement -> Node traceability".
 */
export const provenanceSchema = z
  .object({
    jobDescriptionId: z.string().min(1),
    requirementId: z.string().min(1),
    rationale: z.string().min(1).optional(),
  })
  .strict();

export type Provenance = z.infer<typeof provenanceSchema>;
