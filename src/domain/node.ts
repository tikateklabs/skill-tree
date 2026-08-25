import { z } from "zod";
import { deriveNodeId, type DerivableNodeKind } from "./id.js";
import { provenanceSchema } from "./provenance.js";

const NON_ROLE_KINDS = [
  "capability",
  "skill",
  "concept",
  "technology",
  "tool",
] as const satisfies readonly DerivableNodeKind[];

/**
 * Shared base shape for every non-Role node kind. `Role` is defined
 * separately (`roleSchema`, below) since it is unique per graph, has no
 * parent, and keeps an opaque id rather than a derived one.
 */
function buildNonRoleNodeSchema<K extends (typeof NON_ROLE_KINDS)[number]>(
  kind: K,
) {
  return z
    .object({
      id: z.string().min(1),
      kind: z.literal(kind),
      namespace: z.string().min(1),
      name: z.string().min(1),
      description: z.string().min(1).optional(),
      parentIds: z.array(z.string().min(1)).min(1),
      relatedNodeIds: z.array(z.string().min(1)).default([]),
      provenance: z.array(provenanceSchema).min(1),
    })
    .strict();
}

export const capabilityNodeSchema = buildNonRoleNodeSchema("capability");
export const skillNodeSchema = buildNonRoleNodeSchema("skill");
export const conceptNodeSchema = buildNonRoleNodeSchema("concept");
export const technologyNodeSchema = buildNonRoleNodeSchema("technology");
export const toolNodeSchema = buildNonRoleNodeSchema("tool");

/**
 * The five node kinds that live in `CareerGraph.nodes`. Each one's
 * stored `id` must equal its derived canonical id
 * (`kind:namespace:name`) - checked here, once, for every member of the
 * union, rather than duplicated per kind.
 */
export const graphNodeSchema = z
  .discriminatedUnion("kind", [
    capabilityNodeSchema,
    skillNodeSchema,
    conceptNodeSchema,
    technologyNodeSchema,
    toolNodeSchema,
  ])
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

export type GraphNode = z.infer<typeof graphNodeSchema>;
export type NonRoleNodeKind = (typeof NON_ROLE_KINDS)[number];

/**
 * The single root node of a CareerGraph. Unlike the other five kinds,
 * `Role` is not part of `nodes`, always has empty `parentIds`, and its
 * `id` is opaque (not derived from namespace/name) since a graph has
 * exactly one Role and nothing else can collide with it.
 */
export const roleSchema = z
  .object({
    id: z.string().min(1),
    kind: z.literal("role"),
    namespace: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    parentIds: z.array(z.string().min(1)).max(0),
    relatedNodeIds: z.array(z.string().min(1)).default([]),
    provenance: z.array(provenanceSchema).min(1),
  })
  .strict();

export type Role = z.infer<typeof roleSchema>;

export type AnyNode = GraphNode | Role;
