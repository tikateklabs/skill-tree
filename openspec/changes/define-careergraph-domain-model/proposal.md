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

- Define the CareerGraph domain model: `JobDescription`, `Role`,
  `Capability`, `Skill`, `Concept`, `Technology`, `Tool`, `Provenance`,
  and `ExperienceRequirement`, plus the edges/relations connecting them.
- Define the experience-requirement model precisely: `minimumYears`,
  optional `maximumYears`, `logic` (`SINGLE` | `AND` | `OR`), `subjects[]`,
  verbatim `sourceText`, and the link(s) from a requirement to the node(s)
  it qualifies. JD-stated requirements only - no representation of the
  user's personal experience in this model.
- Define provenance as a mandatory, non-optional field on every node and
  every experience requirement: which JD it came from, the verbatim
  quoted wording, and (for AI-authored nodes) the rationale for why the
  node exists.
- Define node identity and de-duplication rules (how "Python" mentioned
  under two different capabilities is represented) and formalize the
  graph as a DAG rather than a strict tree, since a leaf technology/tool
  can legitimately support more than one skill.
- Publish the model as Zod schemas (source of truth, runtime-validated,
  TypeScript types derived) and generate a JSON Schema artifact from them
  for use in AI-facing prompts and external validation.
- Define the JSON Patch (RFC 6902) contract for how an external AI's
  partial edits are validated and applied against an existing
  CareerGraph, including conflict/version handling.
- Provide fixture data: a hand-built CareerGraph JSON derived from a
  sample JD (including an OR-logic and an AND-logic experience
  requirement) used as the acceptance baseline for schema validation.

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
