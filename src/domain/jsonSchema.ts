import { z } from "zod";
import { careerGraphSchema } from "./graph.js";
import { careerProfileSchema } from "./careerProfile.js";
import { userObjectiveSchema } from "./userObjective.js";

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

/**
 * Same two-layer contract as `generateCareerGraphJsonSchema`, applied to
 * `CareerProfile` (career-profile-model): structural only - cannot
 * express the sourceId/evidenceId pairing check or referential
 * integrity, both Zod-only.
 */
export function generateCareerProfileJsonSchema() {
  return z.toJSONSchema(careerProfileSchema, { target: "draft-2020-12" });
}

/**
 * Same two-layer contract, applied to `UserObjective`
 * (user-objective-model). `UserObjective` has no cross-entity
 * references, so this is currently structural-only in practice too, but
 * generated the same way for uniformity across every domain module.
 */
export function generateUserObjectiveJsonSchema() {
  return z.toJSONSchema(userObjectiveSchema, { target: "draft-2020-12" });
}
