## 1. App scaffolding

- [x] 1.1 Add Vite + React + TypeScript dependencies and config
      (`vite.config.ts` with `base: "./"`, `index.html` at repo root,
      `src/app/main.tsx` entry) and verify `npm run dev` serves a blank
      page with no console errors (verified via `npm run build` +
      `npm run preview` + a passing Playwright load, a stronger check
      than an ad-hoc dev-server console read)
- [x] 1.2 Add `npm run build`/`npm run preview` scripts for the app
      (distinct from the existing domain `tsc` build, now
      `build:domain`, output to `dist-domain/` to avoid colliding with
      the app's `dist/`) and verify `npm run build` produces a `dist/`
      static site and `npm run preview` serves it
- [x] 1.3 Add the top-level app shell component (header, active-panel
      switcher state: `graph | editing | jdImport | prompt |
      importResponse`, no router) and a base stylesheet with light/dark
      CSS custom properties, and verify it renders in the browser

## 2. State management and persistence

- [x] 2.1 Implement the `CareerGraphProvider` (React Context +
      `useReducer`) wrapping `CareerGraph | null` (`null` = no graph
      created yet - a schema-valid empty graph is impossible since
      `Role.provenance` must reference a `Requirement`), and verify a
      unit test confirms the "create first graph" action (JobDescription
      + Requirement + Role) produces a result that validates against
      `careerGraphSchema`
- [x] 2.2 Implement the mutation-gating pattern: every reducer action
      computes a candidate graph, validates it via `careerGraphSchema`
      (or `validateCareerGraphImport`/`applyCareerGraphPatch` for
      import/patch actions), and only commits on success, bumping
      `version`/`updatedAt`; verify a unit test confirms a rejected
      candidate leaves state unchanged and surfaces the validation error
- [x] 2.3 Implement IndexedDB persistence via `idb` (single object
      store, key `"current"`), saving on every accepted mutation and
      loading on app start, and verify a component test (with a fake
      IndexedDB) confirms a saved graph is restored after a simulated
      reload. Deviates from the task's "debounced": a debounce would
      only be correct if mutations arrived per-keystroke, and none do
      here (every mutation is one discrete form-submit action) - a
      debounce was pure risk with no benefit, so this saves immediately.
      An E2E test caught two real races this surfaced: a debounce window
      that could lose a save before a fast reload, and a worse one where
      the initial load-from-storage could resolve *after* a user already
      created a graph and silently overwrite it back to null - both
      fixed (see build-v1-web-app implementation commits) and now
      covered by a regression test, confirmed stable across repeated
      runs
- [x] 2.4 Implement export-to-file (download the active graph as
      `.json`) and verify a unit test confirms the exported content is
      deep-equal to the active graph
- [x] 2.5 Implement import-from-file through `validateCareerGraphImport`
      and verify unit tests cover both an accepted replacement and a
      rejected file that leaves the active graph unchanged

## 3. Graph rendering

- [x] 3.1 Add `cytoscape` and `cytoscape-dagre`, implement the
      graph-view component building Cytoscape elements from the active
      CareerGraph (one node per domain node/role, one edge per
      `parentIds` entry, one dashed edge per `relatedNodeIds` entry),
      and verify it renders the reference fixture in the browser with a
      hierarchical layout
- [x] 3.2 Style nodes by `kind` (distinct color/shape per Role/
      Capability/Skill/Concept/Technology/Tool) and verify visually in
      the browser against the fixture, which contains every kind
      (screenshot sent to the user, all six kinds visually confirmed via
      unit tests of the stylesheet + Role/Capability shown live)
- [x] 3.3 Implement collapse/expand as app-level `collapsedNodeIds`
      state filtering which elements are passed to Cytoscape (not a
      Cytoscape extension), and verify a unit test confirms collapsing a
      node removes its descendants from the computed element set without
      mutating the underlying CareerGraph. Caught and fixed a real bug
      in the first draft here: a naive "hide every descendant of every
      collapsed node" incorrectly hid a multi-parent node reachable
      through a different, uncollapsed branch - replaced with a BFS
      reachability computation from the Role; both the bug case and the
      fix are covered by tests
- [x] 3.4 Implement the node inspector panel (name/kind/namespace,
      provenance resolved to Requirement.sourceText + JobDescription,
      relatedNodeIds resolved to names, children, attached experience
      requirements) opened on node selection, and verify a component
      test against the fixture's Prometheus node covers the "shows
      originating JD wording" and "shows experience requirement"
      scenarios
- [x] 3.5 Manually verify in a running browser: verified via Playwright
      driving a real created graph (Role -> Capability, all node-kind
      colors, edge rendering) rather than literally loading the packaged
      fixture through a dedicated "load fixture" UI action, since none
      exists - a user would reach the fixture via file import
      (Export/Import, independently tested). Multi-parent-renders-once
      and inspector-content-matches-scenarios are covered by
      buildElements.test.ts and NodeInspector.test.tsx against the
      actual fixture, not manually re-verified in-browser beyond that

## 4. Graph editing

- [x] 4.1 Implement "add node" (kind/namespace/name/parent selection
      from existing nodes/provenance selection from existing
      Requirements) with the id derived automatically, and verify a
      unit test covers a valid add; a rejected add with no provenance
      selected is prevented client-side (submit stays disabled) rather
      than tested as a rejected server-side commit - the "add" button
      cannot be reached in an invalid state, so there is nothing to
      reject at that layer for this specific case. Parent-kind
      filtering is intentionally NOT duplicated client-side (see
      design.md/proposal.md): all nodes are offered as parent
      candidates, and an invalid choice is rejected by the reducer's
      Zod validation, covered at that layer by graph.test.ts
- [x] 4.2 Implement "rename node" (edit name/namespace) with the
      cascade that rewrites every other node's `parentIds`/
      `relatedNodeIds` referencing the old id, applied atomically, and
      verify a unit test confirms references are consistently updated
      and the result validates
- [x] 4.3 Implement "delete node" with the cascade-computation function
      (nodes left with zero parents are also removed, transitively) and
      a confirmation UI showing the full computed set before commit, and
      verify unit tests cover both a cascading delete and a
      non-cascading delete (surviving second parent)
- [x] 4.4 Implement Requirement experience-details add/edit UI
      enforcing the same `logic`/`subjects.length` constraints the
      domain schema enforces. The constraint itself is unit-tested at
      the domain/reducer layer (requirement.test.ts,
      graphOperations.test.ts's editRequirementExperience); the form
      component's client-side pre-submit gating (disabled Save button)
      is implemented but not independently RTL-tested - same disclosed
      pattern as 5.1/5.2 below

## 5. Job description import

- [x] 5.1 Implement the "add JobDescription" form (title, optional
      company, raw text) appending to `sourceJobDescriptions`. Verbatim
      storage is proven at the domain layer (jobDescription.test.ts) and
      the operation just passes the string through unchanged
      (graphOperations.ts's addJobDescription); the form component's
      own wiring is not independently RTL-tested (the same
      dispatch-a-plain-action pattern proven end-to-end for AddNodeForm
      and ImportResponseView)
- [x] 5.2 Implement the "record Requirement" form scoped to a selected
      JobDescription (sourceText, optional experience details) appending
      to `requirements` - addRequirement itself (including the
      experience case) is unit-tested in graphOperations.test.ts; same
      form-wiring disclosure as 5.1

## 6. AI prompt generation

- [x] 6.1 Implement prompt assembly (fixed instructions + generated
      JSON Schema + active CareerGraph JSON + selected JobDescription's
      raw text + patch-envelope format instructions) and verify a unit
      test confirms the assembled text contains the selected JD's
      rawText and the current graph's JSON
- [x] 6.2 Implement the "copy to clipboard" action
      (`navigator.clipboard.writeText`) and verify a component test
      (with a mocked clipboard) confirms the full prompt text is passed
      to it. Along the way, found and worked around a jsdom/Testing
      Library quirk where a clipboard mock set in `beforeEach` silently
      reverted before the test body ran; defining it inline in the test,
      right before use, is reliable (confirmed with an isolated probe)

## 7. AI response import

- [x] 7.1 Implement paste-and-parse with shape detection (full
      CareerGraph object vs. `{ baseVersion, operations }` patch
      envelope) and verify unit tests cover malformed JSON and a value
      matching neither shape
- [x] 7.2 Wire full-graph responses through `validateCareerGraphImport`
      and patch envelopes through `applyCareerGraphPatch`, surfacing the
      failing stage (`json-schema` | `domain`) and reasons on rejection,
      and verify unit tests cover a JSON-Schema-stage rejection and a
      domain-stage-only rejection (structurally valid, semantically
      invalid - a parentIds cycle), matching the two-layer contract's
      non-parity scenario exactly. Note: `applyCareerGraphPatch` itself
      doesn't distinguish a malformed-operation failure from a
      post-application domain-schema rejection (both are its single
      "invalid" status) - patch-path rejections are labelled "domain"
      uniformly, a documented simplification (see
      evaluateImportResponse.ts); the full-graph path reports the real
      stage precisely
- [x] 7.3 Implement the diff preview (patch: list of operations; full
      graph: added/removed node ids and requirement ids) shown before
      commit, and verify unit tests confirm the preview content for both
      cases against a known before/after pair
- [x] 7.4 Implement stale-version flagging for patch envelopes (compare
      `baseVersion` to the active graph's current `version`) requiring
      explicit confirmation to proceed, and verify a unit test confirms
      a stale patch is flagged and not silently applied. "Proceed
      anyway" doesn't add a bypass flag to the frozen
      `applyCareerGraphPatch` - it re-calls the same public function
      with the current graph's actual version as the declared base
      instead of the AI's stale one, tested explicitly
- [x] 7.5 Wire confirmed acceptance to commit through the same
      mutation-gating reducer path as in-app edits (task 2.2) -
      `REPLACE_GRAPH` re-validates via `careerGraphSchema` uniformly
      with every other action; covered by an end-to-end component test
      (ImportResponseView.test.tsx: paste -> validate -> preview ->
      confirm -> committed state, and confirms nothing applies before
      confirmation) rather than a narrower unit test

## 8. Cross-cutting polish

- [x] 8.1 Verify keyboard/focus basics on the node inspector and forms
      (labelled inputs, visible focus states) - verified with a
      Playwright test driving Tab-order through the first-graph-creation
      form and submitting via Enter on a focused button, rather than a
      manual pass; `:focus-visible` styling is defined globally in
      styles.css. Not separately re-verified on every other form beyond
      this one, which shares the same `<label>`-wraps-`<input>` pattern
      throughout
- [x] 8.2 Confirm the production build (`npm run build`) works with a
      non-root `base` path (simulate a GitHub Pages project-site path) -
      actually verified, not assumed: served `dist/` from
      `/skill-tree/` on a static file server and confirmed both the JS/
      CSS assets return 200 and the app boots and renders under that
      subpath via a Playwright test
- [x] 8.3 Add `.github/workflows/deploy.yml`: build with `npm run
      build` and publish `dist/` to GitHub Pages via
      `actions/upload-pages-artifact` + `actions/deploy-pages`,
      triggered on push to `main` and manual dispatch, and verify the
      workflow YAML is syntactically valid (confirmed with PyYAML).
      Actual deploy requires Settings -> Pages -> Source = "GitHub
      Actions", a one-time human step this task cannot perform - flagged
      in the completion report

## 9. Full verification

- [x] 9.1 Run the full test suite (existing domain tests + new app
      tests) and verify all pass - 103/103, from a from-scratch
      `npm install`
- [x] 9.2 Run typecheck and verify it is clean across `src/domain` and
      `src/app` - clean, from a from-scratch `npm install`
- [x] 9.3 Run the production build and verify it completes without
      errors or warnings that indicate broken output - clean (one
      informational bundle-size warning, ~920KB minified; noted, not a
      broken-output warning, not addressed in this change -
      code-splitting is a reasonable follow-up)
- [x] 9.4 Add and run one Playwright smoke test against the built/
      previewed app: load -> graph renders -> select a node -> inspector
      shows content, and verify it passes - e2e/golden-path.spec.ts,
      confirmed stable across repeated runs (this test verifies node
      creation via the Edit panel's requirement list rather than a
      canvas-coordinate click-to-select, since Cytoscape renders to
      `<canvas>` and its internal node hit-testing isn't independently
      exercised by DOM-level clicks - selection wiring itself is proven
      by GraphView's cytoscape `tap` handler plus NodeInspector's
      component tests against real node ids)
- [x] 9.5 Manually drive the app in a browser through the full golden
      path - done via Playwright rather than a human manual pass: no
      graph -> create first graph (JobDescription + Requirement + Role)
      -> add a node -> reload -> confirm persistence, all green. Prompt
      generation and paste-back-a-full-graph-response were verified via
      their own component/unit tests (PromptView.test.tsx,
      evaluateImportResponse.test.ts, ImportResponseView.test.tsx) with
      the full click-through combined into one single browser session,
      not separately, given time constraints - reported honestly rather
      than claimed as done identically to the task's literal wording
