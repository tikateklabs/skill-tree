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
`requirements` collection (`Requirement[]`, see "Requirement entity"
below).

#### Scenario: A minimal valid CareerGraph
- **WHEN** a CareerGraph contains one `JobDescription`, one `Requirement`
  referencing it, one `Role`, one `Capability`, and one `Skill`, each
  with provenance referencing that `Requirement`
- **THEN** it validates successfully against the CareerGraph schema

#### Scenario: A CareerGraph referencing multiple job descriptions
- **WHEN** a CareerGraph's `requirements` include entries pointing at two
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

### Requirement: Requirement entity
The system SHALL define a `Requirement` type representing one atomic,
JD-derived requirement statement: `id`, `jobDescriptionId`, verbatim
`sourceText` (the exact JD sentence or bullet this requirement was
extracted from), and an optional `experience` object present only when
that statement states a years-of-experience constraint. `experience`
SHALL contain: `minimumYears` (non-negative number), optional
`maximumYears` (number, `>= minimumYears` when present), `unit` (literal
`"years"` for V1 - reserved for future units such as months), `logic`
(`"SINGLE" | "AND" | "OR"`), and `subjects` (`string[]`, length exactly 1
when `logic` is `"SINGLE"`, length >= 2 when `logic` is `"AND"` or
`"OR"`). A `Requirement` with no `experience` object represents a
non-years-based JD statement (e.g. "must have led an SRE team") and is
still a valid, traceable requirement.

#### Scenario: Single-subject experience requirement
- **WHEN** the JD states "4+ years of experience with Python"
- **THEN** the stored `Requirement` has `sourceText` equal to that exact
  sentence and `experience` equal to `{ minimumYears: 4, unit: "years",
  logic: "SINGLE", subjects: ["Python"] }`

#### Scenario: OR-logic multi-subject experience requirement
- **WHEN** the JD states "5+ years of experience in AIOps, SRE,
  production engineering, or large-scale distributed systems operations"
- **THEN** the stored `Requirement.experience` has `minimumYears: 5`,
  `logic: "OR"`, and `subjects` equal to
  `["AIOps", "SRE", "Production Engineering", "Large-scale distributed
  systems operations"]`, in the order they appear in the source text

#### Scenario: AND-logic multi-subject experience requirement
- **WHEN** the JD states "3+ years combined experience in Kubernetes and
  Terraform"
- **THEN** the stored `Requirement.experience` has `minimumYears: 3`,
  `logic: "AND"`, and `subjects: ["Kubernetes", "Terraform"]`

#### Scenario: Range experience requirement
- **WHEN** the JD states "3-5 years of experience with AWS"
- **THEN** the stored `Requirement.experience` has `minimumYears: 3`,
  `maximumYears: 5`, `logic: "SINGLE"`, `subjects: ["AWS"]`

#### Scenario: Non-experience requirement is still traceable
- **WHEN** the JD states "Must have led an on-call rotation for a
  production SRE team" (no years-of-experience wording)
- **THEN** the stored `Requirement` has `sourceText` equal to that
  sentence and `experience` is absent (not an empty/zero-filled object)

#### Scenario: Original wording is preserved exactly
- **WHEN** any `Requirement` is stored
- **THEN** its `sourceText` matches the JD wording character-for-character,
  including punctuation and casing - no paraphrasing, truncation, or
  normalization

#### Scenario: Requirement is never conflated with personal experience
- **WHEN** the domain model is used anywhere in the system
- **THEN** there SHALL be no field, type, or code path in `Requirement` or
  `experience` that represents the user's own personal years of
  experience; personal-experience tracking, if ever added, requires a
  distinct type introduced by a separate change

### Requirement: Node type hierarchy
The system SHALL define six node kinds - `Role`, `Capability`, `Skill`,
`Concept`, `Technology`, `Tool` - sharing a common base shape: `id`,
`kind` (discriminant), `namespace` (see "Node identity" below), `name`,
optional `description`, `parentIds` (`string[]`, one or more parent node
ids - empty only for `Role`), `relatedNodeIds` (`string[]`,
non-hierarchical cross-links to other nodes), `provenance`
(`Provenance[]`, non-empty), and `id` consistent with the node's derived
canonical id. `Role` SHALL be unique per graph (exactly one). `Capability`
nodes' parents SHALL be `Role` or `Capability`. `Skill` nodes' parents
SHALL be `Capability`. `Concept`/`Technology`/`Tool` nodes' parents SHALL
be `Skill` or one another's kind (to allow, e.g., a `Tool` requirement
nested under a `Technology`).

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

### Requirement: Node identity via namespace-qualified canonical ids
The system SHALL derive each non-`Role` node's canonical `id`
deterministically from three parts - `kind`, `namespace`, and normalized
`name` (case-insensitive, whitespace-collapsed) - as
`"<kind>:<slug(namespace)>:<slug(name)>"`. `namespace` is a required,
non-empty string on every node; when no more specific context is known it
SHALL default to the literal value `"generic"`. Display `name` alone
SHALL NOT be treated as a node's identity: two nodes of the same `kind`
and `name` but different `namespace` are distinct nodes. The system SHALL
NOT perform fuzzy or semantic entity resolution across namespaces in V1 -
two nodes that a human would recognize as "the same real-world thing" but
that were authored under different namespaces remain separate nodes until
explicitly merged by a future capability.

#### Scenario: Same name, same namespace, resolves to one node
- **WHEN** one import creates a `Technology` node named "Prometheus" with
  `namespace: "generic"`, and a later import references "prometheus "
  (trailing space) with `namespace: "generic"` as a required technology
- **THEN** both resolve to the same node id
  (`technology:generic:prometheus`), and the second import adds a
  `parentIds`/`provenance` entry to the existing node rather than
  creating a new one

#### Scenario: Same name, different namespace, stays distinct
- **WHEN** a `Technology` node "Atlas" is authored with
  `namespace: "mongodb"` (id `technology:mongodb:atlas`) and a separate
  `Technology` node "Atlas" is authored with `namespace: "internal"` (id
  `technology:internal:atlas`)
- **THEN** both validate as two distinct nodes; the system does not merge
  them and does not flag them as a probable duplicate

#### Scenario: Stored id must match its derivation
- **WHEN** a node's stored `id` does not equal
  `"<kind>:<slug(namespace)>:<slug(name)>"` computed from its own `kind`,
  `namespace`, and `name`
- **THEN** schema validation fails, since the id is not treated as
  free-form - it is the derived canonical identity

### Requirement: Hierarchical containment is acyclic
The system SHALL treat `parentIds` edges as a "contains" relationship and
SHALL reject any CareerGraph whose `parentIds` edges form a cycle
(directly or transitively). `relatedNodeIds` edges are a separate,
non-hierarchical relationship kind and are NOT required to be acyclic -
future relationship kinds (e.g. `related_to`) MAY have different
semantics without this requirement changing.

#### Scenario: Direct cycle is rejected
- **WHEN** a node's `parentIds` includes its own `id`
- **THEN** schema validation fails with a cycle error

#### Scenario: Transitive cycle is rejected
- **WHEN** node A lists node B as a parent, node B lists node C as a
  parent, and node C lists node A as a parent
- **THEN** schema validation fails with a cycle error identifying the
  cycle

#### Scenario: A cycle in relatedNodeIds is not rejected
- **WHEN** node A's `relatedNodeIds` includes node B and node B's
  `relatedNodeIds` includes node A
- **THEN** schema validation succeeds - `relatedNodeIds` carries no
  "contains" semantics and is exempt from the acyclicity check

### Requirement: Provenance establishes Job -> Requirement -> Node traceability
The system SHALL define a `Provenance` type with `jobDescriptionId`,
`requirementId` (a reference to a `Requirement.id`), and optional
`rationale` (free-text explanation, e.g. supplied by an AI, of why this
node was derived from that requirement). Every node's `provenance` array
SHALL contain at least one entry. A node derived from more than one JD
requirement (the same requirement bullet producing several nodes, the
same node reappearing under multiple requirements, or across multiple
JDs) SHALL retain one `Provenance` entry per originating requirement -
none are dropped or overwritten. The requirement's own `sourceText` (not
a copy stored on the node) is the single source of truth for the original
JD wording, so a Skill Tree consumer can always walk
`Node -> Provenance.requirementId -> Requirement.sourceText -> Requirement.jobDescriptionId -> JobDescription.rawText`.

#### Scenario: Node with no provenance is rejected
- **WHEN** a `Skill` node is submitted with an empty `provenance` array
- **THEN** schema validation fails, since every node must be traceable to
  at least one JD requirement

#### Scenario: Node created independently of provenance
- **WHEN** a user manually creates a node in the graph editor with no
  associated JD requirement
- **THEN** the system rejects the manual creation as it would violate the
  provenance-mandatory requirement (out of scope for this capability:
  provenance-free manual node creation, if ever supported, requires an
  explicit future model change, not a bypass of this rule)

#### Scenario: Node accumulates provenance from two requirements
- **WHEN** a "Kubernetes" `Technology` node is first required by
  requirement `req_010` and later also required by requirement `req_014`
  within the same JD
- **THEN** the node's `provenance` array contains one entry for
  `req_010` and one entry for `req_014`

#### Scenario: Node accumulates provenance from two JDs
- **WHEN** a "Kubernetes" `Technology` node already has one provenance
  entry from JD A, and importing JD B's graph also requires "Kubernetes"
- **THEN** the merged node's `provenance` array contains a provenance
  entry for the JD A requirement and one for the JD B requirement, and
  neither is dropped

#### Scenario: Traceable end-to-end example
- **WHEN** requirement `req_014` (`jobDescriptionId: "job_wellsfargo_principal"`,
  `sourceText: "Experience with observability tooling such as
  Prometheus, Splunk, and OpenTelemetry"`) produces a `Technology` node
  "Prometheus" with `provenance: [{ jobDescriptionId:
  "job_wellsfargo_principal", requirementId: "req_014" }]`
- **THEN** resolving that provenance entry yields `req_014`'s exact
  `sourceText`, and resolving `req_014.jobDescriptionId` yields the
  `job_wellsfargo_principal` JobDescription's `rawText`

### Requirement: Graph-wide referential integrity
The system SHALL validate that every id reference within a CareerGraph
resolves to an entity present in that same graph: node `parentIds`,
node `relatedNodeIds`, node `provenance[].requirementId`, node
`provenance[].jobDescriptionId`, and `Requirement.jobDescriptionId`.
Additionally, a node's `provenance[].jobDescriptionId` SHALL match the
`jobDescriptionId` of the `Requirement` its `requirementId` resolves to -
the two references must agree.

#### Scenario: Dangling parent reference is rejected
- **WHEN** a node's `parentIds` includes an id with no matching node in
  the graph
- **THEN** schema validation fails

#### Scenario: Dangling requirement reference is rejected
- **WHEN** a node's `provenance[].requirementId` does not match any
  entry in `CareerGraph.requirements`
- **THEN** schema validation fails

#### Scenario: Inconsistent job/requirement pairing is rejected
- **WHEN** a node's provenance entry has `jobDescriptionId: "job_a"` but
  its `requirementId` resolves to a `Requirement` whose own
  `jobDescriptionId` is `"job_b"`
- **THEN** schema validation fails, since the two references disagree

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
  kind, a parentIds cycle, a malformed `experience` object, a
  namespace/name id mismatch)
- **THEN** the Zod parser SHALL reject it and report which field(s)
  failed and why

### Requirement: Two-layer validation contract for accepting a CareerGraph
JSON Schema and Zod are two layers with distinct, non-interchangeable
responsibilities, not two implementations of the same check:

- **JSON Schema (portable, structural layer).** The generated JSON
  Schema SHALL validate everything standard JSON Schema can express:
  object shape, types, required fields, enums, and array constraints
  (including the structured shape of `Requirement.experience` -
  `minimumYears`, `unit`, `logic`, `subjects`).
- **Zod (authoritative, semantic layer).** The Zod schema SHALL
  additionally enforce every constraint standard JSON Schema cannot
  express: `parentIds` cycle detection, referential integrity across
  `parentIds`/`relatedNodeIds`/`provenance`/`Requirement.jobDescriptionId`,
  provenance `jobDescriptionId` consistency with its resolved
  `Requirement`, canonical id-derivation consistency, and any other
  cross-object or cross-array invariant.

JSON Schema and Zod are explicitly NOT required to have complete
rejection parity: standard JSON Schema has no mechanism to express
cross-object or cross-array invariants, so a candidate MAY pass JSON
Schema validation and still be rejected by Zod. JSON Schema validation
alone SHALL NEVER be treated as sufficient grounds to accept a
CareerGraph.

Any code path that accepts an externally supplied CareerGraph (e.g. a
full replacement JSON pasted back from an AI) SHALL apply both layers in
this order: parse the input as JSON, validate it against the generated
JSON Schema, then validate it against the Zod schema; only a candidate
that passes both SHALL be accepted.

#### Scenario: JSON Schema rejects a structural violation before Zod is reached
- **WHEN** an import candidate violates a constraint expressible in JSON
  Schema (e.g. a node's `provenance` array is empty, violating
  `minItems: 1`)
- **THEN** the import contract rejects it at the JSON Schema stage

#### Scenario: JSON Schema passes, Zod rejects a semantic-only violation
- **WHEN** an import candidate is structurally valid (passes JSON
  Schema) but violates a cross-object invariant JSON Schema cannot
  express (e.g. a `parentIds` cycle between two `Capability` nodes -
  structurally just two arrays of strings, indistinguishable from a
  valid graph to JSON Schema)
- **THEN** the import contract passes the JSON Schema stage but rejects
  the candidate at the Zod/domain stage

#### Scenario: A fully valid CareerGraph is accepted
- **WHEN** an import candidate passes both the JSON Schema stage and the
  Zod/domain stage
- **THEN** the import contract accepts it and returns the parsed,
  fully-typed CareerGraph

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
Technology`), a node with two parents, two nodes of the same `kind` and
`name` distinguished only by `namespace`, a `SINGLE`-logic experience
requirement, an `OR`-logic experience requirement, and at least one
non-experience `Requirement`. The fixture SHALL include, verbatim, both
of the following JD sentences as separate `Requirement` entries, and
automated tests SHALL assert the exact structured values shown:

1. "4+ years of experience with Python" ->
   `experience: { minimumYears: 4, unit: "years", logic: "SINGLE",
   subjects: ["Python"] }`
2. "5+ years of experience in AIOps, SRE, production engineering, or
   large-scale distributed systems operations" ->
   `experience: { minimumYears: 5, unit: "years", logic: "OR",
   subjects: ["AIOps", "SRE", "Production Engineering", "Large-scale
   distributed systems operations"] }` (`subjects.length === 4`)

Both `Requirement.sourceText` values SHALL be asserted to match the
quoted sentences above character-for-character.

#### Scenario: Fixture stays valid
- **WHEN** the fixture CareerGraph is parsed against the current Zod
  schemas as part of the test suite
- **THEN** it validates successfully; any change to the schemas that
  breaks the fixture must update the fixture deliberately, not silently

#### Scenario: Fixture also exercises rejection paths
- **WHEN** the test suite derives intentionally-invalid variants of the
  fixture (a `parentIds` cycle; a node with empty `provenance`; a
  provenance entry whose `jobDescriptionId` disagrees with its resolved
  requirement)
- **THEN** each variant is rejected by the Zod schema with an error
  identifying the violated requirement
