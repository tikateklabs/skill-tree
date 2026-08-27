import type {
  CareerGraph,
  ExperienceDetails,
  GraphNode,
  JobDescription,
  NonRoleNodeKind,
  Provenance,
  Requirement,
} from "../../domain/index.js";
import { deriveNodeId } from "../../domain/index.js";
import { generateId, nowIso } from "./ids.js";

/**
 * Pure, testable functions that compute a candidate CareerGraph for each
 * editing action. None of these validate the result - the reducer
 * (state/reducer.ts) runs every candidate through careerGraphSchema
 * before committing, per spec.md "Every mutation is validated before
 * commit".
 */

function bumpVersion(graph: Pick<CareerGraph, "version">): { version: number; updatedAt: string } {
  return { version: graph.version + 1, updatedAt: nowIso() };
}

export interface CreateFirstGraphInput {
  jobDescription: { title: string; company?: string; rawText: string };
  requirement: { sourceText: string; experience?: ExperienceDetails };
  role: { namespace?: string; name: string };
}

export function createFirstGraph(input: CreateFirstGraphInput): CareerGraph {
  const jobDescriptionId = generateId("job");
  const requirementId = generateId("req");
  const roleId = generateId("role");
  const timestamp = nowIso();

  const jobDescription: JobDescription = {
    id: jobDescriptionId,
    title: input.jobDescription.title,
    ...(input.jobDescription.company ? { company: input.jobDescription.company } : {}),
    rawText: input.jobDescription.rawText,
    importedAt: timestamp,
  };

  const requirement: Requirement = {
    id: requirementId,
    jobDescriptionId,
    sourceText: input.requirement.sourceText,
    ...(input.requirement.experience ? { experience: input.requirement.experience } : {}),
  };

  const provenance: Provenance[] = [{ jobDescriptionId, requirementId }];

  return {
    id: generateId("graph"),
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceJobDescriptions: [jobDescription],
    requirements: [requirement],
    role: {
      id: roleId,
      kind: "role",
      namespace: input.role.namespace ?? "generic",
      name: input.role.name,
      parentIds: [],
      relatedNodeIds: [],
      provenance,
    },
    nodes: [],
  };
}

export function addJobDescription(
  graph: CareerGraph,
  input: { title: string; company?: string; rawText: string },
): CareerGraph {
  const jobDescription: JobDescription = {
    id: generateId("job"),
    title: input.title,
    ...(input.company ? { company: input.company } : {}),
    rawText: input.rawText,
    importedAt: nowIso(),
  };
  return {
    ...graph,
    ...bumpVersion(graph),
    sourceJobDescriptions: [...graph.sourceJobDescriptions, jobDescription],
  };
}

export function addRequirement(
  graph: CareerGraph,
  input: { jobDescriptionId: string; sourceText: string; experience?: ExperienceDetails },
): CareerGraph {
  const requirement: Requirement = {
    id: generateId("req"),
    jobDescriptionId: input.jobDescriptionId,
    sourceText: input.sourceText,
    ...(input.experience ? { experience: input.experience } : {}),
  };
  return {
    ...graph,
    ...bumpVersion(graph),
    requirements: [...graph.requirements, requirement],
  };
}

export function editRequirementExperience(
  graph: CareerGraph,
  requirementId: string,
  experience: ExperienceDetails | undefined,
): CareerGraph {
  const requirements = graph.requirements.map((req) => {
    if (req.id !== requirementId) return req;
    if (experience === undefined) {
      const { experience: _drop, ...rest } = req;
      return rest;
    }
    return { ...req, experience };
  });
  return { ...graph, ...bumpVersion(graph), requirements };
}

export interface AddNodeInput {
  kind: NonRoleNodeKind;
  namespace?: string;
  name: string;
  description?: string;
  parentIds: string[];
  relatedNodeIds?: string[];
  provenance: Provenance[];
}

export function addNode(graph: CareerGraph, input: AddNodeInput): CareerGraph {
  const namespace = input.namespace ?? "generic";
  const id = deriveNodeId(input.kind, namespace, input.name);
  const node: GraphNode = {
    id,
    kind: input.kind,
    namespace,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    parentIds: input.parentIds,
    relatedNodeIds: input.relatedNodeIds ?? [],
    provenance: input.provenance,
  } as GraphNode;
  return {
    ...graph,
    ...bumpVersion(graph),
    nodes: [...graph.nodes, node],
  };
}

export interface RenameNodeInput {
  nodeId: string;
  name?: string;
  namespace?: string;
}

export function renameNode(graph: CareerGraph, input: RenameNodeInput): CareerGraph {
  const target = graph.nodes.find((n) => n.id === input.nodeId);
  if (!target) {
    throw new Error(`renameNode: no node with id "${input.nodeId}"`);
  }
  const newName = input.name ?? target.name;
  const newNamespace = input.namespace ?? target.namespace;
  const newId = deriveNodeId(target.kind, newNamespace, newName);

  const remapIds = (ids: string[]) => ids.map((id) => (id === input.nodeId ? newId : id));

  const nodes = graph.nodes.map((n) => {
    const withRemappedRefs = {
      ...n,
      parentIds: remapIds(n.parentIds),
      relatedNodeIds: remapIds(n.relatedNodeIds),
    };
    if (n.id === input.nodeId) {
      return { ...withRemappedRefs, id: newId, name: newName, namespace: newNamespace };
    }
    return withRemappedRefs;
  }) as GraphNode[];

  return {
    ...graph,
    ...bumpVersion(graph),
    role: { ...graph.role, relatedNodeIds: remapIds(graph.role.relatedNodeIds) },
    nodes,
  };
}

/** Nodes that would be removed if `targetId` were deleted: `targetId`
 * itself, plus any node transitively left with zero parents. Pure - does
 * not mutate the graph. Used both to compute the confirmation set shown
 * to the user and by `deleteNode` itself. */
export function computeDeleteCascade(graph: CareerGraph, targetId: string): Set<string> {
  const removed = new Set<string>([targetId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of graph.nodes) {
      if (removed.has(node.id)) continue;
      const remainingParents = node.parentIds.filter((id) => !removed.has(id));
      if (remainingParents.length === 0) {
        removed.add(node.id);
        changed = true;
      }
    }
  }
  return removed;
}

export function deleteNode(graph: CareerGraph, targetId: string): CareerGraph {
  const removed = computeDeleteCascade(graph, targetId);
  const nodes = graph.nodes
    .filter((n) => !removed.has(n.id))
    .map((n) => ({
      ...n,
      parentIds: n.parentIds.filter((id) => !removed.has(id)),
      relatedNodeIds: n.relatedNodeIds.filter((id) => !removed.has(id)),
    })) as GraphNode[];

  return {
    ...graph,
    ...bumpVersion(graph),
    role: {
      ...graph.role,
      relatedNodeIds: graph.role.relatedNodeIds.filter((id) => !removed.has(id)),
    },
    nodes,
  };
}
