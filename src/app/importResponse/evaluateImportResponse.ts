import {
  applyCareerGraphPatch,
  validateCareerGraphImport,
  type CareerGraph,
  type JsonPatchOperation,
} from "../../domain/index.js";
import { computeGraphDiff, type GraphDiffSummary } from "./diffPreview.js";
import { detectResponseShape } from "./detectResponseShape.js";

export type ImportEvaluation =
  | { status: "parse-error"; message: string }
  | { status: "unknown-shape" }
  | { status: "rejected"; stage: "json-schema" | "domain"; errors: string[] }
  | { status: "stale"; baseVersion: number; currentVersion: number }
  | { status: "accepted-full-graph"; graph: CareerGraph; diff: GraphDiffSummary }
  | { status: "accepted-patch"; graph: CareerGraph; operations: JsonPatchOperation[] };

/**
 * The two-layer import contract, end to end, for a pasted AI response:
 * parse -> detect shape -> JSON Schema -> domain validation -> (for a
 * patch) stale-version check -> accept. Nothing is committed here - the
 * caller (ImportResponseView) shows this result as a preview and only
 * dispatches REPLACE_GRAPH on explicit user confirmation.
 *
 * `forceStaleProceed`: when a patch envelope's declared `baseVersion` is
 * stale, the user may explicitly choose to proceed anyway. Since the
 * frozen `applyCareerGraphPatch` (src/domain/patch.ts) always refuses a
 * stale patch and has no override parameter, "proceed anyway" is
 * implemented by re-calling it with the *current* graph's actual
 * version as the declared base instead of the AI's stated one - the
 * same public contract, just supplying the version the user is
 * knowingly accepting the risk against, rather than modifying domain
 * code to add a bypass flag.
 */
export function evaluateImportResponse(
  currentGraph: CareerGraph,
  rawText: string,
  options: { forceStaleProceed?: boolean } = {},
): ImportEvaluation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    return { status: "parse-error", message: error instanceof Error ? error.message : String(error) };
  }

  const shape = detectResponseShape(parsed);

  if (shape.kind === "unknown") {
    return { status: "unknown-shape" };
  }

  if (shape.kind === "full-graph") {
    const result = validateCareerGraphImport(shape.value);
    if (!result.accepted) {
      return { status: "rejected", stage: result.stage, errors: result.errors };
    }
    return {
      status: "accepted-full-graph",
      graph: result.graph,
      diff: computeGraphDiff(currentGraph, result.graph),
    };
  }

  const baseVersion = options.forceStaleProceed ? currentGraph.version : shape.baseVersion;
  const patchResult = applyCareerGraphPatch(
    currentGraph,
    shape.operations as JsonPatchOperation[],
    baseVersion,
  );

  if (patchResult.status === "stale") {
    return { status: "stale", baseVersion: patchResult.baseVersion, currentVersion: patchResult.currentVersion };
  }
  if (patchResult.status === "invalid") {
    // applyCareerGraphPatch doesn't distinguish a malformed-operation
    // failure from a post-application domain-schema rejection - both
    // collapse to "invalid" in its return type. Labelled "domain" here
    // since re-validation against careerGraphSchema is the dominant
    // failure mode; this is a known simplification of the two-layer
    // contract's stage reporting for the patch path specifically (the
    // full-graph path above reports the real stage precisely).
    return { status: "rejected", stage: "domain", errors: patchResult.issues };
  }

  return {
    status: "accepted-patch",
    graph: patchResult.graph,
    operations: shape.operations as JsonPatchOperation[],
  };
}
