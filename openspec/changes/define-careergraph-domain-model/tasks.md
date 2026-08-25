## 1. Project scaffolding

- [ ] 1.1 Initialize a minimal TypeScript project (`package.json`,
      `tsconfig.json`, Vitest for testing) with no framework/UI
      dependencies yet, and verify `npm install` and `npm run typecheck`
      succeed on an empty `src/domain/index.ts`
- [ ] 1.2 Add Zod and `zod-to-json-schema` (or equivalent) as
      dependencies and verify they import successfully in a smoke test

## 2. Core entity schemas

- [ ] 2.1 Implement `Provenance` (`jobDescriptionId`, `requirementId`,
      `rationale?`) and `JobDescription` Zod schemas per spec.md and
      verify unit tests cover the "raw text preserved verbatim" scenario
- [ ] 2.2 Implement the shared node base schema (`id`, `kind`,
      `namespace`, `name`, `description?`, `parentIds`, `relatedNodeIds`,
      `provenance`) and the six discriminated node kinds (`Role`,
      `Capability`, `Skill`, `Concept`, `Technology`, `Tool`), and verify
      unit tests cover valid parent/child kind combinations per spec.md
- [ ] 2.3 Implement parent/child kind constraint validation (e.g. `Skill`
      parent must be `Capability`) and verify unit tests cover the
      "invalid parent kind is rejected" and "Role has no parent"
      scenarios
- [ ] 2.4 Implement deterministic id derivation as a pure function
      `deriveNodeId(kind, namespace, name)` ->
      `"<kind>:<slug(namespace)>:<slug(name)>"`, with `namespace`
      required and defaulting to `"generic"` at the call site (not
      silently inside the schema), and verify unit tests cover the "same
      name, same namespace, resolves to one node" and "same name,
      different namespace, stays distinct" scenarios
- [ ] 2.5 Implement the id-consistency check (stored `id` must equal the
      value derived from the node's own `kind`/`namespace`/`name`) and
      verify a unit test for the "stored id must match its derivation"
      scenario
- [ ] 2.6 Implement the provenance-mandatory constraint (non-empty
      `provenance` on every node) and verify a unit test for the "node
      with no provenance is rejected" scenario
- [ ] 2.7 Implement cycle detection over `parentIds` edges (DFS with a
      visiting-set, scoped to hierarchical edges only - not
      `relatedNodeIds`) and verify unit tests cover the "direct cycle is
      rejected", "transitive cycle is rejected", and "a cycle in
      relatedNodeIds is not rejected" scenarios

## 3. Requirement entity

- [ ] 3.1 Implement the `Requirement` Zod schema (`id`,
      `jobDescriptionId`, `sourceText`, optional `experience`) and the
      `experience` sub-schema (`minimumYears`, `maximumYears?`,
      `unit: "years"`, `logic`, `subjects`) including the
      `subjects.length` constraints per `logic`, and verify unit tests
      cover the single/AND/OR/range/non-experience scenarios from
      spec.md using the two worked examples from the product brief
      (Python 4+ years; AIOps/SRE/production engineering/large-scale
      distributed systems OR 5+ years)
- [ ] 3.2 Verify a unit test asserts `sourceText` is preserved
      character-for-character for both worked examples (the "original
      wording is preserved exactly" scenario)

## 4. CareerGraph root and cross-entity validation

- [ ] 4.1 Implement the `CareerGraph` root Zod schema (`id`, `version`,
      timestamps, `sourceJobDescriptions`, `role`, `nodes`,
      `requirements`) and verify a unit test for the "minimal valid
      CareerGraph" scenario
- [ ] 4.2 Implement graph-level referential integrity checks (every
      `parentIds`/`relatedNodeIds`/`provenance[].requirementId`/
      `provenance[].jobDescriptionId`/`Requirement.jobDescriptionId`
      reference resolves to an entity actually present in the graph) via
      a Zod `.superRefine` or equivalent, and verify unit tests cover the
      "dangling parent reference is rejected" and "dangling requirement
      reference is rejected" scenarios
- [ ] 4.3 Implement the job/requirement pairing consistency check (a
      provenance entry's `jobDescriptionId` must match the
      `jobDescriptionId` of the `Requirement` its `requirementId`
      resolves to) and verify a unit test for the "inconsistent
      job/requirement pairing is rejected" scenario

## 5. JSON Schema generation

- [ ] 5.1 Implement a generation script that produces a Draft 2020-12
      JSON Schema document from the Zod schemas and writes it to a
      checked-in output path, and verify running it produces valid JSON
      Schema (validated with a JSON Schema meta-schema validator)
- [ ] 5.2 Verify the generated JSON Schema accepts the reference fixture
      (task 7.1) and rejects at least one intentionally-invalid fixture,
      matching the Zod schema's accept/reject behavior on the same inputs

## 6. JSON Patch contract

- [ ] 6.1 Implement `applyCareerGraphPatch(graph, patch: JsonPatchOp[])`
      that applies an RFC 6902 patch to a copy of the graph and
      re-validates the result against the full CareerGraph schema
      (including the cycle and referential-integrity checks) before
      returning it, and verify a unit test for the "patch producing an
      invalid graph is rejected" scenario (original graph unchanged)
- [ ] 6.2 Implement stale-version detection (compare the patch's
      declared base `version` against the current graph's `version`) and
      verify a unit test for the "patch against a stale version is
      flagged" scenario

## 7. Reference fixture and acceptance

- [ ] 7.1 Author the reference fixture CareerGraph JSON (derived from a
      realistic sample JD) covering a multi-level node chain, a
      two-parent node, two same-kind/same-name nodes distinguished only
      by `namespace`, a SINGLE-logic requirement, an OR-logic
      requirement, and at least one non-experience requirement, and
      verify it validates against the Zod schema as an automated test
- [ ] 7.2 Verify automated tests assert the exact structured values for
      both canonical experience examples: `{ minimumYears: 4, unit:
      "years", logic: "SINGLE", subjects: ["Python"] }` for "4+ years of
      experience with Python", and `{ minimumYears: 5, unit: "years",
      logic: "OR", subjects: ["AIOps", "SRE", "Production Engineering",
      "Large-scale distributed systems operations"] }`
      (`subjects.length === 4`) for the AIOps/SRE sentence, including
      exact `sourceText` preservation for both
- [ ] 7.3 Author intentionally-invalid variants of the fixture (a
      `parentIds` cycle; a node with empty `provenance`; a provenance
      entry with a mismatched `jobDescriptionId`) and verify each is
      rejected by the Zod schema (the "fixture also exercises rejection
      paths" scenario)
- [ ] 7.4 Run the full test suite and verify all scenarios listed in
      specs/career-graph-domain-model/spec.md have at least one
      corresponding automated test
