import { deriveNodeId } from "../domain/id.js";
import type { CareerProfile } from "../domain/careerProfile.js";

/**
 * A hand-authored, schema-valid CareerProfile for a fictional engineer's
 * Naukri profile, exercising every scenario spec.md's "Reference
 * fixture data" requirement calls for: two role-history entries at
 * different companies, a node demonstrated across both, PROVEN and
 * EMERGING evidence, an aspiration, and (deliberately) a node sharing
 * its canonical id with a node in the CareerGraph reference fixture
 * (Python) - proving the shared id scheme from src/domain/id.ts lines
 * up in practice, not just in the abstract. See
 * openspec/changes/career-profile-domain-model/specs/career-profile-model/
 * spec.md.
 */

const NAUKRI_SOURCE_ID = "src_naukri_profile";
const ADDENDUM_SOURCE_ID = "src_user_addendum";

export const NAUKRI_RAW_TEXT = `Senior Engineer - Acme Corp (2019-2023)
- Led migration of 40+ microservices to Kubernetes, reducing deployment time by 60%
- Built distributed systems handling 10K+ requests/sec
- Skills: Kubernetes, Python, Docker, AWS

Lead Engineer - Globex Inc (2023-present)
- Own platform architecture for the observability team
- Python, Kubernetes, Terraform
`;

export const ADDENDUM_RAW_TEXT =
  "I've also worked on internal developer-experience tooling which isn't reflected in my Naukri profile.";

export const KUBERNETES_PROVEN_TEXT =
  "Led migration of 40+ microservices to Kubernetes, reducing deployment time by 60%";
export const PYTHON_EMERGING_TEXT = "Python";
export const ASPIRATION_TEXT = "I want to move toward AI leadership";

const roleAcmeId = "role_acme_senior_engineer";
const roleGlobexId = "role_globex_lead_engineer";

const evidenceKubernetesId = "ev_kubernetes_migration";
const evidencePythonId = "ev_python_skill";

const technologyKubernetesId = deriveNodeId("technology", "generic", "Kubernetes");
const technologyPythonId = deriveNodeId("technology", "generic", "Python");

export function buildCareerProfileFixture(): CareerProfile {
  return {
    id: "profile_fictional_engineer",
    version: 1,
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    sources: [
      {
        id: NAUKRI_SOURCE_ID,
        kind: "naukri_profile",
        rawText: NAUKRI_RAW_TEXT,
        importedAt: "2026-08-27T00:00:00.000Z",
      },
      {
        id: ADDENDUM_SOURCE_ID,
        kind: "user_addendum",
        rawText: ADDENDUM_RAW_TEXT,
        importedAt: "2026-08-27T00:00:00.000Z",
      },
    ],
    roleHistory: [
      {
        id: roleAcmeId,
        title: "Senior Engineer",
        company: "Acme Corp",
        startDate: "2019-01-01",
        endDate: "2023-01-01",
        sourceId: NAUKRI_SOURCE_ID,
      },
      {
        id: roleGlobexId,
        title: "Lead Engineer",
        company: "Globex Inc",
        startDate: "2023-01-01",
        sourceId: NAUKRI_SOURCE_ID,
      },
    ],
    evidence: [
      {
        id: evidenceKubernetesId,
        sourceId: NAUKRI_SOURCE_ID,
        sourceText: KUBERNETES_PROVEN_TEXT,
        status: "PROVEN",
      },
      {
        id: evidencePythonId,
        sourceId: NAUKRI_SOURCE_ID,
        sourceText: PYTHON_EMERGING_TEXT,
        status: "EMERGING",
      },
    ],
    aspirations: [
      {
        id: "asp_ai_leadership",
        sourceText: ASPIRATION_TEXT,
        relatedNodeHint: "capability:generic:ai-leadership",
      },
    ],
    nodes: [
      {
        // Demonstrated across both roles - one node, not duplicated.
        id: technologyKubernetesId,
        kind: "technology",
        namespace: "generic",
        name: "Kubernetes",
        roleHistoryEntryIds: [roleAcmeId, roleGlobexId],
        provenance: [{ sourceId: NAUKRI_SOURCE_ID, evidenceId: evidenceKubernetesId }],
      },
      {
        // Shares its canonical id with the CareerGraph reference
        // fixture's Python node (technology:generic:python).
        id: technologyPythonId,
        kind: "technology",
        namespace: "generic",
        name: "Python",
        roleHistoryEntryIds: [roleAcmeId, roleGlobexId],
        provenance: [{ sourceId: NAUKRI_SOURCE_ID, evidenceId: evidencePythonId }],
      },
    ],
  };
}

export const careerProfileFixtureNodeIds = {
  technologyKubernetesId,
  technologyPythonId,
  roleAcmeId,
  roleGlobexId,
};
