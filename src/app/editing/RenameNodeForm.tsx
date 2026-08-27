import { useState } from "react";
import type { GraphNode } from "../../domain/index.js";
import { useCareerGraph } from "../state/CareerGraphContext.js";

export function RenameNodeForm({ node, onDone }: { node: GraphNode; onDone: () => void }) {
  const { dispatch } = useCareerGraph();
  const [name, setName] = useState(node.name);
  const [namespace, setNamespace] = useState(node.namespace);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "RENAME_NODE", input: { nodeId: node.id, name, namespace } });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="panel-form" aria-label="Rename node">
      <h3>Rename node</h3>
      <p className="node-inspector__meta">
        Renaming changes this node&rsquo;s id and updates every reference to it.
      </p>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Namespace
        <input value={namespace} onChange={(e) => setNamespace(e.target.value)} required />
      </label>
      <div className="form-actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
