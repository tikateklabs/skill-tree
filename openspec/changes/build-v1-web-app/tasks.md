## 1. App scaffolding

- [ ] 1.1 Add Vite + React + TypeScript dependencies and config
      (`vite.config.ts` with `base: "./"`, `index.html` at repo root,
      `src/app/main.tsx` entry) and verify `npm run dev` serves a blank
      page with no console errors
- [ ] 1.2 Add `npm run build`/`npm run preview` scripts for the app
      (distinct from the existing domain `tsc` build) and verify
      `npm run build` produces a `dist/` static site and `npm run
      preview` serves it
- [ ] 1.3 Add the top-level app shell component (header, active-panel
      switcher state: `graph | jd-import | prompt | import-response`,
      no router) and a base stylesheet with light/dark CSS custom
      properties, and verify it renders in the browser

## 2. State management and persistence

- [ ] 2.1 Implement the `CareerGraphProvider` (React Context +
      `useReducer`) wrapping a single active `CareerGraph`, with an
      empty starter graph as the initial default, and verify a unit
      test confirms the starter graph validates against
      `careerGraphSchema`
- [ ] 2.2 Implement the mutation-gating pattern: every reducer action
      computes a candidate graph, validates it via `careerGraphSchema`
      (or `validateCareerGraphImport`/`applyCareerGraphPatch` for
      import/patch actions), and only commits on success, bumping
      `version`/`updatedAt`; verify a unit test confirms a rejected
      candidate leaves state unchanged and surfaces the validation error
- [ ] 2.3 Implement IndexedDB persistence via `idb` (single object
      store, key `"current"`), auto-saving (debounced) on every accepted
      mutation and loading on app start, and verify a component test
      (with a fake IndexedDB) confirms a saved graph is restored after a
      simulated reload
- [ ] 2.4 Implement export-to-file (download the active graph as
      `.json`) and verify a unit test confirms the exported content is
      deep-equal to the active graph
- [ ] 2.5 Implement import-from-file through `validateCareerGraphImport`
      and verify unit tests cover both an accepted replacement and a
      rejected file that leaves the active graph unchanged

## 3. Graph rendering

- [ ] 3.1 Add `cytoscape` and `cytoscape-dagre`, implement the
      graph-view component building Cytoscape elements from the active
      CareerGraph (one node per domain node/role, one edge per
      `parentIds` entry, one dashed edge per `relatedNodeIds` entry),
      and verify it renders the reference fixture in the browser with a
      hierarchical layout
- [ ] 3.2 Style nodes by `kind` (distinct color/shape per Role/
      Capability/Skill/Concept/Technology/Tool) and verify visually in
      the browser against the fixture, which contains every kind
- [ ] 3.3 Implement collapse/expand as app-level `collapsedNodeIds`
      state filtering which elements are passed to Cytoscape (not a
      Cytoscape extension), and verify a unit test confirms collapsing a
      node removes its descendants from the computed element set without
      mutating the underlying CareerGraph
- [ ] 3.4 Implement the node inspector panel (name/kind/namespace,
      provenance resolved to Requirement.sourceText + JobDescription,
      relatedNodeIds resolved to names, children, attached experience
      requirements) opened on node selection, and verify a component
      test against the fixture's Prometheus node covers the "shows
      originating JD wording" and "shows experience requirement"
      scenarios
- [ ] 3.5 Manually verify in a running browser (per the `run`/testing
      workflow): load the app with the fixture, confirm the graph
      renders, multi-parent node (Observability) appears once with two
      incoming edges, click through several nodes and confirm the
      inspector content matches spec.md's scenarios

## 4. Graph editing

- [ ] 4.1 Implement "add node" (kind/namespace/name/parent selection
      from existing nodes filtered by valid parent kind/provenance
      selection from existing Requirements) with the id derived
      automatically, and verify a unit test covers a valid add and a
      rejected add with no provenance selected
- [ ] 4.2 Implement "rename node" (edit name/namespace) with the
      cascade that rewrites every other node's `parentIds`/
      `relatedNodeIds` referencing the old id, applied atomically, and
      verify a unit test confirms references are consistently updated
      and the result validates
- [ ] 4.3 Implement "delete node" with the cascade-computation function
      (nodes left with zero parents are also removed, transitively) and
      a confirmation UI showing the full computed set before commit, and
      verify unit tests cover both a cascading delete and a
      non-cascading delete (surviving second parent)
- [ ] 4.4 Implement Requirement experience-details add/edit UI
      enforcing the same `logic`/`subjects.length` constraints the
      domain schema enforces, and verify a unit test confirms an
      inconsistent edit (e.g. SINGLE with 2 subjects) is rejected before
      commit

## 5. Job description import

- [ ] 5.1 Implement the "add JobDescription" form (title, optional
      company, raw text) appending to `sourceJobDescriptions`, and
      verify a unit test confirms raw text is stored verbatim
- [ ] 5.2 Implement the "record Requirement" form scoped to a selected
      JobDescription (sourceText, optional experience details) appending
      to `requirements`, and verify unit tests cover both a
      non-experience and an experience Requirement matching spec.md's
      scenarios

## 6. AI prompt generation

- [ ] 6.1 Implement prompt assembly (fixed instructions + generated
      JSON Schema + active CareerGraph JSON + selected JobDescription's
      raw text + patch-envelope format instructions) and verify a unit
      test confirms the assembled text contains the selected JD's
      rawText and the current graph's JSON
- [ ] 6.2 Implement the "copy to clipboard" action
      (`navigator.clipboard.writeText`) and verify a component test
      (with a mocked clipboard) confirms the full prompt text is passed
      to it

## 7. AI response import

- [ ] 7.1 Implement paste-and-parse with shape detection (full
      CareerGraph object vs. `{ baseVersion, operations }` patch
      envelope) and verify unit tests cover malformed JSON and a value
      matching neither shape
- [ ] 7.2 Wire full-graph responses through `validateCareerGraphImport`
      and patch envelopes through `applyCareerGraphPatch`, surfacing the
      failing stage (`json-schema` | `domain`) and reasons on rejection,
      and verify unit tests cover a JSON-Schema-stage rejection and a
      domain-stage-only rejection (structurally valid, semantically
      invalid), matching the two-layer contract's non-parity scenario
- [ ] 7.3 Implement the diff preview (patch: list of operations; full
      graph: added/removed node ids and requirement ids) shown before
      commit, and verify unit tests confirm the preview content for both
      cases against a known before/after pair
- [ ] 7.4 Implement stale-version flagging for patch envelopes (compare
      `baseVersion` to the active graph's current `version`) requiring
      explicit confirmation to proceed, and verify a unit test confirms
      a stale patch is flagged and not silently applied
- [ ] 7.5 Wire confirmed acceptance to commit through the same
      mutation-gating reducer path as in-app edits (task 2.2), and
      verify a unit test confirms a confirmed import updates
      `version`/`updatedAt` and persists (task 2.3)

## 8. Cross-cutting polish

- [ ] 8.1 Verify keyboard/focus basics on the node inspector and forms
      (labelled inputs, visible focus states) by manual check in the
      browser
- [ ] 8.2 Confirm the production build (`npm run build`) works with a
      non-root `base` path (simulate a GitHub Pages project-site path)
      and verify assets load correctly under `npm run preview`

## 9. Full verification

- [ ] 9.1 Run the full test suite (existing domain tests + new app
      tests) and verify all pass
- [ ] 9.2 Run typecheck and verify it is clean across `src/domain` and
      `src/app`
- [ ] 9.3 Run the production build and verify it completes without
      errors or warnings that indicate broken output
- [ ] 9.4 Add and run one Playwright smoke test against the built/
      previewed app: load -> graph renders -> select a node -> inspector
      shows content, and verify it passes
- [ ] 9.5 Manually drive the app in a browser through the full golden
      path - start from the empty starter graph, add a JobDescription,
      record a Requirement, add a node against it, generate a prompt,
      paste back a hand-authored valid full-graph response, confirm the
      diff preview, commit, reload the page, confirm persistence - and
      report the result
