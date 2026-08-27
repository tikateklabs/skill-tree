import "fake-indexeddb/auto";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AddNodeForm } from "./AddNodeForm.js";
import { CareerGraphProvider, useCareerGraph } from "../state/CareerGraphContext.js";
import { clearPersistedGraph } from "../state/persistence.js";

beforeEach(async () => {
  await clearPersistedGraph();
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
      <AddNodeForm graph={state.graph} />
      <p data-testid="node-count">{state.graph.nodes.length}</p>
    </div>
  );
}

describe("AddNodeForm", () => {
  it("adds a valid node against the role and an existing requirement", async () => {
    const user = userEvent.setup();
    render(
      <CareerGraphProvider>
        <Harness />
      </CareerGraphProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "create" })).toBeInTheDocument());
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "create" }));
    });

    await waitFor(() => expect(screen.getByLabelText("Name")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Name"), "AIOps");

    const parentSelect = screen.getByLabelText(/Parent/);
    const parentOption = (parentSelect as HTMLSelectElement).options[0]!;
    await user.selectOptions(parentSelect, parentOption.value);

    const requirementSelect = screen.getByLabelText(/Provenance/);
    const requirementOption = (requirementSelect as HTMLSelectElement).options[0]!;
    await user.selectOptions(requirementSelect, requirementOption.value);

    await user.click(screen.getByRole("button", { name: "Add node" }));

    await waitFor(() => expect(screen.getByTestId("node-count")).toHaveTextContent("1"));
  });
});
