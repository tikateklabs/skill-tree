import type { CareerGraph, ExperienceDetails } from "../../domain/index.js";

export interface NodeInspectorProvenanceEntry {
  sourceText: string;
  jobDescriptionTitle: string;
  jobDescriptionCompany?: string;
  rationale?: string;
}

export interface NodeInspectorRelatedNode {
  id: string;
  name: string;
}

export interface NodeInspectorChild {
  id: string;
  name: string;
  kind: string;
}

export interface NodeInspectorExperienceRequirement extends ExperienceDetails {
  sourceText: string;
}

export interface NodeInspectorData {
  id: string;
  name: string;
  kind: string;
  namespace: string;
  description?: string;
  provenance: NodeInspectorProvenanceEntry[];
  relatedNodes: NodeInspectorRelatedNode[];
  children: NodeInspectorChild[];
  experienceRequirements: NodeInspectorExperienceRequirement[];
}

/**
 * Resolves everything spec.md's "Node inspector shows full traceability
 * on selection" requirement calls for: provenance -> Requirement ->
 * JobDescription, relatedNodeIds -> names, children, and any experience
 * requirement attached via provenance. Pure and independently testable
 * from the rendering component.
 */
export function resolveNodeInspectorData(
  graph: CareerGraph,
  nodeId: string,
): NodeInspectorData | null {
  const allNodes = [graph.role, ...graph.nodes];
  const node = allNodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const jobDescriptionById = new Map(graph.sourceJobDescriptions.map((jd) => [jd.id, jd]));
  const requirementById = new Map(graph.requirements.map((r) => [r.id, r]));

  const provenance: NodeInspectorProvenanceEntry[] = node.provenance.map((p) => {
    const requirement = requirementById.get(p.requirementId);
    const jobDescription = jobDescriptionById.get(p.jobDescriptionId);
    return {
      sourceText: requirement?.sourceText ?? "(unknown requirement)",
      jobDescriptionTitle: jobDescription?.title ?? "(unknown job description)",
      ...(jobDescription?.company ? { jobDescriptionCompany: jobDescription.company } : {}),
      ...(p.rationale ? { rationale: p.rationale } : {}),
    };
  });

  const relatedNodes: NodeInspectorRelatedNode[] = node.relatedNodeIds.map((id) => {
    const related = allNodes.find((n) => n.id === id);
    return { id, name: related?.name ?? id };
  });

  const children: NodeInspectorChild[] = allNodes
    .filter((n) => n.parentIds.includes(nodeId))
    .map((n) => ({ id: n.id, name: n.name, kind: n.kind }));

  const experienceRequirements: NodeInspectorExperienceRequirement[] = node.provenance
    .map((p) => requirementById.get(p.requirementId))
    .filter((r): r is NonNullable<typeof r> => r !== undefined && r.experience !== undefined)
    .map((r) => ({ sourceText: r.sourceText, ...r.experience! }));

  return {
    id: node.id,
    name: node.name,
    kind: node.kind,
    namespace: node.namespace,
    ...(node.description ? { description: node.description } : {}),
    provenance,
    relatedNodes,
    children,
    experienceRequirements,
  };
}
