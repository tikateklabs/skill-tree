## Why

The CareerGraph domain model (`define-careergraph-domain-model`) exists
but nothing renders it, edits it, or gets it in and out of the app. The
product is unusable until a static, client-side web app exists that lets
a user: see a CareerGraph as a graph, inspect a node's provenance/JD
wording/experience requirements, build/edit a graph by hand, generate a
copy-pasteable prompt for an external AI, import the AI's response back
in (validated through the two-layer contract), and have the graph
survive a page reload. This change builds all of that in one pass, per
explicit user direction to bring up the complete V1 UI now rather than
sequencing it across several changes.

## What Changes

- Scaffold a Vite + React + TypeScript static site (deployable to GitHub
  Pages) that depends on the existing `src/domain/` package - no new
  domain model changes, no backend, no server-side LLM call.
- **Graph rendering**: Cytoscape.js visualization of a CareerGraph as a
  DAG (Role -> Capability -> Skill -> {Concept, Technology, Tool}),
  styled by node kind, with expand/collapse and a hierarchical layout
  that copes with multi-parent nodes.
- **Node inspector**: selecting a node shows why it exists (provenance ->
  Requirement.sourceText -> JobDescription), related nodes
  (`relatedNodeIds`), child nodes, and any experience requirements
  attached to it (minimum/maximum years, logic, subjects).
- **Graph editing**: forms to add/edit/delete nodes and requirements,
  change parent/related links, and edit experience-requirement details -
  every mutation goes through the existing Zod domain schema before it
  is committed to state, so the UI can never produce an invalid
  CareerGraph.
- **Job description import**: paste a JD's title/company/raw text to
  create a `JobDescription`, then manually add `Requirement` entries
  against it (with optional experience details) - no automated NLP/AI
  parsing (none is available in V1); the user (or, externally, an AI
  following the generated prompt) does the extraction.
- **AI prompt generation**: assemble a copy-pasteable prompt embedding
  the current CareerGraph JSON, the generated JSON Schema, and the
  target JD text, instructing an external AI (ChatGPT/Claude/Gemini) to
  return either a full CareerGraph JSON or an RFC 6902 JSON Patch.
- **AI response import**: paste the AI's response back in; validate it
  through `validateCareerGraphImport`/`applyCareerGraphPatch`
  (already implemented) before ever mutating app state; on success show
  what changed before committing, on failure show which validation stage
  rejected it and why.
- **Local persistence**: save the current CareerGraph to IndexedDB,
  auto-saving on every accepted mutation, reloading on app start; export
  the current graph as a downloadable `.json` file; import a graph from
  an uploaded `.json` file (through the same validated import path).

## Capabilities

### New Capabilities
- `graph-rendering`: Cytoscape.js-based visualization of a CareerGraph
  and the node inspector panel.
- `graph-editing`: in-app mutation of nodes, requirements, and links,
  validated against the domain schema before commit.
- `job-description-import`: capturing JobDescriptions and manually
  authored Requirements against them.
- `ai-prompt-generation`: building the copy-pasteable external-AI prompt.
- `ai-response-import`: validating and applying an AI's pasted-back full
  graph or JSON Patch response.
- `local-persistence`: IndexedDB-backed save/load/export/import of the
  CareerGraph.

### Modified Capabilities
(none - `career-graph-domain-model` is consumed as-is, not changed)

## Impact

- New code: a Vite/React app under `src/app/` (or `web/`, see design.md)
  consuming `src/domain/` as a library. New dependencies: react,
  react-dom, vite, cytoscape (+ a DAG layout extension), idb (IndexedDB
  wrapper). No changes to `src/domain/`.
- This is the last change in the V1 dependency chain from
  `define-careergraph-domain-model`'s design.md (Domain -> JSON Schema ->
  Validation -> Graph -> JD Import -> Prompts -> Patches -> Persistence) -
  collapsed into one change per explicit user direction, rather than
  split across six. Internally still built and reviewed capability by
  capability (see tasks.md) to keep risk manageable.
- Establishes the app shell everything after V1 (readiness scoring,
  multi-graph comparison, etc., none of which are in scope here) would
  build on.
