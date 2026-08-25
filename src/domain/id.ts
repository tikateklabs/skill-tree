/**
 * Canonical-id derivation for CareerGraph nodes.
 *
 * Node identity is `kind:namespace:name`, not display name alone, so that
 * two nodes of the same kind and name but different namespace are treated
 * as distinct entities (e.g. "Atlas" the MongoDB product vs. an internal
 * tool of the same name). See openspec/changes/define-careergraph-domain-model/
 * specs/career-graph-domain-model/spec.md - "Node identity via
 * namespace-qualified canonical ids".
 */

export const GENERIC_NAMESPACE = "generic";

/** Case-insensitive, whitespace-collapsed slug used to build canonical ids. */
export function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type DerivableNodeKind =
  | "capability"
  | "skill"
  | "concept"
  | "technology"
  | "tool";

/**
 * Deterministic id for the five non-Role node kinds. `Role` is excluded:
 * it is unique per graph and keeps an opaque id, like `JobDescription`
 * and `Requirement`.
 */
export function deriveNodeId(
  kind: DerivableNodeKind,
  namespace: string,
  name: string,
): string {
  return `${kind}:${slug(namespace)}:${slug(name)}`;
}
