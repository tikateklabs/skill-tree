import type { CareerGraph } from "../../domain/index.js";
import { computeDeleteCascade } from "../state/graphOperations.js";
import { useCareerGraph } from "../state/CareerGraphContext.js";

export function DeleteNodeConfirm({
  graph,
  nodeId,
  onDone,
}: {
  graph: CareerGraph;
  nodeId: string;
  onDone: () => void;
}) {
  const { dispatch } = useCareerGraph();
  const cascade = computeDeleteCascade(graph, nodeId);
  const affected = [graph.role, ...graph.nodes].filter((n) => cascade.has(n.id));

  function handleConfirm() {
    dispatch({ type: "DELETE_NODE", nodeId });
    onDone();
  }

  return (
    <div className="panel-form" role="alertdialog" aria-label="Confirm delete">
      <h3>Delete node</h3>
      <p>
        This will remove {affected.length} node{affected.length === 1 ? "" : "s"} - any node left
        with no remaining parent is removed too:
      </p>
      <ul>
        {affected.map((n) => (
          <li key={n.id}>
            {n.name} ({n.kind})
          </li>
        ))}
      </ul>
      <div className="form-actions">
        <button type="button" className="danger" onClick={handleConfirm}>
          Confirm delete
        </button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
