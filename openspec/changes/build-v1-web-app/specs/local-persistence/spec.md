## Purpose

Keeps the active CareerGraph on the user's device across page reloads,
and lets them move it in and out of the app as a file - the only
persistence V1 has, with no backend and no account.

## ADDED Requirements

### Requirement: The active CareerGraph survives a page reload
The system SHALL persist the active CareerGraph to the browser's
IndexedDB after every accepted mutation, and SHALL load it from
IndexedDB on app start. If no graph has been saved yet, the system
SHALL start from an empty starter graph (a bare `Role` with no
children).

#### Scenario: A saved graph is restored on reload
- **WHEN** a user makes an edit and then reloads the page
- **THEN** the app shows the graph including that edit, without the user
  re-importing anything

#### Scenario: First run with nothing saved starts from an empty graph
- **WHEN** the app is opened with no prior IndexedDB record
- **THEN** the app shows a valid, empty starter CareerGraph rather than
  an error

### Requirement: Exporting the active graph to a file
The system SHALL let a user download the active CareerGraph as a
`.json` file containing exactly its current serialized state.

#### Scenario: Exported file matches the active graph
- **WHEN** a user exports the active graph
- **THEN** the downloaded `.json` file, when parsed, is deep-equal to
  the graph shown in the app at that moment

### Requirement: Importing a graph from a file uses the same validated path as AI import
The system SHALL let a user load a CareerGraph from an uploaded `.json`
file through the same `validateCareerGraphImport` pipeline used for
pasted AI responses (JSON Schema, then domain validation), replacing the
active graph only on full acceptance.

#### Scenario: An invalid uploaded file is rejected without replacing the active graph
- **WHEN** a user uploads a `.json` file that fails domain validation
- **THEN** the active graph in the app is unchanged and the rejection
  reason is shown
