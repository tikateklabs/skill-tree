import { useState } from "react";
import { useCareerGraph } from "./state/CareerGraphContext.js";
import { CreateFirstGraphForm } from "./jdImport/CreateFirstGraphForm.js";
import { GraphPanel } from "./graph/GraphPanel.js";
import { EditingPanel } from "./editing/EditingPanel.js";
import { JdImportPanel } from "./jdImport/JdImportPanel.js";
import { PromptView } from "./prompt/PromptView.js";
import { ImportResponseView } from "./importResponse/ImportResponseView.js";
import { ExportImportControls } from "./persistence/ExportImportControls.js";

type ActiveView = "graph" | "editing" | "jdImport" | "prompt" | "importResponse";

const VIEWS: { id: ActiveView; label: string }[] = [
  { id: "graph", label: "Graph" },
  { id: "editing", label: "Edit" },
  { id: "jdImport", label: "Job descriptions" },
  { id: "prompt", label: "AI prompt" },
  { id: "importResponse", label: "Import AI response" },
];

export function App() {
  const { state } = useCareerGraph();
  const [activeView, setActiveView] = useState<ActiveView>("graph");

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Skill Tree</h1>
        {state.graph && (
          <nav className="app-nav" aria-label="Panels">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                className={activeView === view.id ? "active" : ""}
                onClick={() => setActiveView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </nav>
        )}
        {state.graph && <ExportImportControls graph={state.graph} />}
      </header>

      {state.error && <p className="form-error app-error">{state.error}</p>}

      <main className="app-main">
        {!state.graph ? (
          <CreateFirstGraphForm />
        ) : (
          <>
            {activeView === "graph" && <GraphPanel graph={state.graph} />}
            {activeView === "editing" && <EditingPanel graph={state.graph} />}
            {activeView === "jdImport" && <JdImportPanel graph={state.graph} />}
            {activeView === "prompt" && <PromptView graph={state.graph} />}
            {activeView === "importResponse" && <ImportResponseView graph={state.graph} />}
          </>
        )}
      </main>
    </div>
  );
}
