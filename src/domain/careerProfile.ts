import { z } from "zod";
import { evidenceSourceSchema } from "./evidenceSource.js";
import { careerRoleHistoryEntrySchema } from "./careerRoleHistory.js";
import { careerProfileNodeSchema } from "./careerProfileNode.js";
import { careerEvidenceSchema } from "./careerEvidence.js";
import { careerAspirationSchema } from "./careerAspiration.js";

export const careerProfileSchema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().min(0),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    sources: z.array(evidenceSourceSchema),
    roleHistory: z.array(careerRoleHistoryEntrySchema),
    nodes: z.array(careerProfileNodeSchema),
    evidence: z.array(careerEvidenceSchema),
    aspirations: z.array(careerAspirationSchema),
  })
  .strict()
  .superRefine((profile, ctx) => {
    const sourceIds = new Set<string>();
    for (const [index, source] of profile.sources.entries()) {
      if (sourceIds.has(source.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate EvidenceSource id "${source.id}"`,
          path: ["sources", index, "id"],
        });
      }
      sourceIds.add(source.id);
    }

    const roleHistoryIds = new Set<string>();
    profile.roleHistory.forEach((entry, index) => {
      if (roleHistoryIds.has(entry.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate CareerRoleHistoryEntry id "${entry.id}"`,
          path: ["roleHistory", index, "id"],
        });
      }
      roleHistoryIds.add(entry.id);

      if (!sourceIds.has(entry.sourceId)) {
        ctx.addIssue({
          code: "custom",
          message: `CareerRoleHistoryEntry "${entry.id}" references unknown sourceId "${entry.sourceId}"`,
          path: ["roleHistory", index, "sourceId"],
        });
      }
    });

    const evidenceById = new Map(profile.evidence.map((e) => [e.id, e]));
    profile.evidence.forEach((evidence, index) => {
      if (!sourceIds.has(evidence.sourceId)) {
        ctx.addIssue({
          code: "custom",
          message: `CareerEvidence "${evidence.id}" references unknown sourceId "${evidence.sourceId}"`,
          path: ["evidence", index, "sourceId"],
        });
      }
    });

    profile.nodes.forEach((node, nodeIndex) => {
      node.roleHistoryEntryIds.forEach((id, idIndex) => {
        if (!roleHistoryIds.has(id)) {
          ctx.addIssue({
            code: "custom",
            message: `roleHistoryEntryIds references unknown CareerRoleHistoryEntry id "${id}"`,
            path: ["nodes", nodeIndex, "roleHistoryEntryIds", idIndex],
          });
        }
      });

      node.provenance.forEach((entry, provIndex) => {
        if (!sourceIds.has(entry.sourceId)) {
          ctx.addIssue({
            code: "custom",
            message: `provenance references unknown sourceId "${entry.sourceId}"`,
            path: ["nodes", nodeIndex, "provenance", provIndex, "sourceId"],
          });
        }

        const evidence = evidenceById.get(entry.evidenceId);
        if (!evidence) {
          // Deliberately includes the case where evidenceId resolves to
          // a CareerAspiration instead: aspirations are not indexed in
          // evidenceById, so referencing one is indistinguishable from a
          // dangling reference - a node cannot exist solely because the
          // user aspires to it.
          ctx.addIssue({
            code: "custom",
            message: `provenance references unknown evidenceId "${entry.evidenceId}" (must be a CareerEvidence id, not a CareerAspiration id)`,
            path: ["nodes", nodeIndex, "provenance", provIndex, "evidenceId"],
          });
          return;
        }

        if (evidence.sourceId !== entry.sourceId) {
          ctx.addIssue({
            code: "custom",
            message: `provenance sourceId "${entry.sourceId}" does not match evidence "${evidence.id}"'s sourceId "${evidence.sourceId}"`,
            path: ["nodes", nodeIndex, "provenance", provIndex, "sourceId"],
          });
        }
      });
    });
  });

export type CareerProfile = z.infer<typeof careerProfileSchema>;
