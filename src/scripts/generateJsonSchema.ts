import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateCareerGraphJsonSchema } from "../domain/jsonSchema.js";

export { generateCareerGraphJsonSchema };

function main() {
  // Computed lazily, inside main(), rather than at module top level: this
  // file is imported by generateJsonSchema.test.ts too, and under
  // Vitest's Vite-powered transform `import.meta.url` isn't always a
  // `file:` URL, which would make an eager `fileURLToPath` call throw on
  // every test run even though the CLI path is never exercised there.
  const outputPath = fileURLToPath(
    new URL("../../generated/career-graph.schema.json", import.meta.url),
  );
  const schema = generateCareerGraphJsonSchema();
  writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
