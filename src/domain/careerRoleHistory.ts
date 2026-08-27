import { z } from "zod";

/**
 * One past or current role in the user's career. Unlike CareerGraph's
 * single `Role` (exactly one per graph, correct for "one JD describes
 * one role"), a CareerProfile supports more than one of these, since a
 * career spans multiple employers/roles over time.
 */
export const careerRoleHistoryEntrySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    company: z.string().min(1).optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
    sourceId: z.string().min(1),
  })
  .strict();

export type CareerRoleHistoryEntry = z.infer<typeof careerRoleHistoryEntrySchema>;
