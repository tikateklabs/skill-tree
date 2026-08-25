import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import { careerGraphSchema, type CareerGraph } from "./graph.js";
import { generateCareerGraphJsonSchema } from "./jsonSchema.js";

/**
 * The two-layer validation contract for accepting an externally supplied
 * CareerGraph (an AI's full replacement JSON, an imported file, etc.):
 *
 *   parse -> JSON Schema validation -> Zod/domain validation -> accept
 *
 * JSON Schema is the portable, structural layer: it validates object
 * shape, types, required fields, enums, and array constraints. Zod is
 * the authoritative semantic layer: it additionally enforces every
 * cross-field invariant JSON Schema cannot express (parentIds cycle
 * detection, referential integrity, provenance jobDescriptionId
 * consistency, canonical id-derivation consistency). The two layers are
 * NOT required to have complete rejection parity - a candidate can pass
 * JSON Schema and still be rejected by Zod. JSON Schema validation alone
 * is never sufficient grounds to accept a CareerGraph: both stages must
 * pass, in order, or the candidate is rejected.
 */

const ajv = new Ajv2020({ strict: false, allErrors: true });
const validateStructural = ajv.compile(generateCareerGraphJsonSchema());

export type ImportValidationResult =
  | { accepted: true; graph: CareerGraph }
  | { accepted: false; stage: "json-schema"; errors: string[] }
  | { accepted: false; stage: "domain"; errors: string[] };

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) return ["unknown JSON Schema validation error"];
  return errors.map((e) => `${e.instancePath || "/"} ${e.message ?? "is invalid"}`);
}

/**
 * Applies the two-layer import contract to a parsed JSON value. Never
 * treat a JSON-Schema-only pass as acceptance - call this function
 * rather than validating against either layer alone.
 */
export function validateCareerGraphImport(candidate: unknown): ImportValidationResult {
  if (!validateStructural(candidate)) {
    return {
      accepted: false,
      stage: "json-schema",
      errors: formatAjvErrors(validateStructural.errors),
    };
  }

  const domainResult = careerGraphSchema.safeParse(candidate);
  if (!domainResult.success) {
    return {
      accepted: false,
      stage: "domain",
      errors: domainResult.error.issues.map(
        (issue) => `${issue.path.join(".") || "/"}: ${issue.message}`,
      ),
    };
  }

  return { accepted: true, graph: domainResult.data };
}
