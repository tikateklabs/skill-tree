import { z } from "zod";
import { careerGraphSchema } from "./graph.js";

/**
 * Generates the portable, structural JSON Schema (Draft 2020-12) layer of
 * the two-layer validation contract - see spec.md "Runtime and static
 * validation": it validates object shape, types, required fields, enums,
 * and array constraints (including the structured shape of
 * `Requirement.experience`), but cannot express the Zod schema's
 * cross-field invariants (parentIds acyclicity, referential integrity,
 * id-derivation consistency, job/requirement pairing). Zod remains the
 * authoritative semantic layer; see `validateCareerGraphImport` in
 * `./validate.ts` for the combined two-layer contract.
 */
export function generateCareerGraphJsonSchema() {
  return z.toJSONSchema(careerGraphSchema, { target: "draft-2020-12" });
}
