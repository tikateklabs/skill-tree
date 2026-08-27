import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import {
  generateCareerProfileJsonSchema,
  generateUserObjectiveJsonSchema,
} from "./jsonSchema.js";
import { careerProfileSchema } from "./careerProfile.js";
import { buildCareerProfileFixture } from "../fixtures/careerProfileFixture.js";
import { buildUserObjectiveFixture } from "../fixtures/userObjectiveFixture.js";

describe("generateCareerProfileJsonSchema", () => {
  it("produces a document that compiles against the Draft 2020-12 meta-schema", () => {
    const schema = generateCareerProfileJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    expect(() => ajv.compile(schema)).not.toThrow();
  });

  it("accepts the reference fixture", () => {
    const schema = generateCareerProfileJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(schema);
    expect(validate(buildCareerProfileFixture())).toBe(true);
  });

  it("passes JSON Schema but is rejected by Zod for a semantic-only violation (sourceId/evidenceId mismatch) - the two-layer non-parity case", () => {
    const schema = generateCareerProfileJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(schema);

    const profile = buildCareerProfileFixture();
    // Structurally this is still a well-formed provenance entry (both
    // fields present, both strings) - only the cross-object pairing
    // invariant is violated, which JSON Schema cannot express.
    profile.nodes[0]!.provenance[0]!.sourceId = "src_does_not_exist_but_is_a_string";

    expect(validate(profile)).toBe(true);
    expect(() => careerProfileSchema.parse(profile)).toThrow();
  });

  it("rejects a structurally invalid candidate (empty provenance array)", () => {
    const schema = generateCareerProfileJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(schema);

    const profile = buildCareerProfileFixture();
    profile.nodes[0]!.provenance = [];

    expect(validate(profile)).toBe(false);
  });
});

describe("generateUserObjectiveJsonSchema", () => {
  it("produces a document that compiles against the Draft 2020-12 meta-schema", () => {
    const schema = generateUserObjectiveJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    expect(() => ajv.compile(schema)).not.toThrow();
  });

  it("accepts the reference fixture", () => {
    const schema = generateUserObjectiveJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(schema);
    expect(validate(buildUserObjectiveFixture())).toBe(true);
  });

  it("rejects a structurally invalid candidate (bad compensation period)", () => {
    const schema = generateUserObjectiveJsonSchema();
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(schema);

    const objective = buildUserObjectiveFixture();
    (objective.currentCompensation as { period: string }).period = "weekly";

    expect(validate(objective)).toBe(false);
  });
});
