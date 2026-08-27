import { useMemo, useState } from "react";
import type { CareerGraph } from "../../domain/index.js";
import { buildPrompt } from "./buildPrompt.js";

export function PromptView({ graph }: { graph: CareerGraph }) {
  const [jobDescriptionId, setJobDescriptionId] = useState(
    graph.sourceJobDescriptions[0]?.id ?? "",
  );
  const [copied, setCopied] = useState(false);

  const jobDescription = graph.sourceJobDescriptions.find((jd) => jd.id === jobDescriptionId);
  const prompt = useMemo(
    () => (jobDescription ? buildPrompt(graph, jobDescription) : ""),
    [graph, jobDescription],
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (graph.sourceJobDescriptions.length === 0) {
    return <p>Add a job description first.</p>;
  }

  return (
    <div className="panel">
      <h2>Generate AI prompt</h2>
      <label>
        Target job description
        <select value={jobDescriptionId} onChange={(e) => setJobDescriptionId(e.target.value)}>
          {graph.sourceJobDescriptions.map((jd) => (
            <option key={jd.id} value={jd.id}>
              {jd.title}
              {jd.company ? ` at ${jd.company}` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="form-actions">
        <button type="button" onClick={handleCopy} disabled={!prompt}>
          {copied ? "Copied!" : "Copy to clipboard"}
        </button>
      </div>
      <textarea readOnly value={prompt} rows={16} className="prompt-preview" aria-label="Generated prompt" />
    </div>
  );
}
