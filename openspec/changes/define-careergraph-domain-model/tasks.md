## 1. Project scaffolding

- [x] 1.1 Initialize a minimal TypeScript project (`package.json`,
      `tsconfig.json`, Vitest for testing) with no framework/UI
      dependencies yet, and verify `npm install` and `npm run typecheck`
      succeed on an empty `src/domain/index.ts`
- [x] 1.2 Add Zod and `zod-to-json-schema` (or equivalent) as
      dependencies and verify they import successfully in a smoke test
      (used Zod v4's native `z.toJSONSchema()` instead of the
      `zod-to-json-schema` package - the "or equivalent" this task
      anticipates)

## 2. Core entity schemas

- [x] 2.1 Implement `Provenance` (`jobDescriptionId`, `requirementId`,
      `rationale?`) and `JobDescription` Zod schemas per spec.md and
      verify unit tests cover the "raw text preserved verbatim" scenario
- [x] 2.2 Implement the shared node base schema (`id`, `kind`,
      `namespace`, `name`, `description?`, `parentIds`, `relatedNodeIds`,
      `provenance`) and the six discriminated node kinds (`Role`,
      `Capability`, `Skill`, `Concept`, `Technology`, `Tool`), and verify
      unit tests cover valid parent/child kind combinations per spec.md
- [x] 2.3 Implement parent/child kind constraint validation (e.g. `Skill`
      parent must be `Capability`) and verify unit tests cover the
      "invalid parent kind is rejected" and "Role has no parent"
      scenarios
- [x] 2.4 Implement deterministic id derivation as a pure function
      `deriveNodeId(kind, namespace, name)` ->
      `"<kind>:<slug(namespace)>:<slug(name)>"`, with `namespace`
      required and defaulting to `"generic"` at the call site (not
      silently inside the schema), and verify unit tests cover the "same
      name, same namespace, resolves to one node" and "same name,
      different namespace, stays distinct" scenarios
- [x] 2.5 Implement the id-consistency check (stored `id` must equal the
      value derived from the node's own `kind`/`namespace`/`name`) and
      verify a unit test for the "stored id must match its derivation"
      scenario
- [x] 2.6 Implement the provenance-mandatory constraint (non-empty
      `provenance` on every node) and verify a unit test for the "node
      with no provenance is rejected" scenario
- [x] 2.7 Implement cycle detection over `parentIds` edges (DFS with a
      visiting-set, scoped to hierarchical edges only - not
      `relatedNodeIds`) and verify unit tests cover the "direct cycle is
      rejected", "transitive cycle is rejected", and "a cycle in
      relatedNodeIds is not rejected" scenarios

## 3. Requirement entity

- [x] 3.1 Implement the `Requirement` Zod schema (`id`,
      `jobDescriptionId`, `sourceText`, optional `experience`) and the
      `experience` sub-schema (`minimumYears`, `maximumYears?`,
      `unit: "years"`, `logic`, `subjects`) including the
      `subjects.length` constraints per `logic`, and verify unit tests
      cover the single/AND/OR/range/non-experience scenarios from
      spec.md using the two worked examples from the product brief
      (Python 4+ years; AIOps/SRE/production engineering/large-scale
      distributed systems OR 5+ years)
- [x] 3.2 Verify a unit test asserts `sourceText` is preserved
      character-for-character for both worked examples (the "original
      wording is preserved exactly" scenario)

## 4. CareerGraph root and cross-entity validation

- [x] 4.1 Implement the `CareerGraph` root Zod schema (`id`, `version`,
      timestamps, `sourceJobDescriptions`, `role`, `nodes`,
      `requirements`) and verify a unit test for the "minimal valid
      CareerGraph" scenario
- [x] 4.2 Implement graph-level referential integrity checks (every
      `parentIds`/`relatedNodeIds`/`provenance[].requirementId`/
      `provenance[].jobDescriptionId`/`Requirement.jobDescriptionId`
      reference resolves to an entity actually present in the graph) via
      a Zod `.superRefine` or equivalent, and verify unit tests cover the
      "dangling parent reference is rejected" and "dangling requirement
      reference is rejected" scenarios
- [x] 4.3 Implement the job/requirement pairing consistency check (a
      provenance entry's `jobDescriptionId` must match the
      `jobDescriptionId` of the `Requirement` its `requirementId`
      resolves to) and verify a unit test for the "inconsistent
      job/requirement pairing is rejected" scenario

## 5. JSON Schema generation

- [x] 5.1 Implement a generation script that produces a Draft 2020-12
      JSON Schema document from the Zod schemas and writes it to a
      checked-in output path, and verify running it produces valid JSON
      Schema (validated with a JSON Schema meta-schema validator)
      (`npm run generate:schema` -> `generated/career-graph.schema.json`,
      compiled with Ajv2020 in the test suite; used Zod v4's native
      `z.toJSONSchema` rather than a separate `zod-to-json-schema`
      dependency, per 1.2)
- [x] 5.2 Verify the generated JSON Schema accepts the reference fixture
      (task 7.1) and rejects at least one intentionally-invalid fixture,
      matching the Zod schema's accept/reject behavior on the same inputs
      (uses the empty-`provenance` variant: `minItems: 1` is a structural
      constraint the generated JSON Schema retains. The earlier note here
      about JSON Schema/Zod rejection parity is now formalized, not just
      flagged - see group 8, "Two-layer validation contract")

## 6. JSON Patch contract

- [x] 6.1 Implement `applyCareerGraphPatch(graph, patch: JsonPatchOp[])`
      that applies an RFC 6902 patch to a copy of the graph and
      re-validates the result against the full CareerGraph schema
      (including the cycle and referential-integrity checks) before
      returning it, and verify a unit test for the "patch producing an
      invalid graph is rejected" scenario (original graph unchanged)
- [x] 6.2 Implement stale-version detection (compare the patch's
      declared base `version` against the current graph's `version`) and
      verify a unit test for the "patch against a stale version is
      flagged" scenario

## 7. Reference fixture and acceptance

- [x] 7.1 Author the reference fixture CareerGraph JSON (derived from a
      realistic sample JD) covering a multi-level node chain, a
      two-parent node, two same-kind/same-name nodes distinguished only
      by `namespace`, a SINGLE-logic requirement, an OR-logic
      requirement, and at least one non-experience requirement, and
      verify it validates against the Zod schema as an automated test
- [x] 7.2 Verify automated tests assert the exact structured values for
      both canonical experience examples: `{ minimumYears: 4, unit:
      "years", logic: "SINGLE", subjects: ["Python"] }` for "4+ years of
      experience with Python", and `{ minimumYears: 5, unit: "years",
      logic: "OR", subjects: ["AIOps", "SRE", "Production Engineering",
      "Large-scale distributed systems operations"] }`
      (`subjects.length === 4`) for the AIOps/SRE sentence, including
      exact `sourceText` preservation for both
- [x] 7.3 Author intentionally-invalid variants of the fixture (a
      `parentIds` cycle; a node with empty `provenance`; a provenance
      entry with a mismatched `jobDescriptionId`) and verify each is
      rejected by the Zod schema (the "fixture also exercises rejection
      paths" scenario)
- [x] 7.4 Run the full test suite and verify all scenarios listed in
      specs/career-graph-domain-model/spec.md have at least one
      corresponding automated test (53/53 tests passing across 8 files;
      every spec.md scenario mapped to a test - see implementation
      summary)

## 8. Two-layer validation contract

- [x] 8.1 Move JSON Schema generation into `src/domain/jsonSchema.ts`
      (previously only in the CLI script) so the domain layer can depend
      on it, and verify `npm run generate:schema` still produces the same
      output via the script's thin re-export
- [x] 8.2 Implement `validateCareerGraphImport(candidate: unknown)` in
      `src/domain/validate.ts`, encoding the mandatory order - parse ->
      JSON Schema (Ajv2020) -> Zod/domain -> accept - as executable code,
      returning which stage rejected a candidate (`"json-schema"` |
      `"domain"`) or the accepted, fully-typed `CareerGraph`
- [x] 8.3 Verify unit tests for all three contract scenarios: a
      structural violation (empty `provenance`) rejected at the
      json-schema stage; a semantic-only violation (`parentIds` cycle)
      that passes json-schema but is rejected at the domain stage,
      demonstrating deliberate non-parity; and a fully valid candidate
      accepted through both stages
- [x] 8.4 Update spec.md ("Two-layer validation contract for accepting a
      CareerGraph") and design.md to document that JSON Schema and Zod
      are not required to have rejection parity, and that JSON Schema
      validation alone is never sufficient to accept a CareerGraph
