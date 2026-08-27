import { useRef, useState } from "react";
import type { CareerGraph } from "../../domain/index.js";
import { validateCareerGraphImport } from "../../domain/index.js";
import { useCareerGraph } from "../state/CareerGraphContext.js";

export function serializeGraphForExport(graph: CareerGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function ExportImportControls({ graph }: { graph: CareerGraph }) {
  const { dispatch } = useCareerGraph();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleExport() {
    const blob = new Blob([serializeGraphForExport(graph)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${graph.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      setImportError(`Not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    const result = validateCareerGraphImport(parsed);
    if (!result.accepted) {
      setImportError(`Rejected at the ${result.stage} stage: ${result.errors.join("; ")}`);
      return;
    }
    setImportError(null);
    dispatch({ type: "REPLACE_GRAPH", graph: result.graph });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="export-import-controls">
      <button type="button" onClick={handleExport}>
        Export as .json
      </button>
      <label className="file-input-label">
        Import from .json
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
        />
      </label>
      {importError && <p className="form-error">{importError}</p>}
    </div>
  );
}
