## Purpose

Builds a single copy-pasteable prompt a user can hand to an external AI
(ChatGPT/Claude/Gemini) so the AI can return a CareerGraph JSON or a
JSON Patch the app can validate and import - the mechanism by which AI
assistance works in V1 without any in-app LLM call.

## ADDED Requirements

### Requirement: Generating a prompt for an external AI
The system SHALL assemble, on request, a single text prompt containing:
fixed instructions describing the expected output - either a full
CareerGraph JSON conforming to the generated JSON Schema, or a patch
envelope object `{ "baseVersion": <the current graph's version>,
"operations": [...RFC 6902 operations] }` - the current generated JSON
Schema, the active CareerGraph as JSON (so its `version` is visible to
the AI for the patch case), and a selected JobDescription's raw text.
The assembled prompt SHALL be copyable to the clipboard in one action.

#### Scenario: Generated prompt includes the current graph and target JD
- **WHEN** a user generates a prompt with a JobDescription selected
- **THEN** the prompt text contains that JobDescription's `rawText` and
  the current CareerGraph serialized as JSON

#### Scenario: Copy action places the full prompt on the clipboard
- **WHEN** a user selects "copy to clipboard" after generating a prompt
- **THEN** the entire assembled prompt text is placed on the system
  clipboard
