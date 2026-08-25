## Context

See proposal.md - Why. This design covers only the CareerGraph domain
model: its shape, identity rules, validation, and the JSON Patch contract.
No package.json/build tooling exists yet in the repo; this change is
expected to introduce the first application code (a `src/domain/`
module) and the minimal tooling needed to type-check, test, and generate
JSON Schema from it - not a full app scaffold.

This revision incorporates a design review of the first draft. Three
decisions changed as a result:
1. Node identity now includes an explicit `namespace`, not just `kind` +
   display name.
2. Acyclicity is scoped explicitly to `parentIds` ("contains") edges,
   not to every edge kind in the graph.
3. Provenance now points at a first-class `Requirement` entity by id
   (`Job -> Requirement -> Node`) instead of inlining a quote directly on
   each node's provenance entry.

## Goals / Non-Goals

**Goals:**
- A precise, implementable shape for every entity in spec.md.
- A single source of truth (Zod) with no hand-maintained duplicate types.
- A node-identity scheme that survives repeated AI round-trips without
  drifting into duplicate nodes, while remaining resistant to
  same-name/different-entity collisions.
- A JSON Patch contract that is safe against stale or invalid patches.
- An explicit, walkable chain from any node back to the exact JD sentence
  that produced it.

**Non-Goals:**
- No UI, no Cytoscape integration, no rendering.
- No persistence layer (IndexedDB/localStorage) - this change defines the
  in-memory shape only; a later change defines how it's stored.
- No prompt-template generation - a later change consumes this model to
  build prompts, but authoring those templates is out of scope here.
  (This includes deciding how an AI prompt should guide `namespace`
  selection - see Open Questions.)
- No JD-parsing/NLP logic - how text becomes a CareerGraph (manual entry
  vs. AI-assisted) is out of scope; this change only defines the target
  shape the parsed result must conform to.
- No fuzzy or semantic entity resolution across namespaces (e.g.
  suggesting that `technology:mongodb:atlas` and `technology:internal:atlas`
  might be "the same thing"). Deferred; see Risks and Open Questions.

## Decisions

**Zod as source of truth, JSON Schema generated from it.**
Alternative considered: hand-author JSON Schema and derive TS types from
it (`json-schema-to-ts`). Rejected because Zod gives both compile-time
types and runtime validation from one definition with no build step for
the TS side, and the JSON Schema (needed only for AI-facing prompts and
external tooling) is a lower-frequency derived artifact that tolerates a
generation step (`zod-to-json-schema` or equivalent) better than the
reverse.

**Two-layer validation contract, no rejection parity between the
layers.** Implementation surfaced a fact the first draft's "JSON Schema
matches Zod schema" language glossed over: standard JSON Schema (Draft
2020-12) has no mechanism to express cross-object or cross-array
invariants, so it structurally *cannot* reproduce `parentIds` cycle
detection, referential integrity, id-derivation consistency, or
provenance/`jobDescriptionId` pairing - all of which live only in the
Zod schema's `.superRefine`. Rather than pretend otherwise, the contract
is now explicit and asymmetric: JSON Schema is the portable, structural
layer (useful for AI-facing prompts and any external tool that wants a
cheap first-pass check); Zod is the authoritative semantic layer and the
only one with a completeness guarantee. `src/domain/validate.ts`
(`validateCareerGraphImport`) encodes the mandatory order - parse -> JSON
Schema -> Zod -> accept - as executable code, not just documentation, so
"JSON Schema alone is never sufficient to accept a CareerGraph" is an
enforced property of any code path that uses it, not a convention callers
have to remember. See spec.md - "Two-layer validation contract for
accepting a CareerGraph".

**DAG for hierarchy via `parentIds[]`, acyclicity scoped to that edge
kind only.**
The product brief's example (Prometheus/Splunk/OpenTelemetry under
Observability) reads as a tree, but real JDs routinely require the same
technology or skill under multiple parents (Observability under both
AIOps and SRE; Python under both "Data Engineering" and "Backend
Development"). Alternative considered: keep it a strict tree and
represent cross-parent reuse only via `relatedNodeIds` (non-hierarchical
hints), duplicating the actual node per parent. Rejected because
duplication breaks "abstraction must never mean information loss" in the
opposite direction - it would silently fork provenance across duplicate
copies of the same real-world entity. `parentIds[]` keeps one node,
multiple structural parents.
Acyclicity is enforced only on `parentIds` ("contains") edges, checked
via cycle detection (DFS with a visiting-set) in a Zod `.superRefine`.
`relatedNodeIds` is a distinct, symmetric-leaning relationship kind with
no "contains" semantics, so it is explicitly exempt - a future
relationship kind could have its own rules without revisiting this one.

**Namespace-qualified canonical ids, not raw `kind + name`.**
Original design used `id = "<kind>:<slug(name)>"`. Design review
correctly flagged this as too weak for V1's actual failure modes: not
just cosmetic variants ("Atlas" vs "MongoDB Atlas" - different strings,
already handled by exact-match, non-fuzzy identity), but same-*kind*,
same-*name*, different-*entity* collisions ("Atlas" the MongoDB product
vs. "Atlas" an internal company tool; this gets worse once graphs from
different companies' JDs are merged). Adopted: `id =
"<kind>:<slug(namespace)>:<slug(name)>"`, where `namespace` is a required
field on every node, defaulting to the literal `"generic"` when no more
specific context is known or needed (the common case - most technology/
skill names are unambiguous). `name` is explicitly documented as NOT
being sole identity.
Alternative considered (and rejected for V1, per review guidance):
fuzzy/semantic matching to auto-merge same-name nodes across namespaces
or JDs. Rejected as unnecessary complexity for V1 - it requires
similarity thresholds, a conflict-resolution UI, and false-positive
handling that don't yet have a validated need. Namespace makes the
identity model *capable* of disambiguation without forcing every node
author (human or AI) to resolve ambiguity that mostly doesn't exist;
`"generic"` is a safe, explicit default rather than a silent one.
Migration path: a later change can introduce an explicit "these two nodes
represent the same real-world entity" merge/alias mechanism (e.g. an
`aliasOf` pointer or a merge operation that reassigns provenance) without
changing this id scheme - namespace gives that future work a dimension to
resolve along instead of requiring an id-format migration.

**`Requirement` as a first-class entity; provenance references it by id.**
Original design inlined `sourceQuote` directly on every node's
`Provenance` entry. Design review correctly identified this as weaker
traceability than it should be: it duplicates the same JD sentence across
every node it produced (drift risk if ever edited) and doesn't give a
name to "the thing a node is derived from" - so answering "what does
requirement 014 produce?" requires scanning every node's provenance
rather than a direct lookup. Adopted: a `Requirement` type (`id`,
`jobDescriptionId`, `sourceText`, optional `experience`) lives in
`CareerGraph.requirements`, and `Provenance` becomes `{ jobDescriptionId,
requirementId, rationale? }` - a reference, not a copy. This also gives
years-of-experience data a natural home: `experience` is just an optional
field on the same `Requirement` a non-experience statement would use,
rather than a separate parallel `ExperienceRequirement` type with its own
bidirectional linking (`appliesToNodeIds` / `experienceRequirementIds`)
duplicating what `Provenance.requirementId` already expresses. Node-level
"which requirements apply to me" is answered by scanning that node's own
`provenance[].requirementId` - no separate field to keep in sync.
Alternative considered: keep the original inline-quote design and add a
separate `ExperienceRequirement` type as the review's example suggested
verbatim. Rejected in favor of the single-`Requirement`-type version
above because it is strictly less duplication for the same guarantees,
and still produces exactly the `Job -> Requirement -> Node` chain the
review asked for.

**JSON Patch validated by round-trip re-validation, not a patch-specific
schema.**
The applied result is parsed through the same CareerGraph Zod schema used
for full imports, rather than writing separate validation rules for
patches. Simpler and guarantees patches can never produce a graph that
violates any rule a full import would have to satisfy - including the
new cycle and referential-integrity checks. `version` is carried as a
plain integer field the caller compares before applying, not a full
CRDT/OT conflict-resolution system - appropriate for a V1 single-user,
single-tab client-side tool.

## Risks / Trade-offs

- [Namespace under-use recreates the original collision risk] If every
  node is authored with `namespace: "generic"` out of habit, same-name
  collisions across genuinely distinct entities are still possible within
  the "generic" bucket. → Mitigation: the schema *can* disambiguate the
  moment it's needed (no format migration required), and the later
  prompt-generation change is expected to give the AI explicit guidance
  on when to set a non-generic namespace (tracked as an Open Question
  below, not solved here).
- [DAG structure is more complex than a tree for consumers] Rendering and
  editing code (later changes) must handle multi-parent nodes rather than
  a simple recursive tree walk. → Mitigation: `nodes` is a flat collection
  with explicit `parentIds`, so consumers already need a graph-aware
  traversal; no additional complexity is introduced beyond what the DAG
  choice itself requires.
- [Cycle detection cost] Validating acyclicity requires a graph traversal
  over `parentIds` on every full validation, not just a per-field check.
  → Mitigation: CareerGraphs are single-user, client-side, and expected
  to be small (hundreds, not millions, of nodes) - a DFS cycle check is
  cheap at this scale.
- [No conflict resolution beyond version-mismatch detection] If the user
  edits the graph in-app after generating a prompt and then imports an
  AI response/patch generated against the pre-edit version, the system
  can only warn, not auto-merge. → Mitigation: explicit user confirmation
  step on stale-version import (behavior defined in spec.md; UI for it is
  a later change).
- [Fixture drift] Hand-authored fixture data can go stale as the schema
  evolves. → Mitigation: fixture is part of the automated test suite
  (spec.md "Reference fixture data"), so drift fails CI rather than
  going unnoticed.

## Migration Plan

Not applicable - this is new code in a repository with no prior domain
model or application code to migrate.

## Open Questions

- How should the future prompt-generation change instruct the external
  AI to choose a `namespace` value (always default to `"generic"` unless
  told otherwise? maintain a suggested namespace list seeded from company
  names seen in imported JDs?). Doesn't affect this change's specs, Zod
  schema, or task breakdown - `namespace` is just a required string field
  here, whatever value a producer supplies is validated the same way.
- What does an eventual cross-namespace "these are the same entity" merge
  operation look like (alias pointer vs. provenance reassignment vs. node
  replacement)? Deferred to whichever future change first needs it; the
  namespace-qualified id scheme adopted here is designed not to block
  that decision either way.
