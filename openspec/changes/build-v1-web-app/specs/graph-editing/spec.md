## Purpose

Lets a user build and edit a CareerGraph by hand, with every mutation
validated against the domain schema before it is committed, so the UI
can never produce an invalid graph.

## ADDED Requirements

### Requirement: Every mutation is validated before commit
The system SHALL validate the resulting CareerGraph against the domain
(Zod) schema before committing any editing action (add/edit/delete
node, add/edit requirement, change a link). A candidate that fails
validation SHALL NOT be committed; the prior state SHALL remain
unchanged and the validation error SHALL be shown to the user.

#### Scenario: An edit that would violate the domain schema is rejected
- **WHEN** a user action would produce a CareerGraph the domain schema
  rejects (e.g. it would create a `parentIds` cycle)
- **THEN** the action is not applied, the graph on screen is unchanged,
  and the user sees why the edit was rejected

### Requirement: Adding a node
The system SHALL let a user add a node by choosing its kind, namespace
(defaulting to `"generic"`), name, at least one parent (of a kind valid
for that node's kind), and at least one provenance entry (referencing an
existing `Requirement`). The node's `id` SHALL be derived automatically,
not entered by hand.

#### Scenario: Adding a node with a valid parent and provenance succeeds
- **WHEN** a user adds a Technology node under an existing Skill,
  selecting an existing Requirement as its provenance
- **THEN** the node is added with a derived id and appears in the
  rendered graph as a child of that Skill

#### Scenario: Adding a node with no provenance is prevented
- **WHEN** a user attempts to add a node without selecting any
  Requirement as provenance
- **THEN** the UI does not allow submitting the action (provenance is
  mandatory, per the domain model)

### Requirement: Renaming a node cascades its id to all references
The system SHALL let a user edit a node's `name` and/or `namespace`,
recomputing its canonical id and rewriting every other node's
`parentIds`/`relatedNodeIds` entries that pointed at the old id to the
new id, as a single atomic action.

#### Scenario: Renaming a node updates every reference to it
- **WHEN** a user renames a Technology node that is a parent of two
  other nodes
- **THEN** the renamed node's id changes and both other nodes'
  `parentIds` now contain the new id, with no dangling reference to the
  old one

### Requirement: Deleting a node shows and confirms its full cascade
The system SHALL compute, before deleting a node, the full set of nodes
that would also be removed (any node left with zero parents once the
target and its removal are accounted for, applied transitively), and
SHALL require the user to confirm that full set before committing the
deletion.

#### Scenario: Deleting a node's only parent cascades
- **WHEN** a user deletes a Capability that is the sole parent of a
  Skill, which is in turn the sole parent of a Technology
- **THEN** the confirmation shows the Capability, the Skill, and the
  Technology as nodes that will be removed, and only proceeds on
  confirmation

#### Scenario: Deleting a node with another surviving parent does not cascade to it
- **WHEN** a user deletes a Capability that is one of two parents of a
  Skill
- **THEN** the confirmation shows only the Capability being removed; the
  Skill survives with its remaining parent

### Requirement: Adding and editing a Requirement's experience details
The system SHALL let a user add or edit a `Requirement`'s `experience`
object (minimum/maximum years, logic, subjects), enforcing the same
`subjects.length` constraints per `logic` the domain schema enforces
(exactly 1 for `SINGLE`, at least 2 for `AND`/`OR`).

#### Scenario: Editing subjects to violate the logic constraint is rejected
- **WHEN** a user sets a Requirement's `logic` to `SINGLE` while its
  `subjects` list has two entries
- **THEN** the edit is rejected until the user brings `subjects` back to
  exactly one entry (or changes `logic`)
