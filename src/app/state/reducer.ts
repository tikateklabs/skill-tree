import { careerGraphSchema, type CareerGraph, type ExperienceDetails } from "../../domain/index.js";
import * as ops from "./graphOperations.js";

export interface AppState {
  graph: CareerGraph | null;
  error: string | null;
}

export const initialState: AppState = { graph: null, error: null };

export type AppAction =
  | { type: "LOAD"; graph: CareerGraph | null }
  | { type: "CREATE_FIRST_GRAPH"; input: ops.CreateFirstGraphInput }
  | { type: "ADD_JOB_DESCRIPTION"; input: { title: string; company?: string; rawText: string } }
  | {
      type: "ADD_REQUIREMENT";
      input: { jobDescriptionId: string; sourceText: string; experience?: ExperienceDetails };
    }
  | {
      type: "EDIT_REQUIREMENT_EXPERIENCE";
      requirementId: string;
      experience: ExperienceDetails | undefined;
    }
  | { type: "ADD_NODE"; input: ops.AddNodeInput }
  | { type: "RENAME_NODE"; input: ops.RenameNodeInput }
  | { type: "DELETE_NODE"; nodeId: string }
  | { type: "REPLACE_GRAPH"; graph: CareerGraph }
  | { type: "CLEAR_ERROR" };

/**
 * Every action that changes structure runs its candidate through the
 * domain schema before it is ever committed to state - see spec.md
 * "Every mutation is validated before commit". `REPLACE_GRAPH`'s payload
 * has typically already passed `validateCareerGraphImport`/
 * `applyCareerGraphPatch` upstream, but is re-validated here too so the
 * gate is uniform across every action, not something a caller can
 * bypass by dispatching directly.
 */
function commitCandidate(state: AppState, candidate: CareerGraph): AppState {
  const result = careerGraphSchema.safeParse(candidate);
  if (!result.success) {
    return {
      ...state,
      error: result.error.issues
        .map((issue) => `${issue.path.join(".") || "/"}: ${issue.message}`)
        .join("; "),
    };
  }
  return { graph: result.data, error: null };
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD":
      return { graph: action.graph, error: null };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "CREATE_FIRST_GRAPH":
      return commitCandidate(state, ops.createFirstGraph(action.input));
    case "REPLACE_GRAPH":
      return commitCandidate(state, action.graph);
    default:
      break;
  }

  if (!state.graph) {
    return { ...state, error: "No active CareerGraph yet - create one first." };
  }

  switch (action.type) {
    case "ADD_JOB_DESCRIPTION":
      return commitCandidate(state, ops.addJobDescription(state.graph, action.input));
    case "ADD_REQUIREMENT":
      return commitCandidate(state, ops.addRequirement(state.graph, action.input));
    case "EDIT_REQUIREMENT_EXPERIENCE":
      return commitCandidate(
        state,
        ops.editRequirementExperience(state.graph, action.requirementId, action.experience),
      );
    case "ADD_NODE":
      return commitCandidate(state, ops.addNode(state.graph, action.input));
    case "RENAME_NODE":
      return commitCandidate(state, ops.renameNode(state.graph, action.input));
    case "DELETE_NODE":
      return commitCandidate(state, ops.deleteNode(state.graph, action.nodeId));
    default:
      return state;
  }
}
