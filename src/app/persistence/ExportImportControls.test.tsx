import "fake-indexeddb/auto";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ExportImportControls, serializeGraphForExport } from "./ExportImportControls.js";
import { CareerGraphProvider, useCareerGraph } from "../state/CareerGraphContext.js";
import { clearPersistedGraph } from "../state/persistence.js";
import { buildCareerGraphFixture } from "../../fixtures/careerGraphFixture.js";

beforeEach(async () => {
  await clearPersistedGraph();
});

describe("serializeGraphForExport", () => {
  it("round-trips to a deep-equal object", () => {
    const graph = buildCareerGraphFixture();
    const serialized = serializeGraphForExport(graph);
    expect(JSON.parse(serialized)).toEqual(graph);
  });
});

function Harness() {
  const { state, dispatch } = useCareerGraph();
  if (!state.graph) {
    return (
      <button
        onClick={() =>
          dispatch({
            type: "CREATE_FIRST_GRAPH",
            input: {
              jobDescription: { title: "Principal Engineer", rawText: "JD text" },
              requirement: { sourceText: "Principal Engineer" },
              role: { name: "Principal Engineer" },
            },
          })
        }
      >
        create
      </button>
    );
  }
  return (
    <div>
      <ExportImportControls graph={state.graph} />
      <p data-testid="role-name">{state.graph.role.name}</p>
    </div>
  );
}

describe("ExportImportControls - import", () => {
  it("replaces the active graph with a valid uploaded file", async () => {
    const user = userEvent.setup();
    render(
      <CareerGraphProvider>
        <Harness />
      </CareerGraphProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "create" }));
    await waitFor(() => expect(screen.getByTestId("role-name")).toHaveTextContent("Principal Engineer"));

    const fixture = buildCareerGraphFixture();
    const file = new File([JSON.stringify(fixture)], "graph.json", { type: "application/json" });
    const input = screen.getByLabelText(/Import from \.json/i);
    await user.upload(input, file);

    await waitFor(() => expect(screen.getByTestId("role-name")).toHaveTextContent(fixture.role.name));
  });

  it("rejects an invalid uploaded file without changing the active graph", async () => {
    const user = userEvent.setup();
    render(
      <CareerGraphProvider>
        <Harness />
      </CareerGraphProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "create" }));
    await waitFor(() => expect(screen.getByTestId("role-name")).toHaveTextContent("Principal Engineer"));

    const file = new File([JSON.stringify({ not: "a career graph" })], "bad.json", {
      type: "application/json",
    });
    const input = screen.getByLabelText(/Import from \.json/i);
    await user.upload(input, file);

    await waitFor(() => expect(screen.getByText(/Rejected at the/)).toBeInTheDocument());
    expect(screen.getByTestId("role-name")).toHaveTextContent("Principal Engineer");
  });
});
