import { deriveNodeId } from "../domain/id.js";
import type { CareerGraph } from "../domain/graph.js";

/**
 * A hand-authored, schema-valid CareerGraph derived from a realistic
 * sample JD (a "Principal Engineer, AIOps & Site Reliability" posting).
 * Exercises every scenario spec.md's "Reference fixture data" requirement
 * calls for: a multi-level node chain, a two-parent node, two
 * same-kind/same-name nodes distinguished only by namespace, a
 * SINGLE-logic requirement, an OR-logic requirement, and a non-experience
 * requirement - see openspec/changes/define-careergraph-domain-model/
 * specs/career-graph-domain-model/spec.md.
 */

const JOB_ID = "job_wellsfargo_principal";

export const JD_RAW_TEXT = `Principal Engineer - AIOps & Site Reliability

Wells Fargo is looking for a Principal Engineer to lead our AIOps and Site
Reliability practice.

Requirements:
- Must have led an on-call rotation for a production SRE team
- Experience with observability tooling such as Prometheus, Splunk, and OpenTelemetry
- Experience operating both MongoDB Atlas and our internal Atlas deployment tool
- 4+ years of experience with Python
- 5+ years of experience in AIOps, SRE, production engineering, or large-scale distributed systems operations
`;

export const PYTHON_REQUIREMENT_TEXT = "4+ years of experience with Python";
export const AIOPS_OR_REQUIREMENT_TEXT =
  "5+ years of experience in AIOps, SRE, production engineering, or large-scale distributed systems operations";

const roleId = "role_principal_engineer";
const capabilityAIOpsId = deriveNodeId("capability", "generic", "AIOps");
const capabilitySREId = deriveNodeId("capability", "generic", "SRE");
const skillObservabilityId = deriveNodeId("skill", "generic", "Observability");
const skillProgrammingLanguagesId = deriveNodeId(
  "skill",
  "generic",
  "Programming Languages",
);
const skillDataStorageId = deriveNodeId("skill", "generic", "Data Storage");
const technologyPrometheusId = deriveNodeId("technology", "generic", "Prometheus");
const technologySplunkId = deriveNodeId("technology", "generic", "Splunk");
const technologyOpenTelemetryId = deriveNodeId(
  "technology",
  "generic",
  "OpenTelemetry",
);
const technologyPythonId = deriveNodeId("technology", "generic", "Python");
const technologyAtlasMongoId = deriveNodeId("technology", "mongodb", "Atlas");
const technologyAtlasInternalId = deriveNodeId("technology", "internal", "Atlas");

export function buildCareerGraphFixture(): CareerGraph {
  return {
    id: "graph_wellsfargo_principal",
    version: 1,
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    sourceJobDescriptions: [
      {
        id: JOB_ID,
        title: "Principal Engineer",
        company: "Wells Fargo",
        rawText: JD_RAW_TEXT,
        importedAt: "2026-08-25T00:00:00.000Z",
      },
    ],
    requirements: [
      {
        id: "req_title",
        jobDescriptionId: JOB_ID,
        sourceText: "Principal Engineer - AIOps & Site Reliability",
      },
      {
        id: "req_oncall",
        jobDescriptionId: JOB_ID,
        sourceText: "Must have led an on-call rotation for a production SRE team",
      },
      {
        id: "req_014",
        jobDescriptionId: JOB_ID,
        sourceText:
          "Experience with observability tooling such as Prometheus, Splunk, and OpenTelemetry",
      },
      {
        id: "req_atlas",
        jobDescriptionId: JOB_ID,
        sourceText:
          "Experience operating both MongoDB Atlas and our internal Atlas deployment tool",
      },
      {
        id: "req_python",
        jobDescriptionId: JOB_ID,
        sourceText: PYTHON_REQUIREMENT_TEXT,
        experience: {
          minimumYears: 4,
          unit: "years",
          logic: "SINGLE",
          subjects: ["Python"],
        },
      },
      {
        id: "req_aiops_or",
        jobDescriptionId: JOB_ID,
        sourceText: AIOPS_OR_REQUIREMENT_TEXT,
        experience: {
          minimumYears: 5,
          unit: "years",
          logic: "OR",
          subjects: [
            "AIOps",
            "SRE",
            "Production Engineering",
            "Large-scale distributed systems operations",
          ],
        },
      },
    ],
    role: {
      id: roleId,
      kind: "role",
      namespace: "generic",
      name: "Principal Engineer",
      parentIds: [],
      relatedNodeIds: [],
      provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_title" }],
    },
    nodes: [
      {
        id: capabilityAIOpsId,
        kind: "capability",
        namespace: "generic",
        name: "AIOps",
        parentIds: [roleId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_aiops_or" }],
      },
      {
        id: capabilitySREId,
        kind: "capability",
        namespace: "generic",
        name: "SRE",
        parentIds: [roleId],
        relatedNodeIds: [],
        provenance: [
          { jobDescriptionId: JOB_ID, requirementId: "req_aiops_or" },
          { jobDescriptionId: JOB_ID, requirementId: "req_oncall" },
        ],
      },
      {
        // Two-parent node: Observability is required under both AIOps and SRE.
        id: skillObservabilityId,
        kind: "skill",
        namespace: "generic",
        name: "Observability",
        parentIds: [capabilityAIOpsId, capabilitySREId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_014" }],
      },
      {
        id: skillProgrammingLanguagesId,
        kind: "skill",
        namespace: "generic",
        name: "Programming Languages",
        parentIds: [capabilityAIOpsId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_python" }],
      },
      {
        id: skillDataStorageId,
        kind: "skill",
        namespace: "generic",
        name: "Data Storage",
        parentIds: [capabilitySREId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_atlas" }],
      },
      {
        // Multi-level chain: Role -> Capability (AIOps) -> Skill (Observability) -> Technology (Prometheus).
        id: technologyPrometheusId,
        kind: "technology",
        namespace: "generic",
        name: "Prometheus",
        parentIds: [skillObservabilityId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_014" }],
      },
      {
        id: technologySplunkId,
        kind: "technology",
        namespace: "generic",
        name: "Splunk",
        parentIds: [skillObservabilityId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_014" }],
      },
      {
        id: technologyOpenTelemetryId,
        kind: "technology",
        namespace: "generic",
        name: "OpenTelemetry",
        parentIds: [skillObservabilityId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_014" }],
      },
      {
        id: technologyPythonId,
        kind: "technology",
        namespace: "generic",
        name: "Python",
        parentIds: [skillProgrammingLanguagesId],
        relatedNodeIds: [],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_python" }],
      },
      {
        // Same kind + same name ("Atlas"), disambiguated only by namespace.
        id: technologyAtlasMongoId,
        kind: "technology",
        namespace: "mongodb",
        name: "Atlas",
        parentIds: [skillDataStorageId],
        relatedNodeIds: [technologyAtlasInternalId],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_atlas" }],
      },
      {
        id: technologyAtlasInternalId,
        kind: "technology",
        namespace: "internal",
        name: "Atlas",
        parentIds: [skillDataStorageId],
        relatedNodeIds: [technologyAtlasMongoId],
        provenance: [{ jobDescriptionId: JOB_ID, requirementId: "req_atlas" }],
      },
    ],
  };
}

export const nodeIds = {
  roleId,
  capabilityAIOpsId,
  capabilitySREId,
  skillObservabilityId,
  skillProgrammingLanguagesId,
  skillDataStorageId,
  technologyPrometheusId,
  technologySplunkId,
  technologyOpenTelemetryId,
  technologyPythonId,
  technologyAtlasMongoId,
  technologyAtlasInternalId,
};
