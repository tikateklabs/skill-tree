import { z } from "zod";
import { jobDescriptionSchema } from "./jobDescription.js";
import { requirementSchema } from "./requirement.js";
import { graphNodeSchema, roleSchema } from "./node.js";

/**
 * Allowed parent kinds for each non-Role node kind, per spec.md - "Node
 * type hierarchy": Capability -> Role|Capability, Skill -> Capability,
 * Concept/Technology/Tool -> Skill or one another's kind.
 */
const PARENT_KIND_RULES: Record<string, readonly string[]> = {
  capability: ["role", "capability"],
  skill: ["capability"],
  concept: ["skill", "concept", "technology", "tool"],
  technology: ["skill", "concept", "technology", "tool"],
  tool: ["skill", "concept", "technology", "tool"],
};

export const careerGraphSchema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().min(0),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    sourceJobDescriptions: z.array(jobDescriptionSchema),
    role: roleSchema,
    nodes: z.array(graphNodeSchema),
    requirements: z.array(requirementSchema),
  })
  .strict()
  .superRefine((graph, ctx) => {
    const jobDescriptionIds = new Set<string>();
    for (const [index, jd] of graph.sourceJobDescriptions.entries()) {
      if (jobDescriptionIds.has(jd.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate JobDescription id "${jd.id}"`,
          path: ["sourceJobDescriptions", index, "id"],
        });
      }
      jobDescriptionIds.add(jd.id);
    }

    const requirementIds = new Set<string>();
    for (const [index, req] of graph.requirements.entries()) {
      if (requirementIds.has(req.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate Requirement id "${req.id}"`,
          path: ["requirements", index, "id"],
        });
      }
      requirementIds.add(req.id);

      if (!jobDescriptionIds.has(req.jobDescriptionId)) {
        ctx.addIssue({
          code: "custom",
          message: `Requirement "${req.id}" references unknown jobDescriptionId "${req.jobDescriptionId}"`,
          path: ["requirements", index, "jobDescriptionId"],
        });
      }
    }
    const requirementById = new Map(graph.requirements.map((r) => [r.id, r]));

    // All entities that can be a `parentIds`/`relatedNodeIds` target: the
    // Role plus every non-Role node.
    type EntityRef = { kind: string; parentIds: readonly string[] };
    const allNodesById = new Map<string, EntityRef>();
    allNodesById.set(graph.role.id, {
      kind: graph.role.kind,
      parentIds: graph.role.parentIds,
    });
    for (const node of graph.nodes) {
      if (allNodesById.has(node.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate node id "${node.id}"`,
          path: ["nodes"],
        });
        continue;
      }
      allNodesById.set(node.id, { kind: node.kind, parentIds: node.parentIds });
    }

    const validateProvenance = (
      provenance: { jobDescriptionId: string; requirementId: string }[],
      basePath: (string | number)[],
    ) => {
      provenance.forEach((entry, provIndex) => {
        if (!jobDescriptionIds.has(entry.jobDescriptionId)) {
          ctx.addIssue({
            code: "custom",
            message: `provenance references unknown jobDescriptionId "${entry.jobDescriptionId}"`,
            path: [...basePath, provIndex, "jobDescriptionId"],
          });
        }

        const requirement = requirementById.get(entry.requirementId);
        if (!requirement) {
          ctx.addIssue({
            code: "custom",
            message: `provenance references unknown requirementId "${entry.requirementId}"`,
            path: [...basePath, provIndex, "requirementId"],
          });
          return;
        }

        if (requirement.jobDescriptionId !== entry.jobDescriptionId) {
          ctx.addIssue({
            code: "custom",
            message: `provenance jobDescriptionId "${entry.jobDescriptionId}" does not match requirement "${requirement.id}"'s jobDescriptionId "${requirement.jobDescriptionId}"`,
            path: [...basePath, provIndex, "jobDescriptionId"],
          });
        }
      });
    };

    validateProvenance(graph.role.provenance, ["role", "provenance"]);

    graph.nodes.forEach((node, nodeIndex) => {
      validateProvenance(node.provenance, ["nodes", nodeIndex, "provenance"]);

      node.parentIds.forEach((parentId, parentIndex) => {
        const parent = allNodesById.get(parentId);
        if (!parent) {
          ctx.addIssue({
            code: "custom",
            message: `parentIds references unknown node id "${parentId}"`,
            path: ["nodes", nodeIndex, "parentIds", parentIndex],
          });
          return;
        }

        const allowedParentKinds = PARENT_KIND_RULES[node.kind] ?? [];
        if (!allowedParentKinds.includes(parent.kind)) {
          ctx.addIssue({
            code: "custom",
            message: `node of kind "${node.kind}" cannot have a parent of kind "${parent.kind}" (allowed: ${allowedParentKinds.join(", ")})`,
            path: ["nodes", nodeIndex, "parentIds", parentIndex],
          });
        }
      });

      node.relatedNodeIds.forEach((relatedId, relatedIndex) => {
        if (!allNodesById.has(relatedId)) {
          ctx.addIssue({
            code: "custom",
            message: `relatedNodeIds references unknown node id "${relatedId}"`,
            path: ["nodes", nodeIndex, "relatedNodeIds", relatedIndex],
          });
        }
      });
    });

    detectParentCycle(allNodesById, ctx);
  });

export type CareerGraph = z.infer<typeof careerGraphSchema>;

/**
 * Cycle detection over `parentIds` ("contains") edges only.
 * `relatedNodeIds` is a separate, non-hierarchical relationship kind and
 * is intentionally not checked here - see spec.md "Hierarchical
 * containment is acyclic".
 */
function detectParentCycle(
  allNodesById: Map<string, { kind: string; parentIds: readonly string[] }>,
  ctx: z.RefinementCtx,
): void {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, 0 | 1 | 2>();
  let cycleReported = false;

  function visit(id: string): boolean {
    color.set(id, GRAY);
    const entry = allNodesById.get(id);
    if (entry) {
      for (const parentId of entry.parentIds) {
        if (!allNodesById.has(parentId)) continue; // dangling ref, reported elsewhere
        const parentColor = color.get(parentId) ?? WHITE;
        if (parentColor === GRAY) {
          ctx.addIssue({
            code: "custom",
            message: `parentIds cycle detected: node "${id}" transitively lists itself as an ancestor via "${parentId}"`,
            path: ["nodes"],
          });
          return true;
        }
        if (parentColor === WHITE && visit(parentId)) {
          return true;
        }
      }
    }
    color.set(id, BLACK);
    return false;
  }

  for (const id of allNodesById.keys()) {
    if (cycleReported) break;
    if ((color.get(id) ?? WHITE) === WHITE) {
      cycleReported = visit(id);
    }
  }
}
