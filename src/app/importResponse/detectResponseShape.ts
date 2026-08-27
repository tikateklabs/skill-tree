/**
 * Distinguishes a pasted AI response's two accepted shapes - a full
 * CareerGraph object, or a `{ baseVersion, operations }` patch envelope
 * (see prompt/buildPrompt.ts, which instructs the AI to return one of
 * these) - before any validation runs. See spec.md
 * "Pasted response is validated before any preview is shown".
 */
export type DetectedResponseShape =
  | { kind: "full-graph"; value: unknown }
  | { kind: "patch-envelope"; baseVersion: number; operations: unknown[] }
  | { kind: "unknown" };

export function detectResponseShape(parsed: unknown): DetectedResponseShape {
  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;

    if ("role" in obj && "nodes" in obj && "requirements" in obj) {
      return { kind: "full-graph", value: parsed };
    }

    if (
      "baseVersion" in obj &&
      "operations" in obj &&
      typeof obj.baseVersion === "number" &&
      Array.isArray(obj.operations)
    ) {
      return { kind: "patch-envelope", baseVersion: obj.baseVersion, operations: obj.operations };
    }
  }
  return { kind: "unknown" };
}
