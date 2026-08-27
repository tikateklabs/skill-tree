## Why

Skill Tree's product definition has changed: it is not a JD-visualization
tool, it is a career-market positioning and planning system. The
existing `CareerGraph` domain (Role -> Capability -> Skill -> {Concept,
Technology, Tool}, with mandatory provenance to verbatim JD text) is the
market/JD half of that system and needs no changes. The half that does
not exist yet is the user's own side: what they have actually done, what
they aspire to, and what they are optimizing for (current/target
compensation, location/company/role/industry preferences). Nothing in
the rest of the pipeline this pivot requires - market analysis, gap
computation, recommendation, positioning, resume brief - can be built
without this foundation existing first, so it is the first change in the
new sequence.

## What Changes

- Introduce `CareerProfile`: the user's own career, structured the same
  way a market requirement is (mandatory provenance to verbatim source
  text, deterministic canonical ids for skills/technologies/etc, reusing
  `deriveNodeId` and the five non-Role node kinds directly from
  `src/domain/id.ts` so a node like `technology:generic:kubernetes` means
  the same thing in a `CareerGraph` and in a `CareerProfile`) - but with
  its own root shape, not a reuse of `CareerGraph`'s schema, because a
  career spans multiple past roles across employers while `CareerGraph`
  enforces exactly one `Role` per graph (correct for "one JD, one role",
  wrong for "one person's whole career").
- Introduce `CareerEvidence`: an atomic, verbatim-sourced claim about
  something the user has actually done, classified `PROVEN` or
  `EMERGING` (mentioned but not strongly substantiated) - the
  what-you've-actually-done half of the product's honest-vs-aspirational
  principle.
- Introduce `CareerAspiration`: a separate entity (not a third status on
  `CareerEvidence`) for what the user wants to be known for, since an
  aspiration by definition has no evidence backing it - forcing it into
  the evidence shape would let "PROVEN aspiration" exist, which is
  incoherent.
- Introduce `UserObjective`: current/target compensation as plain
  structured figures (amount/currency/period - these are already simple
  data, not free text needing interpretation), and
  location/company/role-direction/industry preferences as
  `InterpretedPreference` (`{ sourceText, interpreted: T | null }` -
  `interpreted` is `null`, never fabricated, whenever a structured value
  can't be confidently derived from the free text).
- Publish all of the above as Zod schemas (source of truth) with a
  generated JSON Schema (Draft 2020-12), following the same two-layer
  validation contract already established for `CareerGraph`
  (`career-graph-domain-model`'s "Two-layer validation contract for
  accepting a CareerGraph" requirement - JSON Schema as the portable
  structural layer, Zod as the authoritative semantic layer, no required
  rejection parity between them).
- Provide fixture data and tests mirroring `define-careergraph-domain-model`'s
  rigor: a realistic sample `CareerProfile` (multiple role-history
  entries, PROVEN and EMERGING evidence, at least one aspiration, a
  populated `UserObjective` with at least one preference the AI could not
  confidently interpret) used as the schema-validation baseline.

No UI, no prompt-generation/extraction-capture flow, no persistence, and
no market/recommendation/positioning/resume-brief concepts are
introduced by this change - those are later changes in the sequence (see
design.md). `CareerGraph` (`career-graph-domain-model`) is not modified.

## Capabilities

### New Capabilities
- `career-profile-model`: `CareerProfile`, `CareerEvidence`,
  `CareerAspiration`, and the node/provenance/identity rules described
  above.
- `user-objective-model`: `UserObjective` and `InterpretedPreference`.

### Modified Capabilities
(none - `career-graph-domain-model` is reused via its existing exported
`deriveNodeId`/node-kind vocabulary, not changed)

## Impact

- New code: `src/domain/careerProfile/` (or equivalent, see design.md)
  containing Zod schemas, derived TypeScript types, a JSON Schema
  generation addition, and fixture data. No changes to any existing file
  under `src/domain/` for the `CareerGraph` capability; `src/domain/id.ts`
  is imported from, not modified.
- Establishes the contract the next change (`career-profile-capture-ui`)
  builds a paste-and-extract UI against, following the same
  prompt-generate / paste-response / two-layer-validate / preview /
  confirm pattern already proven for `CareerGraph` in `build-v1-web-app`.
- Downstream, `role-cluster-model`'s gap computation depends on
  `CareerProfile.nodes` using the same canonical id scheme as
  `CareerGraph.nodes` - this change is what makes that a plain
  set-difference rather than a fuzzy-matching problem later.
