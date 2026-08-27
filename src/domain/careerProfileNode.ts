import { z } from "zod";
import { deriveNodeId, type DerivableNodeKind } from "./id.js";

const NODE_KINDS = [
  "capability",
  "skill",
  "concept",
  "technology",
  "tool",
] as const satisfies readonly DerivableNodeKind[];

/**
 * CareerProfileNode's provenance is a distinct shape from CareerGraph's
 * `Provenance` (`{jobDescriptionId, requirementId}`) - deliberately not
 * reused as the same export, since the two mean different things
 * (JD requirement vs. the user's own evidence). References only
 * CareerEvidence, never CareerAspiration - a node cannot exist solely
 * because the user aspires to it.
 */
export const careerProfileProvenanceSchema = z
  .object({
    sourceId: z.string().min(1),
    evidenceId: z.string().min(1),
    rationale: z.string().min(1).optional(),
  })
  .strict();

export type CareerProfileProvenance = z.infer<typeof careerProfileProvenanceSchema>;

/**
 * A skill/technology/etc. the user's career evidence demonstrates. Uses
 * the same five non-Role kinds and the same canonical id derivation
 * (`deriveNodeId`, imported unchanged from CareerGraph's id.ts) so a
 * node like `technology:generic:kubernetes` means the same thing here
 * and in a CareerGraph - what makes gap computation a plain id
 * comparison later.
 */
export const careerProfileNodeSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(NODE_KINDS),
    namespace: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    roleHistoryEntryIds: z.array(z.string().min(1)).min(1),
    provenance: z.array(careerProfileProvenanceSchema).min(1),
  })
  .strict()
  .superRefine((node, ctx) => {
    const expected = deriveNodeId(node.kind, node.namespace, node.name);
    if (node.id !== expected) {
      ctx.addIssue({
        code: "custom",
        message: `id "${node.id}" does not match derived canonical id "${expected}"`,
        path: ["id"],
      });
    }
  });

export type CareerProfileNode = z.infer<typeof careerProfileNodeSchema>;
