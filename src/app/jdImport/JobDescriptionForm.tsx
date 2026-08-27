import { useState } from "react";
import { useCareerGraph } from "../state/CareerGraphContext.js";

export function JobDescriptionForm() {
  const { dispatch } = useCareerGraph();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawText, setRawText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) return;
    dispatch({
      type: "ADD_JOB_DESCRIPTION",
      input: { title: title.trim(), ...(company.trim() ? { company: company.trim() } : {}), rawText },
    });
    setTitle("");
    setCompany("");
    setRawText("");
  }

  return (
    <form onSubmit={handleSubmit} className="panel-form" aria-label="Add job description">
      <h3>Add job description</h3>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Company (optional)
        <input value={company} onChange={(e) => setCompany(e.target.value)} />
      </label>
      <label>
        Raw text
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={8}
          required
        />
      </label>
      <button type="submit">Add job description</button>
    </form>
  );
}
