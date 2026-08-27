import type { StylesheetJsonBlock } from "cytoscape";

/** Node kind -> fill color, so Role/Capability/Skill/Concept/Technology/Tool
 * are visually distinguishable at a glance (spec.md graph-rendering
 * "Node kinds are visually distinguishable"). */
export const NODE_KIND_COLORS: Record<string, string> = {
  role: "#8b5cf6",
  capability: "#2563eb",
  skill: "#0891b2",
  concept: "#6b7280",
  technology: "#16a34a",
  tool: "#d97706",
};

export const cytoscapeStylesheet: StylesheetJsonBlock[] = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      color: "#ffffff",
      "text-outline-width": 1,
      "text-outline-color": "#1a1a1a",
      width: "label",
      height: "label",
      padding: "10px",
      shape: "round-rectangle",
      "font-size": 11,
    },
  },
  ...Object.entries(NODE_KIND_COLORS).map(([kind, color]) => ({
    selector: `node[kind = "${kind}"]`,
    style: { "background-color": color },
  })),
  {
    selector: 'node[kind = "role"]',
    style: { shape: "ellipse" },
  },
  {
    selector: "node[?collapsed]",
    style: {
      "border-width": 3,
      "border-color": "#facc15",
      "border-style": "dashed",
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-width": 4,
      "border-color": "#f8fafc",
    },
  },
  {
    selector: 'edge[kind = "parent"]',
    style: {
      width: 2,
      "line-color": "#9ca3af",
      "target-arrow-color": "#9ca3af",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
    },
  },
  {
    selector: 'edge[kind = "related"]',
    style: {
      width: 1,
      "line-color": "#c084fc",
      "line-style": "dashed",
      "target-arrow-shape": "none",
      "curve-style": "bezier",
    },
  },
];
