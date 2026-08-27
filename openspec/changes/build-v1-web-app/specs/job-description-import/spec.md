## Purpose

Captures a job description's raw text as a `JobDescription` and lets a
user manually record `Requirement` entries against it, preserving the
verbatim JD wording that later becomes node provenance - no automated
parsing is performed in-app.

## ADDED Requirements

### Requirement: Capturing a JobDescription
The system SHALL let a user create a `JobDescription` by entering a
title, optional company, and pasting the JD's raw text, stored verbatim
(no trimming or reformatting) and added to the active CareerGraph's
`sourceJobDescriptions`.

#### Scenario: Pasted JD text is stored verbatim
- **WHEN** a user pastes JD text containing irregular whitespace and
  bullet characters
- **THEN** the stored `JobDescription.rawText` matches exactly what was
  pasted

### Requirement: Manually recording a Requirement against a JobDescription
The system SHALL let a user, working from an imported JobDescription,
add a `Requirement` with a verbatim `sourceText` (the user selects or
types the exact JD wording) and, when applicable, its `experience`
details (minimum/maximum years, logic, subjects), added to the active
CareerGraph's `requirements`.

#### Scenario: Recording a non-experience requirement
- **WHEN** a user records a Requirement with only `sourceText` and no
  years-of-experience wording
- **THEN** the Requirement is stored with `experience` absent, and is
  immediately available to select as provenance when adding a node

#### Scenario: Recording an experience requirement
- **WHEN** a user records a Requirement with `sourceText` "4+ years of
  experience with Python" and enters minimum years 4, logic SINGLE,
  subject "Python"
- **THEN** the stored Requirement's `experience` matches exactly what
  was entered, validated against the same constraints the domain schema
  enforces
