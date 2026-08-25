## Purpose

Defines the CareerGraph domain model: the entities, identity rules,
provenance rules, and validation contract that every other Skill Tree
capability (prompt generation, JD import, rendering, editing, AI-response
merging) is built on top of.

## ADDED Requirements

### Requirement: CareerGraph root structure
The system SHALL define a `CareerGraph` root type containing: a stable
`id`, a `version` (monotonically increasing integer, incremented on every
structural mutation), `createdAt`/`updatedAt` timestamps, an array of
`sourceJobDescriptions` (`JobDescription[]`), a `role` (`Role`, the single
root node of the hierarchy), a flat `nodes` collection covering every
`Capability`/`Skill`/`Concept`/`Technology`/`Tool` in the graph, and a flat
`experienceRequirements` collection (`ExperienceRequirement[]`).

#### Scenario: A minimal valid CareerGraph
- **WHEN** a CareerGraph contains one `JobDescription`, one `Role`, one
  `Capability`, one `Skill`, and no experience requirements
- **THEN** it validates successfully against the CareerGraph schema

#### Scenario: A CareerGraph referencing multiple job descriptions
- **WHEN** a CareerGraph's `nodes` include provenance pointing at two
  different entries in `sourceJobDescriptions`
- **THEN** it validates successfully, since a graph MAY be built up from
  more than one JD over time

### Requirement: JobDescription entity
The system SHALL define a `JobDescription` type with a stable `id`, `title`,
optional `company`, verbatim `rawText` (the full original JD text, never
edited or normalized), and `importedAt` timestamp.

#### Scenario: Raw text is preserved verbatim
- **WHEN** a JobDescription is imported with text containing irregular
  whitespace, bullet characters, or line breaks
- **THEN** `rawText` stores that text unmodified (no trimming, no
  re-formatting) so later quote-matching against it remains exact

### Requirement: Node type hierarchy
The system SHALL define six node kinds - `Role`, `Capability`, `Skill`,
`Concept`, `Technology`, `Tool` - sharing a common base shape: `id`,
`kind` (discriminant), `name`, optional `description`, `parentIds`
(`string[]`, one or more parent node ids - empty only for `Role`),
`relatedNodeIds` (`string[]`, non-hierarchical cross-links to other
nodes), `provenance` (`Provenance[]`, non-empty), and
`experienceRequirementIds` (`string[]`, may be empty). `Role` SHALL be
unique per graph (exactly one). `Capability` nodes' parents SHALL be
`Role` or `Capability`. `Skill` nodes' parents SHALL be `Capability`.
`Concept`/`Technology`/`Tool` nodes' parents SHALL be `Skill` or one
another's kind (to allow, e.g., a `Tool` requirement nested under a
`Technology`).

#### Scenario: A node with multiple parents
- **WHEN** a `Technology` node named "Python" is required by both a
  "Data Engineering" `Skill` and a "Backend Development" `Skill`
- **THEN** that single "Python" node's `parentIds` contains both skill
  ids rather than the graph containing two duplicate "Python" nodes

#### Scenario: Invalid parent kind is rejected
- **WHEN** a `Skill` node declares a `Concept` node as its parent
- **THEN** schema validation fails with an error identifying the
  violated parent/child kind constraint

#### Scenario: Role has no parent
- **WHEN** a `Role` node declares a non-empty `parentIds`
- **THEN** schema validation fails, since `Role` is always the graph root

### Requirement: Node identity and de-duplication
The system SHALL derive each non-`Role` node's `id` deterministically from
its `kind` and normalized `name` (case-insensitive, whitespace-collapsed),
so that re-importing AI output referring to the same concept (e.g.,
"Prometheus" and "prometheus ") resolves to the same node id instead of
creating a duplicate.

#### Scenario: Case and whitespace variants resolve to one node
- **WHEN** one import creates a `Technology` node named "Prometheus" and a
  later import references "prometheus" as a required technology
- **THEN** both resolve to the same node id, and the second import adds a
  `parentIds`/`provenance` entry to the existing node rather than creating
  a new one

### Requirement: Provenance is mandatory
The system SHALL define a `Provenance` type with `sourceJobDescriptionId`,
verbatim `sourceQuote` (the exact JD wording that produced this node or
requirement), and optional `rationale` (free-text explanation, e.g.
supplied by an AI, of why this node was derived from that quote). Every
node's `provenance` array SHALL contain at least one entry, and every
`ExperienceRequirement` SHALL have exactly one `provenance` entry. A node
with more than one provenance entry (produced by multiple JD requirements
or multiple JDs) SHALL retain all of them.

#### Scenario: Node with no provenance is rejected
- **WHEN** a `Skill` node is submitted with an empty `provenance` array
- **THEN** schema validation fails, since every node must be traceable to
  at least one JD requirement

#### Scenario: Node created independently of provenance
- **WHEN** a user manually creates a node in the graph editor with no
  associated JD text
- **THEN** the system rejects the manual creation as it would violate the
  provenance-mandatory requirement (out of scope for this capability:
  provenance-free manual node creation, if ever supported, requires an
  explicit future model change, not a bypass of this rule)

#### Scenario: A node accumulates provenance from two JDs
- **WHEN** a "Kubernetes" `Technology` node already has one provenance
  entry from JD A, and importing JD B's graph also requires "Kubernetes"
- **THEN** the merged node's `provenance` array contains both entries,
  and neither is dropped

### Requirement: Experience requirement structure
The system SHALL define an `ExperienceRequirement` type with: `id`,
`minimumYears` (non-negative number), optional `maximumYears` (number,
must be `>= minimumYears` when present), `logic`
(`"SINGLE" | "AND" | "OR"`), `subjects` (`string[]`, length exactly 1 when
`logic` is `"SINGLE"`, length >= 2 when `logic` is `"AND"` or `"OR"`),
`provenance` (a single `Provenance` entry holding the verbatim JD
sentence), and `appliesToNodeIds` (`string[]`, the node(s) this
requirement qualifies; may be empty when the requirement could not yet be
linked to a resolved node).

#### Scenario: Single-subject requirement
- **WHEN** the JD states "4+ years of experience with Python"
- **THEN** the stored `ExperienceRequirement` has `minimumYears: 4`,
  `logic: "SINGLE"`, `subjects: ["Python"]`, and `sourceQuote` equal to
  that exact sentence

#### Scenario: OR-logic multi-subject requirement
- **WHEN** the JD states "5+ years of experience in AIOps, SRE,
  production engineering, or large-scale distributed systems operations"
- **THEN** the stored `ExperienceRequirement` has `minimumYears: 5`,
  `logic: "OR"`, and `subjects` equal to
  `["AIOps", "SRE", "Production Engineering", "Large-scale distributed
  systems operations"]`, in the order they appear in the source text

#### Scenario: AND-logic multi-subject requirement
- **WHEN** the JD states "3+ years combined experience in Kubernetes and
  Terraform"
- **THEN** the stored `ExperienceRequirement` has `minimumYears: 3`,
  `logic: "AND"`, and `subjects: ["Kubernetes", "Terraform"]`

#### Scenario: Range requirement
- **WHEN** the JD states "3-5 years of experience with AWS"
- **THEN** the stored `ExperienceRequirement` has `minimumYears: 3`,
  `maximumYears: 5`, `logic: "SINGLE"`, `subjects: ["AWS"]`

#### Scenario: Requirement is never conflated with personal experience
- **WHEN** the domain model is used anywhere in the system
- **THEN** there SHALL be no field, type, or code path in the
  `ExperienceRequirement` type or its schema that represents the user's
  own personal years of experience; personal-experience tracking, if ever
  added, requires a distinct type introduced by a separate change

### Requirement: Experience requirements link to graph nodes
The system SHALL allow an `ExperienceRequirement.appliesToNodeIds` to
reference zero or more nodes, and a node's `experienceRequirementIds` to
reference zero or more requirements, with both sides of the link kept
consistent (every id on one side has a matching back-reference on the
other).

#### Scenario: Requirement linked to a resolved skill node
- **WHEN** an OR-logic requirement for "AIOps, SRE, production
  engineering, or large-scale distributed systems operations" is attached
  to the "AIOps" `Capability` node
- **THEN** `appliesToNodeIds` contains that node's id and that node's
  `experienceRequirementIds` contains the requirement's id

#### Scenario: Unlinked requirement remains valid
- **WHEN** an `ExperienceRequirement` is extracted from a JD sentence
  that does not clearly map to any existing node yet
- **THEN** the requirement is still stored with `appliesToNodeIds: []`
  rather than being dropped, preserving the JD information until it can
  be linked

### Requirement: Runtime and static validation
The system SHALL implement the CareerGraph domain model as Zod schemas
that serve as the single source of truth, with TypeScript types derived
from those schemas (not maintained by hand), and SHALL provide a
generated JSON Schema (Draft 2020-12) artifact derived from the same Zod
schemas for use by external tooling and AI-facing prompts. The generated
JSON Schema SHALL be kept in sync with the Zod schemas by generation, not
by manual duplication.

#### Scenario: Invalid graph is rejected at runtime
- **WHEN** application code parses a CareerGraph JSON value that violates
  any requirement in this spec (e.g. missing provenance, invalid parent
  kind, malformed experience requirement)
- **THEN** the Zod parser SHALL reject it and report which field(s)
  failed and why

#### Scenario: JSON Schema matches Zod schema
- **WHEN** the JSON Schema generation step runs against the current Zod
  schemas
- **THEN** the output is a valid JSON Schema document that accepts every
  fixture CareerGraph accepted by the Zod schemas and rejects every
  fixture rejected by them

### Requirement: JSON Patch contract for external AI edits
The system SHALL define how an externally authored RFC 6902 JSON Patch
document is validated before being applied to an existing CareerGraph:
the patch SHALL be applied to a copy of the current graph, the result
SHALL be re-validated against the full CareerGraph schema before being
accepted, and the current graph's `version` SHALL be included in the
patch-application contract so a patch generated against a stale version
can be detected.

#### Scenario: Patch producing an invalid graph is rejected
- **WHEN** an external AI's JSON Patch, applied to the current graph,
  would remove a node's only `provenance` entry
- **THEN** the system rejects the patch application and the graph
  remains unchanged

#### Scenario: Patch against a stale version is flagged
- **WHEN** a JSON Patch is generated against `version: 3` but the current
  in-app graph is already at `version: 5`
- **THEN** the system flags the patch as potentially stale before
  applying it, rather than silently applying it over intervening changes

### Requirement: Reference fixture data
The system SHALL include at least one hand-authored, schema-valid
CareerGraph JSON fixture derived from a realistic sample job description,
covering: a multi-level node chain (`Role -> Capability -> Skill ->
Technology`), a node with two parents, a `SINGLE`-logic experience
requirement, and an `OR`-logic experience requirement, used as a
regression baseline for the validation contract.

#### Scenario: Fixture stays valid
- **WHEN** the fixture CareerGraph is parsed against the current Zod
  schemas as part of the test suite
- **THEN** it validates successfully; any change to the schemas that
  breaks the fixture must update the fixture deliberately, not silently
