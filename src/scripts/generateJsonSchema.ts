import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateCareerGraphJsonSchema } from "../domain/jsonSchema.js";

export { generateCareerGraphJsonSchema };

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
