import { useState } from "react";
import type { JobDescription } from "../../domain/index.js";
import { useCareerGraph } from "../state/CareerGraphContext.js";

export function RequirementForm({ jobDescription }: { jobDescription: JobDescription }) {
  const { dispatch } = useCareerGraph();
  const [sourceText, setSourceText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceText.trim()) return;
    dispatch({
      type: "ADD_REQUIREMENT",
      input: { jobDescriptionId: jobDescription.id, sourceText: sourceText.trim() },
    });
    setSourceText("");
  }

  return (
    <form onSubmit={handleSubmit} className="panel-form" aria-label="Record requirement">
      <h3>Record a requirement from &ldquo;{jobDescription.title}&rdquo;</h3>
      <p className="node-inspector__meta">
        Paste or type the exact JD wording - this becomes the traceable source
        text for any node created from it. Experience details (years,
        logic, subjects) can be added afterward from the requirement list.
      </p>
      <label>
        Requirement text (verbatim)
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={3}
          required
        />
      </label>
      <button type="submit">Record requirement</button>
    </form>
  );
}
