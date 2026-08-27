import { useState } from "react";
import type { Requirement } from "../../domain/index.js";
import { useCareerGraph } from "../state/CareerGraphContext.js";

// Not imported from src/domain - this change commits to zero domain
// changes (proposal.md "Impact"), and the domain package doesn't export
// a named type for this closed literal union, only the Zod enum it's
// built from. Duplicating the three literals here is a one-time, fixed
// cost (the set is closed by the already-approved domain spec) rather
// than a maintained parallel definition.
type ExperienceLogic = "SINGLE" | "AND" | "OR";
const LOGICS: ExperienceLogic[] = ["SINGLE", "AND", "OR"];

function isValidSubjectCount(logic: ExperienceLogic, count: number): boolean {
  if (logic === "SINGLE") return count === 1;
  return count >= 2;
}

export function RequirementExperienceForm({
  requirement,
  onDone,
}: {
  requirement: Requirement;
  onDone: () => void;
}) {
  const { dispatch } = useCareerGraph();
  const existing = requirement.experience;
  const [minimumYears, setMinimumYears] = useState(existing?.minimumYears ?? 1);
  const [maximumYears, setMaximumYears] = useState<number | "">(existing?.maximumYears ?? "");
  const [logic, setLogic] = useState<ExperienceLogic>(existing?.logic ?? "SINGLE");
  const [subjectsText, setSubjectsText] = useState(existing?.subjects.join(", ") ?? "");

  const subjects = subjectsText
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const subjectCountValid = isValidSubjectCount(logic, subjects.length);
  const rangeValid = maximumYears === "" || maximumYears >= minimumYears;
  const canSubmit = subjectCountValid && rangeValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    dispatch({
      type: "EDIT_REQUIREMENT_EXPERIENCE",
      requirementId: requirement.id,
      experience: {
        minimumYears,
        ...(maximumYears !== "" ? { maximumYears } : {}),
        unit: "years",
        logic,
        subjects,
      },
    });
    onDone();
  }

  function handleClear() {
    dispatch({ type: "EDIT_REQUIREMENT_EXPERIENCE", requirementId: requirement.id, experience: undefined });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="panel-form" aria-label="Edit experience requirement">
      <h3>Experience requirement</h3>
      <p className="node-inspector__meta">&ldquo;{requirement.sourceText}&rdquo;</p>
      <label>
        Minimum years
        <input
          type="number"
          min={0}
          value={minimumYears}
          onChange={(e) => setMinimumYears(Number(e.target.value))}
        />
      </label>
      <label>
        Maximum years (optional)
        <input
          type="number"
          min={0}
          value={maximumYears}
          onChange={(e) => setMaximumYears(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </label>
      <label>
        Logic
        <select value={logic} onChange={(e) => setLogic(e.target.value as ExperienceLogic)}>
          {LOGICS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        Subjects (comma-separated)
        <input value={subjectsText} onChange={(e) => setSubjectsText(e.target.value)} />
      </label>
      {!subjectCountValid && (
        <p className="form-error">
          {logic === "SINGLE" ? "SINGLE requires exactly 1 subject." : `${logic} requires at least 2 subjects.`}
        </p>
      )}
      {!rangeValid && <p className="form-error">Maximum years must be &gt;= minimum years.</p>}
      <div className="form-actions">
        <button type="submit" disabled={!canSubmit}>
          Save
        </button>
        {existing && (
          <button type="button" onClick={handleClear}>
            Remove experience details
          </button>
        )}
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
