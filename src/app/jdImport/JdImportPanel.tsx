import { useState } from "react";
import type { CareerGraph } from "../../domain/index.js";
import { JobDescriptionForm } from "./JobDescriptionForm.js";
import { RequirementForm } from "./RequirementForm.js";

export function JdImportPanel({ graph }: { graph: CareerGraph }) {
  const [selectedJdId, setSelectedJdId] = useState<string | null>(
    graph.sourceJobDescriptions[0]?.id ?? null,
  );
  const selectedJd = graph.sourceJobDescriptions.find((jd) => jd.id === selectedJdId);

  return (
    <div className="panel">
      <JobDescriptionForm />

      <section>
        <h3>Job descriptions</h3>
        <ul>
          {graph.sourceJobDescriptions.map((jd) => (
            <li key={jd.id}>
              <button type="button" className="link-button" onClick={() => setSelectedJdId(jd.id)}>
                {jd.title}
                {jd.company ? ` at ${jd.company}` : ""}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedJd && <RequirementForm jobDescription={selectedJd} />}
    </div>
  );
}
