import { generateCareerGraphJsonSchema, type CareerGraph, type JobDescription } from "../../domain/index.js";

/**
 * Assembles the single copy-pasteable prompt for an external AI: fixed
 * instructions, the generated JSON Schema, the current CareerGraph, and
 * the target JobDescription's raw text - see spec.md
 * "Generating a prompt for an external AI". The instructed response
 * shape is either a full CareerGraph, or a patch envelope
 * `{ baseVersion, operations }` (ai-response-import's expected shape),
 * so a patch's stale-version check has something to compare against.
 */
export function buildPrompt(graph: CareerGraph, jobDescription: JobDescription): string {
  const schema = generateCareerGraphJsonSchema();

  return `You are helping maintain a CareerGraph - a structured JSON representation of a career role's capabilities, skills, concepts, technologies, and tools, each traceable to the exact job-description wording that produced it.

## Your task

Given the CURRENT CAREERGRAPH and the TARGET JOB DESCRIPTION below, respond with ONLY one of the following JSON values (no other prose, no markdown fences):

1. A full CareerGraph JSON object conforming exactly to the JSON SCHEMA below - use this for substantial changes.
2. A patch envelope object of this exact shape, for small changes:
   { "baseVersion": <the CURRENT CAREERGRAPH's "version" field, copied unchanged>, "operations": [ ...RFC 6902 JSON Patch operations ] }

## Rules

- Every node's "provenance" entry must reference a "requirementId" that exists in "requirements", and a "jobDescriptionId" that matches that Requirement's own "jobDescriptionId".
- Every years-of-experience statement in the job description must become a Requirement with an "experience" object: "minimumYears", optional "maximumYears", "unit": "years", "logic" ("SINGLE" | "AND" | "OR"), and "subjects" - never mixed with any notion of the reader's own personal experience.
- Preserve the exact job-description wording in each Requirement's "sourceText" - do not paraphrase.
- Do not invent a non-"generic" "namespace" for a node unless there is a genuine name collision with an existing node of the same kind representing a different real-world thing.
- A node's "parentIds" may contain more than one id (a node can have multiple parents); do not duplicate a node just because it applies under more than one parent.

## JSON Schema

\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

## Current CareerGraph

\`\`\`json
${JSON.stringify(graph, null, 2)}
\`\`\`

## Target job description: ${jobDescription.title}${jobDescription.company ? ` at ${jobDescription.company}` : ""}

\`\`\`
${jobDescription.rawText}
\`\`\`
`;
}
