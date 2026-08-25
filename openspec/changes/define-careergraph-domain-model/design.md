## Context

See proposal.md - Why. This design covers only the CareerGraph domain
model: its shape, identity rules, validation, and the JSON Patch contract.
No package.json/build tooling exists yet in the repo; this change is
expected to introduce the first application code (a `src/domain/`
module) and the minimal tooling needed to type-check, test, and generate
JSON Schema from it - not a full app scaffold.

## Goals / Non-Goals

**Goals:**
- A precise, implementable shape for every entity in spec.md.
- A single source of truth (Zod) with no hand-maintained duplicate types.
- A node-identity scheme that survives repeated AI round-trips without
  drifting into duplicate nodes.
- A JSON Patch contract that is safe against stale or invalid patches.

**Non-Goals:**
- No UI, no Cytoscape integration, no rendering.
- No persistence layer (IndexedDB/localStorage) - this change defines the
  in-memory shape only; a later change defines how it's stored.
- No prompt-template generation - a later change consumes this model to
  build prompts, but authoring those templates is out of scope here.
- No JD-parsing/NLP logic - how text becomes a CareerGraph (manual entry
  vs. AI-assisted) is out of scope; this change only defines the target
  shape the parsed result must conform to.

## Decisions

**Zod as source of truth, JSON Schema generated from it.**
Alternative considered: hand-author JSON Schema and derive TS types from
it (`json-schema-to-ts`). Rejected because Zod gives both compile-time
types and runtime validation from one definition with no build step for
the TS side, and the JSON Schema (needed only for AI-facing prompts and
external tooling) is a lower-frequency derived artifact that tolerates a
generation step (`zod-to-json-schema` or equivalent) better than the
reverse.

**DAG via `parentIds[]`, not a strict tree.**
The product brief's example (Prometheus/Splunk/OpenTelemetry under
Observability) reads as a tree, but real JDs routinely require the same
technology under multiple skills (Python under both "Data Engineering"
and "Backend Development"). Alternative considered: keep it a strict tree
and represent cross-skill reuse only via `relatedNodeIds` (non-hierarchical
hints), duplicating the actual node per parent. Rejected because
duplication breaks "abstraction must never mean information loss" in the
opposite direction - it would silently fork provenance and experience-
requirement links across duplicate copies of the same real-world entity.
`parentIds[]` keeps one node, multiple structural parents; `relatedNodeIds`
remains available for genuine non-hierarchical relationships (e.g., a
`Concept` informing a `Tool` choice without being its structural parent).

**Deterministic id derivation (`kind` + normalized `name`), not random
UUIDs.**
Needed so that two independent AI responses (or two JDs) both mentioning
"Prometheus" merge into one node instead of creating duplicates the user
must manually reconcile. Alternative considered: random ids with a
separate fuzzy-matching merge step at import time. Rejected for V1 as
significantly more complex (fuzzy matching, thresholds, manual conflict
UI) for a problem deterministic normalization mostly solves; exact-name
collisions across genuinely distinct concepts are rare enough to accept
as a known limitation (see Risks) rather than design for now. `Role` and
`JobDescription` keep opaque ids (only one `Role` per graph; JDs aren't
deduplicated by name).

**Provenance is mandatory, `rationale` is optional.**
`sourceQuote` is the load-bearing field (the actual traceability
guarantee the product requires); `rationale` is an explanatory add-on an
AI may or may not supply. Making `rationale` mandatory would force
low-value filler text when an AI omits it.

**JSON Patch validated by round-trip re-validation, not a patch-specific
schema.**
The applied result is parsed through the same CareerGraph Zod schema used
for full imports, rather than writing separate validation rules for
patches. Simpler and guarantees patches can never produce a graph that
violates any rule a full import would have to satisfy. `version` is
carried as a plain integer field the caller compares before applying,
not a full CRDT/OT conflict-resolution system - appropriate for a V1
single-user, single-tab client-side tool.

## Risks / Trade-offs

- [Deterministic ids can under-merge or over-merge] Two distinct
  real-world things that happen to share a normalized name (e.g., a
  company-internal tool literally named "Atlas" vs. MongoDB Atlas) would
  incorrectly merge into one node. → Mitigation: node `kind` is part of
  the id, narrowing collisions to same-kind, same-name cases; `Skill`
  vs. `Technology` disambiguates most real cases. Full resolution
  (disambiguation UI) deferred to a later change if it proves to matter.
- [DAG structure is more complex than a tree for consumers] Rendering and
  editing code (later changes) must handle multi-parent nodes rather than
  a simple recursive tree walk. → Mitigation: `nodes` is a flat collection
  with explicit `parentIds`, so consumers already need a graph-aware
  traversal; no additional complexity is introduced beyond what the DAG
  choice itself requires.
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
