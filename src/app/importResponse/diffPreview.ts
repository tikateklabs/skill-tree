import type { CareerGraph } from "../../domain/index.js";

export interface GraphDiffSummary {
  addedNodeIds: string[];
  removedNodeIds: string[];
  addedRequirementIds: string[];
  removedRequirementIds: string[];
}

/** A shallow, domain-shaped diff for a full-graph replacement: which node
 * and requirement ids were added/removed relative to the current graph.
 * See spec.md "Full-graph preview summarizes additions and removals". */
export function computeGraphDiff(before: CareerGraph, after: CareerGraph): GraphDiffSummary {
  const beforeNodeIds = new Set(before.nodes.map((n) => n.id));
  const afterNodeIds = new Set(after.nodes.map((n) => n.id));
  const beforeRequirementIds = new Set(before.requirements.map((r) => r.id));
  const afterRequirementIds = new Set(after.requirements.map((r) => r.id));

  return {
    addedNodeIds: [...afterNodeIds].filter((id) => !beforeNodeIds.has(id)),
    removedNodeIds: [...beforeNodeIds].filter((id) => !afterNodeIds.has(id)),
    addedRequirementIds: [...afterRequirementIds].filter((id) => !beforeRequirementIds.has(id)),
    removedRequirementIds: [...beforeRequirementIds].filter((id) => !afterRequirementIds.has(id)),
  };
}
