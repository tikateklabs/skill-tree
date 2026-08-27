## Purpose

Defines `UserObjective`: the user's compensation target and career
preferences - the constraint the rest of the system evaluates
recommendations against, not an assumption of what is achievable.
Preferences are always expressible as free text and the system must
preserve exactly what the user said, alongside (never instead of) any
structured interpretation of it.

## ADDED Requirements

### Requirement: UserObjective structure
The system SHALL define a `UserObjective` type with: `currentCompensation`
(`CompensationFigure | null`), `targetCompensation`
(`CompensationFigure | null`), `locationPreference`
(`InterpretedPreference | null`), `companyPreference`
(`InterpretedPreference | null`), `roleDirectionPreference`
(`InterpretedPreference | null`), `industryPreferences`
(`{ prefer: InterpretedPreference[]; avoid: InterpretedPreference[] }`),
and `otherPreferences` (`InterpretedPreference[]`). Every field is
optional/nullable - the user is not required to state a preference they
don't have.

#### Scenario: A minimal UserObjective with only compensation figures
- **WHEN** a UserObjective has `currentCompensation` and
  `targetCompensation` set and every preference field `null` or empty
- **THEN** it validates successfully

### Requirement: CompensationFigure is a plain structured value
The system SHALL define `CompensationFigure` as `{ amount: number;
currency: string; period: "annual" | "monthly" }` - a plain structured
figure, not free text requiring interpretation, since compensation
figures are already simple, unambiguous data when the user states them
directly (e.g. "current CTC 40 LPA", "target 80+ LPA").

#### Scenario: Current and target compensation are stored as given
- **WHEN** the user states current compensation as 4,000,000 INR/year
  and target compensation as 8,000,000 INR/year
- **THEN** both are stored as `CompensationFigure` values with those
  exact amounts, currency, and period - no interpretation step involved

#### Scenario: Target compensation is a constraint, not an assumption
- **WHEN** application code consumes a `UserObjective`
- **THEN** nothing in this schema marks `targetCompensation` as
  achievable or validated against market evidence - that evaluation is
  explicitly the job of a later change (market analysis/recommendation),
  never assumed true by this model itself

### Requirement: InterpretedPreference preserves the original statement
The system SHALL define `InterpretedPreference` as `{ sourceText: string;
interpreted: string | null }`. `sourceText` SHALL always be the user's
verbatim free-text statement. `interpreted` SHALL be a structured
distillation of it when one can be confidently derived, and SHALL be
`null` - never a fabricated or guessed value - when it cannot.

#### Scenario: A preference is interpreted from free text
- **WHEN** the user states "I prefer working for a product company
  compared to services companies that primarily work for clients or
  contract engagements"
- **THEN** the stored `companyPreference` has that exact `sourceText`,
  and MAY have `interpreted` set to a short structured label (e.g.
  `"product"`) derived from it

#### Scenario: An uninterpretable preference keeps sourceText and a null interpretation
- **WHEN** free text is too ambiguous to confidently reduce to a
  structured value
- **THEN** `interpreted` is stored as `null` while `sourceText` is still
  preserved in full - the system never invents a structured value it
  isn't confident in

### Requirement: Industry preferences distinguish prefer from avoid
The system SHALL keep `industryPreferences.prefer` and
`industryPreferences.avoid` as separate lists of `InterpretedPreference`,
each independently defaulting to empty rather than requiring the user to
state both.

#### Scenario: Only an avoid-list is stated
- **WHEN** the user states only "I want to avoid pure services/staffing
  companies" and nothing about preferred industries
- **THEN** `industryPreferences.avoid` contains that entry and
  `industryPreferences.prefer` is an empty array, not null or an error

### Requirement: Runtime and static validation, two-layer contract
The system SHALL implement `UserObjective` as a Zod schema serving as
the single source of truth, with a generated JSON Schema (Draft 2020-12)
derived from it, under the same two-layer contract as
`career-graph-domain-model` and `career-profile-model`: JSON Schema
validates shape/types/required fields/enums; Zod is authoritative for
any cross-field invariant (none are currently required beyond standard
shape validation, since `UserObjective` has no cross-entity references -
this requirement exists so the contract is applied uniformly across
every domain module, not only where a violation is currently
demonstrable).

#### Scenario: A structurally invalid UserObjective is rejected
- **WHEN** a candidate has `currentCompensation.period` set to a value
  other than `"annual"` or `"monthly"`
- **THEN** both the JSON Schema and Zod validation reject it
