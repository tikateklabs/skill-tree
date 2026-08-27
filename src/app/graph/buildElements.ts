import type { ElementDefinition } from "cytoscape";
import type { CareerGraph } from "../../domain/index.js";

interface FlatNode {
  id: string;
  kind: string;
  name: string;
  parentIds: readonly string[];
  relatedNodeIds: readonly string[];
}

function flattenNodes(graph: CareerGraph): FlatNode[] {
  return [
    {
      id: graph.role.id,
      kind: graph.role.kind,
      name: graph.role.name,
      parentIds: graph.role.parentIds,
      relatedNodeIds: graph.role.relatedNodeIds,
    },
    ...graph.nodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      name: n.name,
      parentIds: n.parentIds,
      relatedNodeIds: n.relatedNodeIds,
    })),
  ];
}

/**
 * Nodes hidden from the rendered graph given a set of collapsed nodes,
 * without altering the underlying CareerGraph. A node is visible if it
 * is reachable from the `Role` via `parentIds` edges without passing
 * through the *children* of a collapsed node - i.e. collapsing a node
 * hides its descendants, but a multi-parent node reachable via a
 * different, non-collapsed branch stays visible (BFS from the role,
 * refusing to expand through a collapsed node's children, rather than a
 * naive "hide every descendant of every collapsed node" which would
 * incorrectly hide a node still reachable another way).
 */
export function computeHiddenNodeIds(
  graph: CareerGraph,
  collapsedNodeIds: ReadonlySet<string>,
): Set<string> {
  const allNodes = flattenNodes(graph);
  const childrenOf = new Map<string, string[]>();
  for (const node of allNodes) {
    for (const parentId of node.parentIds) {
      const children = childrenOf.get(parentId) ?? [];
      children.push(node.id);
      childrenOf.set(parentId, children);
    }
  }

  const visible = new Set<string>([graph.role.id]);
  const queue: string[] = [graph.role.id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (collapsedNodeIds.has(current)) continue;
    for (const childId of childrenOf.get(current) ?? []) {
      if (!visible.has(childId)) {
        visible.add(childId);
        queue.push(childId);
      }
    }
  }

  const hidden = new Set<string>();
  for (const node of allNodes) {
    if (!visible.has(node.id)) hidden.add(node.id);
  }
  return hidden;
}

/** Builds Cytoscape elements for the visible portion of a CareerGraph:
 * one node per domain node/role, one solid edge per parentIds entry
 * ("contains"), one dashed edge per relatedNodeIds entry. A node with
 * multiple parents appears once with one incoming edge per parent. */
export function buildElements(
  graph: CareerGraph,
  collapsedNodeIds: ReadonlySet<string> = new Set(),
): ElementDefinition[] {
  const allNodes = flattenNodes(graph);
  const hidden = computeHiddenNodeIds(graph, collapsedNodeIds);
  const visibleNodes = allNodes.filter((n) => !hidden.has(n.id));
  const visibleIds = new Set(visibleNodes.map((n) => n.id));

  const elements: ElementDefinition[] = visibleNodes.map((n) => ({
    data: {
      id: n.id,
      label: n.name,
      kind: n.kind,
      collapsed: collapsedNodeIds.has(n.id),
    },
  }));

  for (const n of visibleNodes) {
    for (const parentId of n.parentIds) {
      if (visibleIds.has(parentId)) {
        elements.push({
          data: { id: `parent:${parentId}->${n.id}`, source: parentId, target: n.id, kind: "parent" },
        });
      }
    }
    for (const relatedId of n.relatedNodeIds) {
      if (visibleIds.has(relatedId)) {
        elements.push({
          data: { id: `related:${n.id}->${relatedId}`, source: n.id, target: relatedId, kind: "related" },
        });
      }
    }
  }

  return elements;
}
