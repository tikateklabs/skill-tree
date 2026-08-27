import type { CareerGraph } from "../../domain/index.js";
import { resolveNodeInspectorData } from "./nodeInspectorData.js";

export interface NodeInspectorProps {
  graph: CareerGraph;
  nodeId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onRequestRename: (nodeId: string) => void;
  onRequestDelete: (nodeId: string) => void;
}

export function NodeInspector({
  graph,
  nodeId,
  isCollapsed,
  onToggleCollapse,
  onSelectNode,
  onRequestRename,
  onRequestDelete,
}: NodeInspectorProps) {
  if (!nodeId) {
    return (
      <aside className="node-inspector node-inspector--empty" data-testid="node-inspector">
        <p>Select a node to see why it exists.</p>
      </aside>
    );
  }

  const data = resolveNodeInspectorData(graph, nodeId);
  if (!data) {
    return (
      <aside className="node-inspector" data-testid="node-inspector">
        <p>Node not found.</p>
      </aside>
    );
  }

  const isRole = data.kind === "role";

  return (
    <aside className="node-inspector" data-testid="node-inspector">
      <header className="node-inspector__header">
        <span className={`kind-badge kind-badge--${data.kind}`}>{data.kind}</span>
        <h2>{data.name}</h2>
        <p className="node-inspector__meta">namespace: {data.namespace}</p>
        {data.description && <p>{data.description}</p>}
      </header>

      {!isRole && (
        <div className="node-inspector__actions">
          <button type="button" onClick={() => onToggleCollapse(data.id)}>
            {isCollapsed ? "Expand children" : "Collapse children"}
          </button>
          <button type="button" onClick={() => onRequestRename(data.id)}>
            Rename
          </button>
          <button type="button" onClick={() => onRequestDelete(data.id)}>
            Delete
          </button>
        </div>
      )}

      <section>
        <h3>Why this exists</h3>
        <ul className="provenance-list">
          {data.provenance.map((entry, index) => (
            <li key={index}>
              <blockquote>&ldquo;{entry.sourceText}&rdquo;</blockquote>
              <p className="node-inspector__meta">
                {entry.jobDescriptionTitle}
                {entry.jobDescriptionCompany ? ` at ${entry.jobDescriptionCompany}` : ""}
              </p>
              {entry.rationale && <p className="node-inspector__rationale">{entry.rationale}</p>}
            </li>
          ))}
        </ul>
      </section>

      {data.experienceRequirements.length > 0 && (
        <section>
          <h3>Experience requirements</h3>
          <ul>
            {data.experienceRequirements.map((req, index) => (
              <li key={index}>
                {req.minimumYears}
                {req.maximumYears ? `-${req.maximumYears}` : "+"} {req.unit} - {req.logic} of{" "}
                {req.subjects.join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.relatedNodes.length > 0 && (
        <section>
          <h3>Related</h3>
          <ul>
            {data.relatedNodes.map((related) => (
              <li key={related.id}>
                <button type="button" className="link-button" onClick={() => onSelectNode(related.id)}>
                  {related.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.children.length > 0 && (
        <section>
          <h3>Children</h3>
          <ul>
            {data.children.map((child) => (
              <li key={child.id}>
                <button type="button" className="link-button" onClick={() => onSelectNode(child.id)}>
                  {child.name}
                </button>{" "}
                <span className="node-inspector__meta">({child.kind})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
