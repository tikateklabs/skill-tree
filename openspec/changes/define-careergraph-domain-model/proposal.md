## Why

Skill Tree has no domain model yet. Every later capability (JD import,
prompt generation, AI-response merging, graph rendering, editing) depends
on one thing existing first: a precise, versionable definition of what a
CareerGraph *is* - its entities, its identity rules, and its validation
rules. Building UI or prompt-generation before this model is fixed risks
baking in assumptions (tree vs. graph, node identity, how experience
requirements attach) that are expensive to unwind later. This change
establishes that foundation as data only, with no rendering or editing
surface.

## What Changes

- Define the CareerGraph domain model: `JobDescription`, `Requirement`,
  `Role`, `Capability`, `Skill`, `Concept`, `Technology`, `Tool`, and
  `Provenance`, plus the edges/relations connecting them.
- Define `Requirement` as the atomic, JD-derived statement every node and
  every years-of-experience constraint traces back to: `jobDescriptionId`,
  verbatim `sourceText`, and an optional `experience` object
  (`minimumYears`, optional `maximumYears`, `unit`, `logic`
  (`SINGLE` | `AND` | `OR`), `subjects[]`) present only when that
  statement states a years-of-experience constraint. JD-stated
  requirements only - no representation of the user's personal experience
  anywhere in this model.
- Define provenance as a mandatory, non-optional field on every node:
  `{ jobDescriptionId, requirementId, rationale? }`, referencing a
  `Requirement` by id rather than duplicating its quoted text, so every
  node is walkable as `Node -> Requirement -> JobDescription`.
- Define node identity as a namespace-qualified canonical id
  (`kind:namespace:name`, `namespace` required, defaulting to
  `"generic"`) so that display name alone is never a node's identity -
  guarding against same-name/different-entity collisions (e.g. "Atlas"
  the MongoDB product vs. an internal tool of the same name) without
  introducing fuzzy matching in V1.
- Formalize the graph as a DAG for hierarchical (`parentIds`, "contains")
  edges, since a node can legitimately have more than one parent (e.g.
  "Observability" under both "AIOps" and "SRE"), with acyclicity enforced
  on those edges specifically - not on non-hierarchical `relatedNodeIds`
  edges, which may have different semantics in future.
- Publish the model as Zod schemas (source of truth, runtime-validated,
  TypeScript types derived) and generate a JSON Schema artifact from them
  for use in AI-facing prompts and external validation.
- Define the JSON Patch (RFC 6902) contract for how an external AI's
  partial edits are validated and applied against an existing
  CareerGraph, including conflict/version handling.
- Provide fixture data: a hand-built CareerGraph JSON derived from a
  sample JD, including the two canonical experience-requirement examples
  (a SINGLE-logic and a 4-subject OR-logic requirement) with exact
  structured-value assertions, used as the acceptance baseline for schema
  validation.

No UI, no persistence layer, no prompt templates, and no application
scaffolding (package.json/Vite/React) are introduced by this change -
those are follow-on changes that will depend on this one.

## Capabilities

### New Capabilities
- `career-graph-domain-model`: the CareerGraph entities, relationships,
  identity rules, provenance rules, and Zod/JSON Schema validation
  contract described above.

### Modified Capabilities
(none - this is the first capability in the repo)

## Impact

- New code: `src/domain/` (or equivalent) containing Zod schemas, derived
  TypeScript types, a JSON Schema generation script, and fixture data.
  No existing code is affected (repository currently has no application
  code).
- Establishes the contract every later change (prompt generation, JD
  import, graph rendering/editing, AI-response import) must build against.
  Changing this model later is a breaking change to all of those.
