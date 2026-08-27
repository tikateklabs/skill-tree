## 1. CareerProfile core entities

- [ ] 1.1 Implement `EvidenceSource` Zod schema (`id`, `kind:
      "naukri_profile" | "resume" | "user_addendum"`, `rawText`,
      `importedAt`) and verify a unit test confirms `rawText` is
      preserved verbatim
- [ ] 1.2 Implement `CareerRoleHistoryEntry` Zod schema (`id`, `title`,
      `company?`, `startDate?`, `endDate?`, `sourceId`) and verify a
      unit test covers a profile with two entries from different
      companies
- [ ] 1.3 Implement `CareerEvidence` Zod schema (`id`, `sourceId`,
      `sourceText`, `status: "PROVEN" | "EMERGING"`) and verify unit
      tests cover both status values with verbatim `sourceText`
      preservation
- [ ] 1.4 Implement `CareerAspiration` Zod schema (`id`, `sourceText`,
      `relatedNodeHint?`, no `status` field) and verify a unit test
      confirms it validates with no corresponding CareerEvidence or
      CareerProfileNode required to exist
- [ ] 1.5 Implement the CareerProfileNode `Provenance` schema
      (`{ sourceId, evidenceId, rationale? }` - distinct shape from
      CareerGraph's `Provenance`, do not reuse that export) and the
      `CareerProfileNode` schema (`id`, `kind` from the five non-Role
      kinds, `namespace`, `name`, `description?`, `roleHistoryEntryIds`
      non-empty, `provenance` non-empty), importing `deriveNodeId` and
      the node-kind type from `src/domain/id.ts` (no changes to that
      file), and verify a unit test confirms
      `deriveNodeId("technology", "generic", "Kubernetes")` produces the
      same id whether called for a CareerGraph node or a
      CareerProfileNode
- [ ] 1.6 Implement the id-consistency check (stored `id` must equal the
      value derived from the node's own `kind`/`namespace`/`name`) and
      verify a unit test for a mismatched-id rejection

## 2. CareerProfile cross-entity validation

- [ ] 2.1 Implement the `CareerProfile` root Zod schema (`id`, `version`,
      timestamps, `sources`, `roleHistory`, `nodes`, `evidence`,
      `aspirations`) and verify a unit test for the "minimal valid
      CareerProfile" scenario
- [ ] 2.2 Implement the provenance sourceId/evidenceId pairing
      consistency check (a node's provenance `sourceId` must match the
      `sourceId` of the `CareerEvidence` its `evidenceId` resolves to)
      and verify a unit test for the "inconsistent pairing is rejected"
      scenario
- [ ] 2.3 Implement graph-wide referential integrity checks (every
      `roleHistoryEntryIds`/`provenance[].sourceId`/
      `provenance[].evidenceId`/`CareerEvidence.sourceId`/
      `CareerRoleHistoryEntry.sourceId` reference resolves to an entity
      present in the profile) and verify unit tests cover a dangling
      role-history reference and a dangling evidence reference
- [ ] 2.4 Verify a unit test confirms a `CareerProfileNode.provenance`
      entry cannot reference a `CareerAspiration` id (only
      `CareerEvidence` ids are valid `evidenceId` targets) - the
      "provenance traces to evidence, not aspiration" scenario

## 3. UserObjective

- [ ] 3.1 Implement `CompensationFigure` Zod schema (`amount`,
      `currency`, `period: "annual" | "monthly"`) and verify a unit test
      covers current and target compensation stored as given, with no
      interpretation step
- [ ] 3.2 Implement `InterpretedPreference` Zod schema (`sourceText`,
      `interpreted: string | null`) and verify unit tests cover both an
      interpreted and a null-interpretation case, with `sourceText`
      always preserved
- [ ] 3.3 Implement the `UserObjective` Zod schema
      (`currentCompensation`, `targetCompensation`,
      `locationPreference`, `companyPreference`,
      `roleDirectionPreference`, `industryPreferences: { prefer, avoid }`,
      `otherPreferences`, all optional/nullable) and verify a unit test
      for the "minimal UserObjective with only compensation figures"
      scenario and one for "only an avoid-list is stated"

## 4. JSON Schema generation (two-layer contract)

- [ ] 4.1 Extend the existing JSON Schema generation approach
      (`z.toJSONSchema`, matching `src/domain/jsonSchema.ts`'s pattern)
      to cover `CareerProfile` and `UserObjective`, and verify running it
      produces valid JSON Schema documents (validated with Ajv2020, same
      approach as the existing `generateJsonSchema.test.ts`)
- [ ] 4.2 Verify a unit test demonstrates the two-layer non-parity case
      for `CareerProfile`: a candidate that passes JSON Schema (a node's
      provenance is structurally present) but fails Zod (its `sourceId`
      disagrees with its evidence's `sourceId`)

## 5. Reference fixtures and acceptance

- [ ] 5.1 Author the reference `CareerProfile` fixture: two
      `CareerRoleHistoryEntry` entries (different companies), a
      `CareerProfileNode` demonstrated across both, at least one
      `PROVEN` and one `EMERGING` `CareerEvidence`, at least one
      `CareerAspiration`, and verify it validates against the Zod schema
      as an automated test
- [ ] 5.2 Verify a unit test asserts a `CareerProfileNode` in this
      fixture shares its canonical `id` with a same-kind/namespace/name
      node in the existing `career-graph-domain-model` reference fixture
      (`src/fixtures/careerGraphFixture.ts`) - proving the shared id
      scheme lines up in practice
- [ ] 5.3 Author the reference `UserObjective` fixture (current/target
      compensation, at least one preference with a non-null
      `interpreted` value, at least one with a `null` interpretation) and
      verify it validates against the Zod schema as an automated test
- [ ] 5.4 Author intentionally-invalid variants (empty node provenance;
      mismatched sourceId/evidenceId pairing; dangling role-history
      reference) and verify each is rejected by the Zod schema
- [ ] 5.5 Run the full test suite and verify all scenarios listed in
      specs/career-profile-model/spec.md and
      specs/user-objective-model/spec.md have at least one corresponding
      automated test

## 6. Full verification

- [ ] 6.1 Run typecheck and verify it is clean
- [ ] 6.2 Run the full test suite (existing CareerGraph/app tests plus
      new CareerProfile/UserObjective tests) and verify all pass
- [ ] 6.3 Run the production build (`npm run build`) and the domain
      library build (`npm run build:domain`) and verify both complete
      cleanly
- [ ] 6.4 Run `openspec validate career-profile-domain-model --strict`
      and verify it passes
