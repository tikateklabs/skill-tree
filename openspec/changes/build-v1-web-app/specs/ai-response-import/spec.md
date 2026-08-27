## Purpose

Lets a user paste an external AI's response - a full CareerGraph JSON or
an RFC 6902 JSON Patch - back into the app, validated through the
existing two-layer contract before anything is shown as a preview or
committed to state. JSON Schema validation alone is never sufficient to
accept a response, per the domain model's validation contract.

## ADDED Requirements

### Requirement: Pasted response is validated before any preview is shown
The system SHALL parse a pasted response as JSON and determine whether
it is a full CareerGraph object or a patch envelope object
(`{ baseVersion: number, operations: JsonPatchOperation[] }` - the shape
`applyCareerGraphPatch` expects, so the patch's base version travels
with it rather than being inferred), then validate it via
`validateCareerGraphImport` (full graph) or `applyCareerGraphPatch`
(patch envelope) before showing any diff preview or allowing commit. A
response that is not valid JSON, that matches neither shape, or that
fails either validation stage, SHALL be rejected with the failing stage
and reason shown - no partial preview or partial commit.

#### Scenario: Malformed JSON is rejected immediately
- **WHEN** a user pastes text that is not valid JSON
- **THEN** the system reports a parse error and shows no diff preview

#### Scenario: A structurally invalid full-graph response is rejected at the JSON Schema stage
- **WHEN** a pasted full CareerGraph is missing a required field
- **THEN** the system reports rejection at the JSON Schema stage and
  does not proceed to a diff preview

#### Scenario: A structurally valid but semantically invalid response is rejected at the domain stage
- **WHEN** a pasted full CareerGraph passes JSON Schema but contains a
  `parentIds` cycle
- **THEN** the system reports rejection at the domain stage, even though
  JSON Schema accepted it

### Requirement: Accepted response shows a diff before commit
The system SHALL show, for an accepted response, what would change
before committing it: for a JSON Patch, the list of operations to be
applied; for a full CareerGraph, a summary of nodes added/removed and
requirements added/removed relative to the current graph. Nothing is
committed to app state until the user confirms.

#### Scenario: Patch preview shows the operations that will be applied
- **WHEN** a valid JSON Patch is pasted
- **THEN** the preview lists each operation (op, path, and value where
  applicable) before the user confirms

#### Scenario: Full-graph preview summarizes additions and removals
- **WHEN** a valid full CareerGraph is pasted that adds two nodes and
  removes one requirement relative to the current graph
- **THEN** the preview states that two nodes were added and one
  requirement was removed, before the user confirms

### Requirement: Stale-version patches are flagged before applying
The system SHALL detect when a pasted JSON Patch's declared base
`version` does not match the active CareerGraph's current `version`, and
SHALL warn the user before allowing them to proceed, rather than
silently applying it over intervening changes.

#### Scenario: A patch generated against an older version is flagged
- **WHEN** a user pastes a patch whose base version is older than the
  current graph's version
- **THEN** the system warns that the patch may be stale before the user
  can choose to proceed or cancel
