import { useState } from "react";
import type { CareerGraph } from "../../domain/index.js";
import { AddNodeForm } from "./AddNodeForm.js";
import { RequirementExperienceForm } from "./RequirementExperienceForm.js";

export function EditingPanel({ graph }: { graph: CareerGraph }) {
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const editingRequirement = graph.requirements.find((r) => r.id === editingRequirementId);

  return (
    <div className="panel">
      <AddNodeForm graph={graph} />

      <section>
        <h3>Requirements</h3>
        <ul>
          {graph.requirements.map((req) => (
            <li key={req.id}>
              <span>&ldquo;{req.sourceText}&rdquo;</span>{" "}
              {req.experience && (
                <span className="node-inspector__meta">
                  ({req.experience.minimumYears}
                  {req.experience.maximumYears ? `-${req.experience.maximumYears}` : "+"} yrs,{" "}
                  {req.experience.logic})
                </span>
              )}{" "}
              <button type="button" className="link-button" onClick={() => setEditingRequirementId(req.id)}>
                Edit experience
              </button>
            </li>
          ))}
        </ul>
      </section>

      {editingRequirement && (
        <RequirementExperienceForm
          requirement={editingRequirement}
          onDone={() => setEditingRequirementId(null)}
        />
      )}
    </div>
  );
}
