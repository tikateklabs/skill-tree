## Purpose

Defines `CareerProfile`: a structured, verbatim-traceable representation
of the user's own career - what they have actually done, classified by
evidence strength, kept structurally comparable to `CareerGraph` so a
target role's requirements and the user's own evidence can later be
compared node-for-node, and kept strictly separate from what the user
aspires to.

## ADDED Requirements

### Requirement: CareerProfile root structure
The system SHALL define a `CareerProfile` root type containing: a stable
`id`, a `version` (monotonically increasing integer), `createdAt`/
`updatedAt` timestamps, `sources` (`EvidenceSource[]`), `roleHistory`
(`CareerRoleHistoryEntry[]`), a flat `nodes` collection
(`CareerProfileNode[]`), a flat `evidence` collection
(`CareerEvidence[]`), and a flat `aspirations` collection
(`CareerAspiration[]`).

#### Scenario: A minimal valid CareerProfile
- **WHEN** a CareerProfile contains one `EvidenceSource`, one
  `CareerRoleHistoryEntry`, one `CareerEvidence` referencing that source,
  and one `CareerProfileNode` with provenance referencing that evidence
- **THEN** it validates successfully against the CareerProfile schema

### Requirement: EvidenceSource entity
The system SHALL define an `EvidenceSource` type with a stable `id`,
`kind` (`"naukri_profile" | "resume" | "user_addendum"`), verbatim
`rawText` (never edited or normalized), and `importedAt` timestamp.

#### Scenario: Multiple source kinds contribute to one profile
- **WHEN** a CareerProfile's `sources` includes one `naukri_profile`
  entry and one `user_addendum` entry (e.g. "I've also worked on X which
  isn't reflected in my Naukri profile")
- **THEN** both are stored with their own verbatim `rawText`, and
  `CareerEvidence`/`CareerProfileNode` entries may trace back to either

### Requirement: CareerRoleHistoryEntry represents one past or current role
The system SHALL define a `CareerRoleHistoryEntry` type with `id`,
`title`, optional `company`, optional `startDate`/`endDate` (ISO date
strings), and `sourceId` (referencing the `EvidenceSource` it was
extracted from). Unlike `CareerGraph`'s single `Role`, a `CareerProfile`
SHALL support more than one `CareerRoleHistoryEntry`, since a career
spans multiple employers/roles over time.

#### Scenario: A profile with multiple past roles
- **WHEN** a CareerProfile's `roleHistory` contains two entries with
  different `company` values, both referencing the same
  `naukri_profile` EvidenceSource
- **THEN** it validates successfully - CareerProfile does not enforce
  the "exactly one root" constraint CareerGraph's Role does

### Requirement: CareerProfileNode identity matches CareerGraph's scheme
The system SHALL define `CareerProfileNode` using the same five non-Role
node kinds (`capability`, `skill`, `concept`, `technology`, `tool`) and
the same canonical id derivation (`deriveNodeId` from
`src/domain/id.ts`: `"<kind>:<slug(namespace)>:<slug(name)>"`, `namespace`
required and defaulting to `"generic"`) already defined for
`CareerGraph` nodes - imported and reused, not reimplemented. A
`CareerProfileNode` SHALL have: `id`, `kind`, `namespace`, `name`,
optional `description`, `roleHistoryEntryIds` (`string[]`, non-empty -
which role(s) this was demonstrated during), and `provenance`
(`Provenance[]`, non-empty, see below).

#### Scenario: Same canonical id as an equivalent CareerGraph node
- **WHEN** a CareerProfileNode is derived from `kind: "technology"`,
  `namespace: "generic"`, `name: "Kubernetes"`
- **THEN** its `id` is `"technology:generic:kubernetes"` - identical to
  what a CareerGraph node with the same kind/namespace/name would have,
  computed by the same shared function

#### Scenario: A node demonstrated across multiple past roles
- **WHEN** a CareerProfileNode's `roleHistoryEntryIds` contains two
  `CareerRoleHistoryEntry` ids
- **THEN** it validates successfully - a skill demonstrated at more than
  one employer is one node, not duplicated per role

### Requirement: CareerEvidence is verbatim and classified by strength
The system SHALL define a `CareerEvidence` type with `id`, `sourceId`
(referencing an `EvidenceSource`), verbatim `sourceText` (the exact
wording the claim was extracted from), and `status`
(`"PROVEN" | "EMERGING"`). `PROVEN` SHALL represent evidence the source
text substantiates directly; `EMERGING` SHALL represent evidence that is
mentioned but not strongly substantiated (e.g. named once in passing
versus described with specifics). `CareerEvidence` SHALL NOT represent
anything the user aspires to but has not done - see `CareerAspiration`.

#### Scenario: Proven evidence is stored verbatim
- **WHEN** a Naukri profile states "Led migration of 40+ microservices
  to Kubernetes, reducing deployment time by 60%"
- **THEN** the stored CareerEvidence has that exact `sourceText` and
  `status: "PROVEN"`

#### Scenario: Emerging evidence is distinguished from proven evidence
- **WHEN** a Naukri profile only lists "Kubernetes" among a long skills
  list with no supporting description
- **THEN** the stored CareerEvidence for it has `status: "EMERGING"`,
  distinguishable from evidence with a substantiating description

### Requirement: CareerProfileNode provenance traces to evidence, not aspiration
The system SHALL define `Provenance` for `CareerProfileNode` as
`{ sourceId: string; evidenceId: string; rationale?: string }`, where
`sourceId` matches the `sourceId` of the `CareerEvidence` `evidenceId`
resolves to (the same job/requirement-pairing consistency principle
`career-graph-domain-model` established for JD provenance, applied
here). Every `CareerProfileNode`'s `provenance` array SHALL be
non-empty and SHALL reference only `CareerEvidence`, never
`CareerAspiration` - a node cannot exist solely because the user
aspires to it.

#### Scenario: Node with no provenance is rejected
- **WHEN** a CareerProfileNode is submitted with an empty `provenance`
  array
- **THEN** schema validation fails

#### Scenario: Provenance sourceId must match its evidence's sourceId
- **WHEN** a CareerProfileNode's provenance entry has `sourceId: "src_a"`
  but its `evidenceId` resolves to a CareerEvidence whose own `sourceId`
  is `"src_b"`
- **THEN** schema validation fails, since the two references disagree

### Requirement: CareerAspiration is a separate, evidence-free entity
The system SHALL define `CareerAspiration` as `{ id: string; sourceText:
string; relatedNodeHint?: string }` - a free-text statement of what the
user wants to be known for, kept structurally separate from
`CareerEvidence` (not a third `status` value on it), since an aspiration
by definition has no evidence and a combined shape would allow an
incoherent "PROVEN aspiration" state. `relatedNodeHint` is an optional,
unvalidated free-text hint (not a reference requiring referential
integrity) - resolving an aspiration to specific market capabilities is
a later change's job (market analysis), not this one's.

#### Scenario: An aspiration is stored without requiring evidence
- **WHEN** the user states "I want to move toward AI leadership"
- **THEN** a CareerAspiration is stored with that verbatim `sourceText`
  and no `CareerEvidence` or `CareerProfileNode` is required to exist for
  it

#### Scenario: An aspiration cannot masquerade as evidence
- **WHEN** application code needs to determine whether "AI leadership"
  is something the user has done versus wants to do
- **THEN** the two are structurally distinguishable by which collection
  the entry lives in (`evidence` vs `aspirations`), not by inspecting a
  shared status field

### Requirement: Graph-wide referential integrity
The system SHALL validate that every id reference within a
CareerProfile resolves to an entity present in that same profile:
`CareerProfileNode.roleHistoryEntryIds`,
`CareerProfileNode.provenance[].sourceId`,
`CareerProfileNode.provenance[].evidenceId`,
`CareerEvidence.sourceId`, and `CareerRoleHistoryEntry.sourceId`.

#### Scenario: Dangling role-history reference is rejected
- **WHEN** a CareerProfileNode's `roleHistoryEntryIds` includes an id
  with no matching `CareerRoleHistoryEntry` in the profile
- **THEN** schema validation fails

#### Scenario: Dangling evidence reference is rejected
- **WHEN** a CareerProfileNode's `provenance[].evidenceId` does not
  match any entry in `CareerProfile.evidence`
- **THEN** schema validation fails

### Requirement: Runtime and static validation, two-layer contract
The system SHALL implement `CareerProfile` as Zod schemas serving as the
single source of truth, with a generated JSON Schema (Draft 2020-12)
derived from them, following the same two-layer contract established by
`career-graph-domain-model`: JSON Schema validates everything standard
JSON Schema can express (shape, types, required fields, enums, array
constraints); Zod additionally enforces cross-object invariants
(referential integrity, the sourceId/evidenceId pairing check) that JSON
Schema cannot express; the two are not required to have rejection
parity; JSON Schema validation alone is never sufficient to accept a
CareerProfile.

#### Scenario: A semantic-only violation passes JSON Schema, fails Zod
- **WHEN** a candidate CareerProfile is structurally valid but a node's
  provenance sourceId disagrees with its evidence's sourceId
- **THEN** it passes JSON Schema validation but is rejected at the Zod/
  domain stage

### Requirement: Reference fixture data
The system SHALL include at least one hand-authored, schema-valid
CareerProfile fixture covering: two `CareerRoleHistoryEntry` entries
(different companies), a `CareerProfileNode` demonstrated across both
roles, at least one `PROVEN` and one `EMERGING` CareerEvidence, at least
one `CareerAspiration`, and a `CareerProfileNode` whose canonical id
matches a same-kind/namespace/name node from the existing
`career-graph-domain-model` reference fixture (proving the shared id
scheme actually lines up in practice, not just in the abstract).

#### Scenario: Fixture stays valid
- **WHEN** the fixture CareerProfile is parsed against the current Zod
  schemas as part of the test suite
- **THEN** it validates successfully
