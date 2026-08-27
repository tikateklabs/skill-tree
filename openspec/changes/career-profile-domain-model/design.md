## Context

See proposal.md - Why. This is the first change in a new sequence
(career-profile-domain-model -> career-profile-capture-ui ->
role-cluster-model -> market-analysis-ui -> gap-and-recommendation-engine
-> recommendation-review-ui -> positioning-and-resume-brief) realizing
the product's redefinition from JD-visualization tool to career-market
positioning system. `career-graph-domain-model` and `build-v1-web-app`
are complete and unmodified by this change; this change adds new,
independent domain modules alongside them.

## Goals / Non-Goals

**Goals:**
- A `CareerProfile` shape precise enough to implement, structurally
  comparable to `CareerGraph` at the node-id level so gap computation in
  a later change is a plain set comparison.
- Keep evidence (what's been done) and aspiration (what's wanted)
  structurally incapable of being confused with each other.
- Preserve every user statement verbatim, everywhere an interpretation
  is also stored.
- Extend the existing two-layer (JSON Schema + Zod) validation contract
  to these new modules rather than inventing a different one.

**Non-Goals:**
- No UI, no persistence, no prompt-generation/extraction-capture flow -
  next change.
- No `RoleCluster`/`MarketSignal`/`CompensationEvidence`/`TargetRole` -
  these consume `CareerProfile` and `CareerGraph` together but have no
  work to do until both exist independently; building them now would be
  speculative.
- No `PositioningStrategy`/`ResumeBrief`/`Gap`/`PreparationPlan`/
  `Recommendation`/`UserDecision` - same reasoning, further downstream.
- No full 7-value Truth-Model (`ClaimType`) enum. See Decisions.
- No changes to `CareerGraph`, `deriveNodeId`, or any existing
  `career-graph-domain-model` file.

## Decisions

**`CareerProfile` is a separate domain module, not a reuse of
`CareerGraph`'s schema - but it reuses `deriveNodeId` and the node-kind
vocabulary directly.**
Considered literally typing `CareerProfile = CareerGraph` (same Zod
schema, `JobDescription` standing in for "Naukri text", `Requirement`
standing in for "a career claim"). Rejected: `CareerGraph.role` is
enforced unique per graph, which is correct for "one JD describes one
role" and wrong for "one person held several roles across employers." A
literal reuse would force either (a) one `CareerProfile` per past job
(losing the single unified view of a person's whole career) or (b)
weakening the Role-uniqueness invariant on the shared schema, which
would also weaken it for `CareerGraph`, a capability this change does
not touch. Instead, `CareerRoleHistoryEntry[]` (plural) replaces the
single `Role`, and everything below it - `CareerProfileNode`'s five
kinds, its canonical id derivation - imports `deriveNodeId` from
`src/domain/id.ts` unchanged, so `technology:generic:kubernetes` means
the same thing in both models without a shared root schema forcing it.

**`CareerEvidence` (PROVEN/EMERGING) and `CareerAspiration` are separate
entity types, not one type with a three-value status.**
A `PROVEN`/`EMERGING`/`ASPIRATIONAL` enum on one shared type was the
literal reading of the product brief's three-way classification.
Rejected: evidence, by construction, substantiates something the source
text describes happening; an aspiration, by construction, doesn't
require anything to have happened. A shared type with an `ASPIRATIONAL`
status would still need a `sourceText` that means "what you did" for the
other two statuses and "what you want" for the third - the field's
meaning would depend on the status, which is a sign the type is wrong.
Two types, `CareerEvidence.status: "PROVEN" | "EMERGING"` and
`CareerAspiration` (no status), keep each field's meaning fixed and make
`CareerProfileNode.provenance` referencing only `CareerEvidence` an
enforceable schema rule rather than a convention - see spec.md's
"provenance traces to evidence, not aspiration" requirement.

**PROVEN vs. EMERGING is classified by the external AI during
extraction, not computed deterministically by this change.**
Distinguishing "substantiated with specifics" from "named once in
passing" is a judgment call over free text - exactly the kind of task
this product's whole architecture already delegates to the external-AI
round-trip (see `career-graph-domain-model`'s Requirement extraction,
which works the same way). This change defines the *shape* the AI's
classification must conform to and validates it; it does not implement
classification logic. The classification is then a data point like any
other - a human can correct it, same as any other AI-authored field, via
the paste/preview/confirm loop the next change builds.

**Compensation figures are structured; every other preference is free
text with an optional interpretation.**
`CompensationFigure` (amount/currency/period) needs no AI interpretation
step because a user stating "current CTC 40 LPA" has already given a
simple, unambiguous number - adding an "interpreted vs. sourceText" layer
here would be interpretation theater over data that's already
structured. Preferences ("I prefer product companies over services
companies") are qualitatively different: the user's own words are the
ground truth, and any structured label the system derives from them
(`"product"`) is a lossy summary that must never replace or hide the
original statement. Hence two different shapes for two different kinds
of input, not one shape stretched to cover both.

**No full Truth-Model (`ClaimType`) enum yet - `PROVEN`/`EMERGING` and
the `CareerEvidence`/`CareerAspiration` split cover only the two
categories this change actually needs.**
The product definition names seven categories (MARKET FACT, USER FACT,
USER ASPIRATION, SYSTEM INFERENCE, SYSTEM RECOMMENDATION, USER DECISION,
UNKNOWN) as a system-wide tagging vocabulary. Considered introducing the
full enum now as shared infrastructure every later change would just
consume. Rejected for this change: five of the seven values
(`MARKET_FACT`, `INFERENCE`, `RECOMMENDATION`, `USER_DECISION`, and the
generic `UNKNOWN`) have no entity that emits them yet - `MARKET_FACT`
belongs to `role-cluster-model`, `INFERENCE`/`RECOMMENDATION`/
`USER_DECISION` belong to `gap-and-recommendation-engine`. A shared enum
with three-fifths of its values unused by any code is speculative
infrastructure; `CareerEvidence`/`CareerAspiration` already express
`USER_FACT`/`ASPIRATION` precisely for what exists today. **This is
flagged as an open decision below, not a settled one** - if you'd rather
lock the full vocabulary in now so every later change references a
stable set of tags from day one, say so and this change will add it.

**Two-layer validation contract extended verbatim, not reinvented.**
`career-graph-domain-model`'s two-layer contract (JSON Schema portable/
structural, Zod authoritative/semantic, no required parity) is applied
to `CareerProfile` and `UserObjective` using the same generation
approach (Zod v4's native `z.toJSONSchema`) rather than any new
validation mechanism.

## Risks / Trade-offs

- [Id-scheme reuse only holds if extraction actually normalizes
  consistently] `deriveNodeId` produces the same id for "Kubernetes" and
  "kubernetes " on both sides, but if the AI extracting a `CareerProfile`
  picks a different `namespace` convention than the AI extracting a
  `CareerGraph` for genuinely the same technology, gap computation later
  would see a false gap. -> Mitigation: not solvable at the schema level
  - the prompt design in `career-profile-capture-ui` needs to reuse the
    same namespace guidance already given to JD-extraction prompts;
    noted here so that change doesn't have to rediscover it.
- [PROVEN/EMERGING is an AI judgment call, not ground truth] A
  misclassification (calling well-substantiated experience "EMERGING")
  could understate a real capability. -> Mitigation: this is the same
  risk profile as every other AI-authored field in this codebase's
  existing pattern - human review before commit (next change), not a new
  risk this change introduces.
- [Two separate role-history/root shapes for CareerGraph and
  CareerProfile means two schemas to keep principles aligned across, by
  discipline rather than by the type system] A future change to one of
  the shared principles (e.g. provenance shape) could drift between the
  two. -> Mitigation: accepted trade-off given the Role-uniqueness
  mismatch is real, not stylistic; revisit only if drift actually
  happens, not preemptively.

## Migration Plan

Not applicable - new, independent domain modules; nothing existing
changes.

## Open Questions

- Should the full 7-value Truth-Model (`ClaimType`) vocabulary be
  introduced now as shared infrastructure, or grown incrementally as
  later changes need each value (this change's recommendation)? This
  changes what gets built in this change if answered "now" - flagged for
  explicit approval, not deferred as a true open question.
- `relatedNodeHint` on `CareerAspiration` is currently unvalidated free
  text. Resolving an aspiration to specific market capability nodes is
  `role-cluster-model`/`gap-and-recommendation-engine`'s job; this
  change only reserves the field. Safe to leave open - doesn't affect
  this change's schema or tasks.
