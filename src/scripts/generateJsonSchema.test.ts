import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { generateCareerGraphJsonSchema } from "./generateJsonSchema.js";
import { buildCareerGraphFixture, nodeIds } from "../fixtures/careerGraphFixture.js";

describe("generateCareerGraphJsonSchema", () => {
  it("produces a document that compiles against the Draft 2020-12 meta-schema", () => {
    const schema = generateCareerGraphJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    // Ajv throws if the schema itself is not valid against the JSON
    // Schema meta-schema it was constructed with.
    expect(() => ajv.compile(schema)).not.toThrow();
  });

  it("accepts the reference fixture", () => {
    const schema = generateCareerGraphJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(schema);

    const valid = validate(buildCareerGraphFixture());
    expect(validate.errors).toBeNull();
    expect(valid).toBe(true);
  });

  it("rejects a structurally invalid fixture (empty provenance array)", () => {
    // Cross-field invariants (cycles, referential integrity, id-derivation
    // consistency) are Zod-only - see generateJsonSchema.ts's doc comment.
    // This exercises a *structural* constraint (`minItems: 1` on
    // `provenance`), which the generated JSON Schema does carry over from
    // the Zod schema and can therefore reject on its own.
    const schema = generateCareerGraphJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(schema);

    const graph = buildCareerGraphFixture();
    const prometheus = graph.nodes.find((n) => n.id === nodeIds.technologyPrometheusId)!;
    prometheus.provenance = [];

    const valid = validate(graph);
    expect(valid).toBe(false);
  });
});
