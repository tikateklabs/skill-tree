import { useState } from "react";
import type { CareerGraph } from "../../domain/index.js";
import { useCareerGraph } from "../state/CareerGraphContext.js";
import { evaluateImportResponse, type ImportEvaluation } from "./evaluateImportResponse.js";

export function ImportResponseView({ graph }: { graph: CareerGraph }) {
  const { dispatch } = useCareerGraph();
  const [rawText, setRawText] = useState("");
  const [evaluation, setEvaluation] = useState<ImportEvaluation | null>(null);

  function handleValidate() {
    setEvaluation(evaluateImportResponse(graph, rawText));
  }

  function handleForceStaleProceed() {
    setEvaluation(evaluateImportResponse(graph, rawText, { forceStaleProceed: true }));
  }

  function handleConfirm() {
    if (evaluation?.status === "accepted-full-graph" || evaluation?.status === "accepted-patch") {
      dispatch({ type: "REPLACE_GRAPH", graph: evaluation.graph });
      setRawText("");
      setEvaluation(null);
    }
  }

  return (
    <div className="panel">
      <h2>Import AI response</h2>
      <p className="node-inspector__meta">
        Paste the full CareerGraph JSON or patch envelope the AI returned.
        Nothing is applied until you confirm the preview below.
      </p>
      <label>
        Response
        <textarea
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setEvaluation(null);
          }}
          rows={12}
          aria-label="AI response"
        />
      </label>
      <div className="form-actions">
        <button type="button" onClick={handleValidate} disabled={!rawText.trim()}>
          Validate
        </button>
      </div>

      {evaluation && (
        <div className="import-result" data-testid="import-result">
          {evaluation.status === "parse-error" && (
            <p className="form-error">Not valid JSON: {evaluation.message}</p>
          )}
          {evaluation.status === "unknown-shape" && (
            <p className="form-error">
              This doesn&rsquo;t look like a CareerGraph or a patch envelope
              (expected either a full graph object, or {"{ baseVersion, operations }"}).
            </p>
          )}
          {evaluation.status === "rejected" && (
            <div>
              <p className="form-error">Rejected at the {evaluation.stage} stage:</p>
              <ul>
                {evaluation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.status === "stale" && (
            <div>
              <p className="form-error">
                This patch was generated against version {evaluation.baseVersion}, but the current
                graph is at version {evaluation.currentVersion} - it may be stale.
              </p>
              <div className="form-actions">
                <button type="button" onClick={handleForceStaleProceed}>
                  Proceed anyway
                </button>
              </div>
            </div>
          )}
          {evaluation.status === "accepted-full-graph" && (
            <div>
              <h3>Preview: full graph replacement</h3>
              <ul>
                <li>{evaluation.diff.addedNodeIds.length} node(s) added</li>
                <li>{evaluation.diff.removedNodeIds.length} node(s) removed</li>
                <li>{evaluation.diff.addedRequirementIds.length} requirement(s) added</li>
                <li>{evaluation.diff.removedRequirementIds.length} requirement(s) removed</li>
              </ul>
              <button type="button" onClick={handleConfirm}>
                Confirm and apply
              </button>
            </div>
          )}
          {evaluation.status === "accepted-patch" && (
            <div>
              <h3>Preview: patch operations</h3>
              <ul>
                {evaluation.operations.map((op, i) => (
                  <li key={i}>
                    {op.op} {op.path}
                    {"value" in op ? ` -> ${JSON.stringify(op.value)}` : ""}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={handleConfirm}>
                Confirm and apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
