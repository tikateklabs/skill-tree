import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { careerGraphSchema } from "../domain/graph.js";

/**
 * Generates a Draft 2020-12 JSON Schema from the CareerGraph Zod schema
 * for AI-facing prompts and external tooling. This is a structural
 * artifact only: cross-field invariants enforced by the Zod schema's
 * `.superRefine` (parentIds acyclicity, referential integrity, id
 * derivation consistency, job/requirement pairing) have no standard
 * JSON Schema representation and are intentionally not included here -
 * see spec.md "Runtime and static validation" and design.md's Zod as
 * source-of-truth decision. Consumers that need those guarantees must
 * validate through the Zod schema.
 */
export function generateCareerGraphJsonSchema() {
  return z.toJSONSchema(careerGraphSchema, { target: "draft-2020-12" });
}

const outputPath = fileURLToPath(
  new URL("../../generated/career-graph.schema.json", import.meta.url),
);

function main() {
  const schema = generateCareerGraphJsonSchema();
  writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
