import "fake-indexeddb/auto";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ImportResponseView } from "./ImportResponseView.js";
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
      <ImportResponseView graph={state.graph} />
      <p data-testid="role-name">{state.graph.role.name}</p>
    </div>
  );
}

describe("ImportResponseView", () => {
  it("validates, previews, and commits a patch envelope only on explicit confirmation", async () => {
    const user = userEvent.setup();
    render(
      <CareerGraphProvider>
        <Harness />
      </CareerGraphProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "create" }));
    await waitFor(() => expect(screen.getByTestId("role-name")).toHaveTextContent("Principal Engineer"));

    const textarea = screen.getByLabelText("AI response");
    await user.click(textarea);
    await user.paste(
      JSON.stringify({
        baseVersion: 1,
        operations: [{ op: "replace", path: "/role/name", value: "Renamed via AI" }],
      }),
    );

    await user.click(screen.getByRole("button", { name: "Validate" }));
    expect(screen.getByText(/Preview: patch operations/)).toBeInTheDocument();
    // Not applied yet.
    expect(screen.getByTestId("role-name")).toHaveTextContent("Principal Engineer");

    await user.click(screen.getByRole("button", { name: "Confirm and apply" }));
    await waitFor(() => expect(screen.getByTestId("role-name")).toHaveTextContent("Renamed via AI"));
  });
});
