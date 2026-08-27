import cytoscape, { type Core } from "cytoscape";
import dagre, { type DagreLayoutOptions } from "cytoscape-dagre";
import { useEffect, useRef } from "react";
import type { CareerGraph } from "../../domain/index.js";
import { buildElements } from "./buildElements.js";
import { cytoscapeStylesheet } from "./cytoscapeStyle.js";

let dagreRegistered = false;
function ensureDagreRegistered() {
  if (!dagreRegistered) {
    cytoscape.use(dagre);
    dagreRegistered = true;
  }
}

const layoutOptions: DagreLayoutOptions = {
  name: "dagre",
  rankDir: "TB",
  nodeSep: 40,
  rankSep: 70,
  fit: true,
  padding: 30,
};

export interface GraphViewProps {
  graph: CareerGraph;
  collapsedNodeIds: ReadonlySet<string>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

export function GraphView({ graph, collapsedNodeIds, selectedNodeId, onSelectNode }: GraphViewProps) {
  ensureDagreRegistered();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      style: cytoscapeStylesheet,
      elements: [],
    });
    cy.on("tap", "node", (evt) => {
      onSelectNodeRef.current(evt.target.id());
    });
    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().remove();
    cy.add(buildElements(graph, collapsedNodeIds));
    cy.layout(layoutOptions).run();
  }, [graph, collapsedNodeIds]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.$("node:selected").unselect();
    if (selectedNodeId && cy.$id(selectedNodeId).length > 0) {
      cy.$id(selectedNodeId).select();
    }
  }, [selectedNodeId, graph, collapsedNodeIds]);

  return <div ref={containerRef} className="graph-view" data-testid="graph-view" />;
}
