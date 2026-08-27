## Purpose

Renders a CareerGraph as an interactive, navigable graph and lets a user
inspect any node's full traceability - why it exists, which JD wording
produced it, and its related skills, technologies, and experience
requirements - without leaving the visualization.

## ADDED Requirements

### Requirement: CareerGraph is rendered as a DAG
The system SHALL render the active CareerGraph's `role` and `nodes` as a
graph, with one visual node per domain node and one edge per `parentIds`
entry (hierarchical, "contains" edges), laid out top-down from the
`Role`. A domain node with more than one parent SHALL appear once, with
an edge from each of its parents - never duplicated.

#### Scenario: Multi-parent node renders once
- **WHEN** the active graph contains a Skill with two Capability parents
- **THEN** the rendered graph shows exactly one visual node for that
  Skill, with an incoming edge from each parent Capability

#### Scenario: Node kinds are visually distinguishable
- **WHEN** the active graph contains nodes of different kinds (Role,
  Capability, Skill, Concept, Technology, Tool)
- **THEN** each kind is rendered with a visually distinct style (e.g.
  color or shape) so a user can tell node kinds apart at a glance

### Requirement: Related-node links are rendered distinctly from hierarchy
The system SHALL render each node's `relatedNodeIds` as edges visually
distinct from `parentIds` edges (e.g. a different line style), since the
two represent different relationship kinds (hierarchical containment vs.
non-hierarchical association).

#### Scenario: A related-node link is visually distinct from a parent link
- **WHEN** a node has both a `parentIds` entry and a `relatedNodeIds`
  entry rendered on screen
- **THEN** the two edges are visually distinguishable from each other

### Requirement: Subtree collapse and expand
The system SHALL let a user collapse a node so its descendants (reached
via `parentIds`) are hidden, and expand it again to reveal them, without
altering the underlying CareerGraph data.

#### Scenario: Collapsing a node hides its descendants
- **WHEN** a user collapses a Capability node with child Skills
- **THEN** those Skill nodes (and their own descendants) are hidden from
  the rendered graph until the Capability is expanded again

#### Scenario: Collapse state is purely visual
- **WHEN** a user collapses and later expands a node
- **THEN** the underlying CareerGraph (nodes, edges, requirements) is
  unchanged - only the rendered view was affected

### Requirement: Node inspector shows full traceability on selection
Selecting a rendered node SHALL open an inspector showing: the node's
name, kind, and namespace; its `provenance` resolved to each
`Requirement.sourceText` and the originating `JobDescription`'s
title/company; its `relatedNodeIds` resolved to their names; its
children (other nodes whose `parentIds` includes it); and any
`Requirement` whose `experience` is attached to it via provenance
(minimum/maximum years, logic, subjects).

#### Scenario: Selecting a node shows its originating JD wording
- **WHEN** a user selects a node with one provenance entry
- **THEN** the inspector shows that entry's `Requirement.sourceText`
  verbatim and the `JobDescription.title`/`company` it came from

#### Scenario: Selecting a node with an experience requirement shows it
- **WHEN** a user selects a node whose provenance references a
  `Requirement` with an `experience` object
- **THEN** the inspector shows the minimum (and maximum, if present)
  years, the logic, and the subjects list

#### Scenario: Selecting a node with multiple provenance entries shows all of them
- **WHEN** a user selects a node with more than one `provenance` entry
- **THEN** the inspector lists every entry, each resolved to its own
  `Requirement.sourceText` and `JobDescription`
