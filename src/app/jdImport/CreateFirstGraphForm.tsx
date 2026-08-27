import { useState } from "react";
import { useCareerGraph } from "../state/CareerGraphContext.js";

/**
 * The "no graph yet" flow: a schema-valid CareerGraph is impossible with
 * zero JobDescriptions/Requirements (Role.provenance is mandatory and
 * must resolve through a Requirement to a JobDescription), so creating
 * the first graph means capturing all three at once rather than starting
 * from a fabricated empty graph. See design.md "No fabricated 'empty
 * starter graph'".
 */
export function CreateFirstGraphForm() {
  const { dispatch, state } = useCareerGraph();
  const [roleName, setRoleName] = useState("");
  const [jdTitle, setJdTitle] = useState("");
  const [jdCompany, setJdCompany] = useState("");
  const [jdRawText, setJdRawText] = useState("");
  const [requirementText, setRequirementText] = useState("");

  const canSubmit =
    roleName.trim().length > 0 &&
    jdTitle.trim().length > 0 &&
    jdRawText.trim().length > 0 &&
    requirementText.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    dispatch({
      type: "CREATE_FIRST_GRAPH",
      input: {
        role: { name: roleName.trim() },
        jobDescription: {
          title: jdTitle.trim(),
          ...(jdCompany.trim() ? { company: jdCompany.trim() } : {}),
          rawText: jdRawText,
        },
        requirement: { sourceText: requirementText.trim() },
      },
    });
  }

  return (
    <div className="panel panel--onboarding">
      <h2>Create your first CareerGraph</h2>
      <p>
        Every node needs to be traceable to real job-description wording, so
        getting started means recording a job description, one requirement
        from it, and the role it applies to.
      </p>
      <form onSubmit={handleSubmit} className="panel-form" aria-label="Create first graph">
        <label>
          Role name
          <input value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
        </label>
        <label>
          Job title
          <input value={jdTitle} onChange={(e) => setJdTitle(e.target.value)} required />
        </label>
        <label>
          Company (optional)
          <input value={jdCompany} onChange={(e) => setJdCompany(e.target.value)} />
        </label>
        <label>
          Job description text
          <textarea
            value={jdRawText}
            onChange={(e) => setJdRawText(e.target.value)}
            rows={8}
            required
          />
        </label>
        <label>
          One requirement from it (verbatim)
          <textarea
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            rows={2}
            required
          />
        </label>
        <button type="submit" disabled={!canSubmit}>
          Create graph
        </button>
        {state.error && <p className="form-error">{state.error}</p>}
      </form>
    </div>
  );
}
