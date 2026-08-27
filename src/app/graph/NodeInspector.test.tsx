import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildCareerGraphFixture, nodeIds } from "../../fixtures/careerGraphFixture.js";
import { NodeInspector } from "./NodeInspector.js";

const graph = buildCareerGraphFixture();
const noop = vi.fn();

describe("NodeInspector", () => {
  it("shows a prompt when nothing is selected", () => {
    render(
      <NodeInspector
        graph={graph}
        nodeId={null}
        isCollapsed={false}
        onToggleCollapse={noop}
        onSelectNode={noop}
        onRequestRename={noop}
        onRequestDelete={noop}
      />,
    );
    expect(screen.getByText(/select a node/i)).toBeInTheDocument();
  });

  it("shows the originating JD wording for a selected node", () => {
    render(
      <NodeInspector
        graph={graph}
        nodeId={nodeIds.technologyPrometheusId}
        isCollapsed={false}
        onToggleCollapse={noop}
        onSelectNode={noop}
        onRequestRename={noop}
        onRequestDelete={noop}
      />,
    );
    expect(screen.getByText("Prometheus")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Experience with observability tooling such as Prometheus, Splunk, and OpenTelemetry/,
      ),
    ).toBeInTheDocument();
  });

  it("shows an attached experience requirement", () => {
    render(
      <NodeInspector
        graph={graph}
        nodeId={nodeIds.skillProgrammingLanguagesId}
        isCollapsed={false}
        onToggleCollapse={noop}
        onSelectNode={noop}
        onRequestRename={noop}
        onRequestDelete={noop}
      />,
    );
    expect(screen.getByText(/4\+ years - SINGLE of Python/)).toBeInTheDocument();
  });
});
