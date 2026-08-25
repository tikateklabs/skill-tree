import { applyPatch, type Operation } from "fast-json-patch";
import { careerGraphSchema, type CareerGraph } from "./graph.js";

export type JsonPatchOperation = Operation;

export type PatchApplicationResult =
  | { status: "applied"; graph: CareerGraph }
  | { status: "invalid"; issues: string[] }
  | { status: "stale"; baseVersion: number; currentVersion: number };

/**
 * Applies an RFC 6902 JSON Patch to a CareerGraph. The patch is applied to
 * a copy (the input `graph` is never mutated); the result is re-validated
 * against the full CareerGraph schema (including cycle and
 * referential-integrity checks) before being accepted. `baseVersion` is
 * the graph version the patch was generated against - if it does not
 * match the current graph's `version`, the patch is flagged as
 * potentially stale and is not applied.
 */
export function applyCareerGraphPatch(
  graph: CareerGraph,
  patch: readonly JsonPatchOperation[],
  baseVersion: number,
): PatchApplicationResult {
  if (baseVersion !== graph.version) {
    return { status: "stale", baseVersion, currentVersion: graph.version };
  }

  let patched: unknown;
  try {
    patched = applyPatch(graph, patch, true, false).newDocument;
  } catch (error) {
    return {
      status: "invalid",
      issues: [error instanceof Error ? error.message : String(error)],
    };
  }

  const result = careerGraphSchema.safeParse(patched);
  if (!result.success) {
    return {
      status: "invalid",
      issues: result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  }

  return { status: "applied", graph: result.data };
}
