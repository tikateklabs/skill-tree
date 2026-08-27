## Context

See proposal.md - Why. `src/domain/` (careerGraphSchema, `deriveNodeId`,
`validateCareerGraphImport`, `applyCareerGraphPatch`,
`generateCareerGraphJsonSchema`) already exists and is not touched by
this change. This app is a pure consumer of it. No backend, no database,
no server-side LLM call - everything here runs in the browser and
deploys as a static site.

## Goals / Non-Goals

**Goals:**
- One coherent Vite/React app covering all six capabilities in
  proposal.md, built on top of the existing domain package.
- Every state mutation - editing, JD/response import, patch application -
  goes through the domain Zod schema before it is ever committed to
  in-memory state. The UI cannot produce an invalid CareerGraph.
- Deployable as a static site with no server dependency.

**Non-Goals:**
- No automated JD-text-to-graph parsing/NLP - that's what the external
  AI round-trip is for. The in-app "JD import" capability only captures
  raw text and lets a human manually record `Requirement` entries
  against it.
- No multi-graph project switcher - V1 persists exactly one active
  CareerGraph. (The domain model already supports multiple
  JobDescriptions inside one graph, which is how multi-JD use is
  handled in V1.)
- No real-time collaboration, no accounts, no server-synced state.
- No readiness/gap scoring, no comparison views - out of scope for V1.

## Decisions

**App layout: `src/app/` alongside `src/domain/`, one package.json, no
monorepo.** Vite entry (`index.html` at repo root, `src/app/main.tsx`)
consumes `src/domain` via a relative import, not a published package.
Alternative considered: a workspace/monorepo split (`packages/domain`,
`packages/web`). Rejected as unnecessary process overhead for a project
this size - one `npm install`, one `npm test`, one `npm run build`
stays simpler and is easy to split later if it's ever needed.

**State: React Context + `useReducer` over a single `CareerGraph`, not a
state-management library.** All mutations (add/edit/delete node, add
requirement, apply patch, import full graph) are reducer actions. Every
action that changes structure computes a candidate `CareerGraph` and
runs it through `careerGraphSchema.safeParse` (or
`validateCareerGraphImport`/`applyCareerGraphPatch` for external input)
before committing; a rejected candidate leaves state untouched and
surfaces the Zod/JSON-Schema error to the user. `version` is
incremented and `updatedAt` refreshed on every accepted mutation.
Alternative considered: Redux/Zustand/Jotai. Rejected - a single
document with reducer-gated mutations doesn't need a library; the
domain schema itself is already the "single source of truth" the
product principle calls for.

**Rename cascades id-derived references atomically.** Since a
non-`Role` node's `id` is derived from `kind:namespace:name`, editing
`namespace` or `name` changes its canonical id. The "rename" reducer
action: (1) computes the new id, (2) rewrites every other node's
`parentIds`/`relatedNodeIds` entry equal to the old id to the new id,
(3) validates the whole result via the domain schema, (4) commits
atomically or rejects with nothing partially applied. This is the only
correct behavior given the id-derivation design in
`define-careergraph-domain-model` - not a new decision so much as that
change's identity rule applied to editing.

**Delete cascades exactly as far as the non-empty-parentIds invariant
requires, with a confirmation step.** Deleting node X: strip X from
every other node's `parentIds`/`relatedNodeIds`; any node whose
`parentIds` is now empty is itself deleted (a non-Role node cannot have
zero parents); repeat until no more nodes become parentless. The UI
computes and shows the full set of nodes that would be removed before
the user confirms - deletion is otherwise silent data loss, which
violates the product's no-information-loss principle.

**Cytoscape.js + `cytoscape-dagre` for layout; no expand/collapse
extension.** `cytoscape-dagre` handles DAGs (not just trees) natively,
which multi-parent nodes require. Collapse/expand of a subtree is
implemented as app-level state (`collapsedNodeIds: Set<string>`)
filtering which elements are passed to Cytoscape, rather than the
`cytoscape-expand-collapse` extension. Alternative considered: that
extension. Rejected because it models collapse around compound
(tree-shaped) nodes and its behavior on a node with multiple parents is
undocumented/unclear; filtering elements ourselves is a small amount of
code with predictable DAG semantics we control directly.
`parentIds` edges render solid; `relatedNodeIds` edges render dashed,
so the two relationship kinds this domain model distinguishes are
visually distinguishable too.

**AI response import: RFC 6902 patch operations ARE the diff preview;
full-graph replacement gets a computed shallow diff.** For a pasted
JSON Patch, the operations themselves (op/path/value) are shown
directly as the preview - no separate diffing needed. For a pasted full
CareerGraph, a small custom comparison (added/removed node ids,
added/removed requirement ids, nodes whose provenance/parentIds changed)
is computed and shown before commit. Alternative considered: a generic
deep-diff library (e.g. `deep-diff`, `microdiff`). Rejected - a
generic line/key diff over the whole JSON is noisy and harder to read
than a small purpose-built summary tailored to this domain's shape
(nodes/requirements added, removed, changed).

**Persistence: IndexedDB via the `idb` package, one record.** A single
object store (`careerGraphs`), one key (`"current"`), auto-saved
(debounced) on every accepted mutation, loaded on app start. Falls back
to an empty starter graph (a bare `Role` with no children) if nothing is
stored yet. Export/import to/from a downloaded/uploaded `.json` file
reuses `validateCareerGraphImport` - the file-import path and the
AI-response-import path are the same validated pipeline. `idb` chosen
over raw `indexedDB` for its small (~1KB), well-known Promise wrapper -
avoids hand-rolling callback-based IndexedDB code for marginal benefit.

**Prompt generation: one template string, not a template engine.** The
prompt concatenates fixed instructions, the generated JSON Schema
(pretty-printed), the current CareerGraph JSON (pretty-printed), and the
target JobDescription's raw text, with a "copy to clipboard" action
(`navigator.clipboard.writeText`). No templating library - string
interpolation is sufficient for one fixed template.

**Styling: plain CSS, no component/utility-CSS framework.** One
stylesheet using CSS custom properties for the palette (light/dark via
`prefers-color-scheme`), flexbox/grid layout. Alternative considered:
Tailwind. Rejected for V1 - avoids extra build/PostCSS configuration for
an app of this size; revisit if the UI grows enough to need it.

**No client-side router.** Single-page app; the active panel
(`graph | jd-import | prompt | import-response`) is component state, not
a URL route. Avoids a routing dependency V1 doesn't need.

**Testing: Vitest + Testing Library for logic/components; a small
Playwright smoke test against the built app for the golden path.**
Reducer validation-gating, id-derivation-on-rename, delete-cascade
computation, diff computation, and prompt-string assembly are unit/
component-tested. One Playwright test (browser already provisioned in
this environment) drives the built app end-to-end: load -> graph
renders -> click a node -> inspector shows its provenance - catching
integration breakage unit tests can't.

## Risks / Trade-offs

- [Single active graph] A user working across multiple unrelated roles
  at once has nowhere to put a second graph without overwriting the
  first. -> Mitigation: export/import to `.json` lets them keep separate
  files manually; a project switcher is an explicit, easy follow-on
  change once this is validated.
- [Manual JD requirement entry is tedious] Without automated parsing,
  recording every JD requirement by hand is slow. -> Mitigation: this is
  the deliberate V1 design (AI is external) - the prompt-generation/
  response-import loop is the fast path; manual entry is the fallback
  for JDs the user hasn't run through an AI yet.
- [Custom collapse/expand and diff logic instead of libraries] More code
  for this change to own and test versus an off-the-shelf dependency.
  -> Mitigation: both are small, domain-shaped, and testable in
  isolation; the rejected alternatives carried worse fit or unclear DAG
  behavior, which is the more expensive risk long-term.
- [Rename/delete cascades touch multiple nodes atomically] A bug here
  could silently corrupt a graph. -> Mitigation: every cascade still
  ends in a full `careerGraphSchema` validation before commit - an
  incorrect cascade fails closed (rejected, state untouched) rather than
  producing an invalid graph.

## Migration Plan

Not applicable - new code, nothing existing to migrate. The app starts
from an empty starter graph or an imported `.json` file; no data exists
yet to carry forward.
