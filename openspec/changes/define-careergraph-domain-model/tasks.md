## 1. Project scaffolding

- [ ] 1.1 Initialize a minimal TypeScript project (`package.json`,
      `tsconfig.json`, Vitest for testing) with no framework/UI
      dependencies yet, and verify `npm install` and `npm run typecheck`
      succeed on an empty `src/domain/index.ts`
- [ ] 1.2 Add Zod and `zod-to-json-schema` (or equivalent) as
      dependencies and verify they import successfully in a smoke test

## 2. Core entity schemas

- [ ] 2.1 Implement `Provenance` and `JobDescription` Zod schemas per
      spec.md and verify unit tests cover the "raw text preserved
      verbatim" scenario
- [ ] 2.2 Implement the shared node base schema (`id`, `kind`, `name`,
      `description?`, `parentIds`, `relatedNodeIds`, `provenance`,
      `experienceRequirementIds`) and the six discriminated node kinds
      (`Role`, `Capability`, `Skill`, `Concept`, `Technology`, `Tool`),
      and verify unit tests cover valid parent/child kind combinations
      per spec.md
- [ ] 2.3 Implement parent/child kind constraint validation (e.g. `Skill`
      parent must be `Capability`) and verify unit tests cover the
      "invalid parent kind is rejected" and "Role has no parent"
      scenarios
- [ ] 2.4 Implement deterministic id derivation (`kind` + normalized
      `name`) as a pure function and verify unit tests cover the "case
      and whitespace variants resolve to one node" scenario
- [ ] 2.5 Implement the provenance-mandatory constraint (non-empty
      `provenance` on every node) and verify a unit test for the "node
      with no provenance is rejected" scenario

## 3. Experience requirements

- [ ] 3.1 Implement the `ExperienceRequirement` Zod schema
      (`minimumYears`, `maximumYears?`, `logic`, `subjects`,
      `provenance`, `appliesToNodeIds`) including the `subjects.length`
      constraints per `logic`, and verify unit tests cover the
      single/AND/OR/range scenarios from spec.md using the two worked
      examples from the product brief (Python 4+ years; AIOps/SRE/
      production engineering/large-scale distributed systems OR 5+
      years)
- [ ] 3.2 Implement the bidirectional consistency check between
      `ExperienceRequirement.appliesToNodeIds` and node
      `experienceRequirementIds`, and verify a unit test covers both the
      "linked to a resolved skill node" and "unlinked requirement
      remains valid" scenarios

## 4. CareerGraph root and cross-entity validation

- [ ] 4.1 Implement the `CareerGraph` root Zod schema (`id`, `version`,
      timestamps, `sourceJobDescriptions`, `role`, `nodes`,
      `experienceRequirements`) and verify a unit test for the "minimal
      valid CareerGraph" scenario
- [ ] 4.2 Implement graph-level referential integrity checks (every
      `parentIds`/`relatedNodeIds`/`appliesToNodeIds`/
      `experienceRequirementIds`/`sourceJobDescriptionId` reference
      resolves to an entity actually present in the graph) via a Zod
      `.superRefine` or equivalent, and verify unit tests cover at least
      one dangling-reference rejection case per reference type

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
      re-validates the result against the full CareerGraph schema before
      returning it, and verify a unit test for the "patch producing an
      invalid graph is rejected" scenario (original graph unchanged)
- [ ] 6.2 Implement stale-version detection (compare the patch's
      declared base `version` against the current graph's `version`) and
      verify a unit test for the "patch against a stale version is
      flagged" scenario

## 7. Reference fixture and acceptance

- [ ] 7.1 Author the reference fixture CareerGraph JSON (derived from a
      realistic sample JD) covering a multi-level node chain, a
      two-parent node, a SINGLE-logic requirement, and an OR-logic
      requirement, and verify it validates against the Zod schema as an
      automated test
- [ ] 7.2 Run the full test suite and verify all scenarios listed in
      specs/career-graph-domain-model/spec.md have at least one
      corresponding automated test
