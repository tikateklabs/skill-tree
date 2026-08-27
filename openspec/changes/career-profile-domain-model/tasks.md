## 1. CareerProfile core entities

- [x] 1.1 Implement `EvidenceSource` Zod schema (`id`, `kind:
      "naukri_profile" | "resume" | "user_addendum"`, `rawText`,
      `importedAt`) and verify a unit test confirms `rawText` is
      preserved verbatim
- [x] 1.2 Implement `CareerRoleHistoryEntry` Zod schema (`id`, `title`,
      `company?`, `startDate?`, `endDate?`, `sourceId`) and verify a
      unit test covers a profile with two entries from different
      companies
- [x] 1.3 Implement `CareerEvidence` Zod schema (`id`, `sourceId`,
      `sourceText`, `status: "PROVEN" | "EMERGING"`) and verify unit
      tests cover both status values with verbatim `sourceText`
      preservation
- [x] 1.4 Implement `CareerAspiration` Zod schema (`id`, `sourceText`,
      `relatedNodeHint?`, no `status` field) and verify a unit test
      confirms it validates with no corresponding CareerEvidence or
      CareerProfileNode required to exist
- [x] 1.5 Implement the CareerProfileNode `Provenance` schema
      (`{ sourceId, evidenceId, rationale? }` - distinct shape from
      CareerGraph's `Provenance`, exported as `careerProfileProvenanceSchema`,
      not reusing that export) and the `CareerProfileNode` schema (`id`,
      `kind` from the five non-Role kinds, `namespace`, `name`,
      `description?`, `roleHistoryEntryIds` non-empty, `provenance`
      non-empty), importing `deriveNodeId` and `DerivableNodeKind` from
      `src/domain/id.ts` (unmodified), and verify a unit test confirms
      `deriveNodeId("technology", "generic", "Kubernetes")` produces the
      same id whether called for a CareerGraph node or a
      CareerProfileNode
- [x] 1.6 Implement the id-consistency check (stored `id` must equal the
      value derived from the node's own `kind`/`namespace`/`name`) and
      verify a unit test for a mismatched-id rejection

## 2. CareerProfile cross-entity validation

- [x] 2.1 Implement the `CareerProfile` root Zod schema (`id`, `version`,
      timestamps, `sources`, `roleHistory`, `nodes`, `evidence`,
      `aspirations`) and verify a unit test for the "minimal valid
      CareerProfile" scenario
- [x] 2.2 Implement the provenance sourceId/evidenceId pairing
      consistency check (a node's provenance `sourceId` must match the
      `sourceId` of the `CareerEvidence` its `evidenceId` resolves to)
      and verify a unit test for the "inconsistent pairing is rejected"
      scenario
- [x] 2.3 Implement graph-wide referential integrity checks (every
      `roleHistoryEntryIds`/`provenance[].sourceId`/
      `provenance[].evidenceId`/`CareerEvidence.sourceId`/
      `CareerRoleHistoryEntry.sourceId` reference resolves to an entity
      present in the profile) and verify unit tests cover a dangling
      role-history reference and a dangling evidence reference
- [x] 2.4 Verify a unit test confirms a `CareerProfileNode.provenance`
      entry cannot reference a `CareerAspiration` id - implemented as: a
      provenance `evidenceId` is looked up only against
      `CareerProfile.evidence` (aspirations are never indexed there), so
      referencing an aspiration id is indistinguishable from a dangling
      reference and is rejected the same way; covered by
      "rejects provenance referencing an aspiration id instead of an
      evidence id" in careerProfile.test.ts

## 3. UserObjective

- [x] 3.1 Implement `CompensationFigure` Zod schema (`amount`,
      `currency`, `period: "annual" | "monthly"`) and verify a unit test
      covers current and target compensation stored as given, with no
      interpretation step
- [x] 3.2 Implement `InterpretedPreference` Zod schema (`sourceText`,
      `interpreted: string | null`) and verify unit tests cover both an
      interpreted and a null-interpretation case, with `sourceText`
      always preserved
- [x] 3.3 Implement the `UserObjective` Zod schema
      (`currentCompensation`, `targetCompensation`,
      `locationPreference`, `companyPreference`,
      `roleDirectionPreference`, `industryPreferences: { prefer, avoid }`,
      `otherPreferences`, all optional/nullable) and verify a unit test
      for the "minimal UserObjective with only compensation figures"
      scenario and one for "only an avoid-list is stated". Also added a
      test beyond the literal task wording, for spec.md's "target
      compensation is a constraint, not an assumption" scenario: asserts
      no `achievable`/`validated` field exists on `CompensationFigure`
      or `UserObjective`.

## 4. JSON Schema generation (two-layer contract)

- [x] 4.1 Extend the existing JSON Schema generation approach
      (`z.toJSONSchema`, matching `src/domain/jsonSchema.ts`'s pattern)
      to cover `CareerProfile` and `UserObjective` via
      `generateCareerProfileJsonSchema`/`generateUserObjectiveJsonSchema`,
      and verify running it produces valid JSON Schema documents
      (validated with Ajv2020 in src/domain/jsonSchema.test.ts). Scope
      note: unlike CareerGraph's, these are not wired into the CLI
      script to write a checked-in `generated/*.schema.json` file yet -
      no consumer needs that file until `career-profile-capture-ui`
      builds the extraction prompt; adding it now would be an unused
      artifact. The generation functions themselves are exported and
      tested, so wiring the CLI output later is a small addition, not a
      redesign.
- [x] 4.2 Verify a unit test demonstrates the two-layer non-parity case
      for `CareerProfile`: a candidate that passes JSON Schema (a node's
      provenance is structurally present, both fields are correctly-typed
      strings) but fails Zod (its `sourceId` disagrees with its
      evidence's `sourceId`)

## 5. Reference fixtures and acceptance

- [x] 5.1 Author the reference `CareerProfile` fixture: two
      `CareerRoleHistoryEntry` entries (different companies), a
      `CareerProfileNode` demonstrated across both, at least one
      `PROVEN` and one `EMERGING` `CareerEvidence`, at least one
      `CareerAspiration`, and verify it validates against the Zod schema
      as an automated test
- [x] 5.2 Verify a unit test asserts a `CareerProfileNode` in this
      fixture shares its canonical `id` with a same-kind/namespace/name
      node in the existing `career-graph-domain-model` reference fixture
      (`src/fixtures/careerGraphFixture.ts`) - proving the shared id
      scheme lines up in practice (used Python/`technology:generic:python`,
      present in both fixtures)
- [x] 5.3 Author the reference `UserObjective` fixture (current/target
      compensation, at least one preference with a non-null
      `interpreted` value, at least one with a `null` interpretation) and
      verify it validates against the Zod schema as an automated test
- [x] 5.4 Author intentionally-invalid variants (empty node provenance;
      mismatched sourceId/evidenceId pairing; dangling role-history
      reference) and verify each is rejected by the Zod schema
- [x] 5.5 Run the full test suite and verify all scenarios listed in
      specs/career-profile-model/spec.md and
      specs/user-objective-model/spec.md have at least one corresponding
      automated test - 151/151 passing; every scenario in both spec
      files mapped to a specific test during this pass, including
      adding one (3.3's note above) that was found missing during the
      cross-check

## 6. Full verification

- [x] 6.1 Run typecheck and verify it is clean
- [x] 6.2 Run the full test suite (existing CareerGraph/app tests plus
      new CareerProfile/UserObjective tests) and verify all pass -
      151/151
- [x] 6.3 Run the production build (`npm run build`) and the domain
      library build (`npm run build:domain`) and verify both complete
      cleanly - both clean (app build's pre-existing ~926KB bundle-size
      warning is informational, unrelated to this change)
- [x] 6.4 Run `openspec validate career-profile-domain-model --strict`
      and verify it passes
