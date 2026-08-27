import { useState } from "react";
import type { CareerGraph } from "../../domain/index.js";
import { GraphView } from "./GraphView.js";
import { NodeInspector } from "./NodeInspector.js";
import { RenameNodeForm } from "../editing/RenameNodeForm.js";
import { DeleteNodeConfirm } from "../editing/DeleteNodeConfirm.js";

export function GraphPanel({ graph }: { graph: CareerGraph }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);

  function handleToggleCollapse(nodeId: string) {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  const renamingNode = renamingNodeId ? graph.nodes.find((n) => n.id === renamingNodeId) : undefined;

  return (
    <div className="graph-panel">
      <GraphView
        graph={graph}
        collapsedNodeIds={collapsedNodeIds}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
      />
      {renamingNode ? (
        <RenameNodeForm node={renamingNode} onDone={() => setRenamingNodeId(null)} />
      ) : deletingNodeId ? (
        <DeleteNodeConfirm
          graph={graph}
          nodeId={deletingNodeId}
          onDone={() => {
            setDeletingNodeId(null);
            setSelectedNodeId(null);
          }}
        />
      ) : (
        <NodeInspector
          graph={graph}
          nodeId={selectedNodeId}
          isCollapsed={selectedNodeId ? collapsedNodeIds.has(selectedNodeId) : false}
          onToggleCollapse={handleToggleCollapse}
          onSelectNode={setSelectedNodeId}
          onRequestRename={setRenamingNodeId}
          onRequestDelete={setDeletingNodeId}
        />
      )}
    </div>
  );
}
