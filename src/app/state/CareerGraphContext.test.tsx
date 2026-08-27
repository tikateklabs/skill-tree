import "fake-indexeddb/auto";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CareerGraphProvider, useCareerGraph } from "./CareerGraphContext.js";
import { clearPersistedGraph, loadPersistedGraph } from "./persistence.js";

beforeEach(async () => {
  await clearPersistedGraph();
});

function renderProvider() {
  return renderHook(() => useCareerGraph(), { wrapper: CareerGraphProvider });
}

describe("CareerGraphProvider", () => {
  it("starts with graph: null until the initial load resolves", async () => {
    const { result } = renderProvider();
    await waitFor(() => expect(result.current.state.graph).toBeNull());
  });

  it("rejects an invalid mutation, leaving state and the error message set", async () => {
    const { result } = renderProvider();
    await waitFor(() => expect(result.current.state.graph).toBeNull());

    act(() => {
      result.current.dispatch({
        type: "CREATE_FIRST_GRAPH",
        input: {
          jobDescription: { title: "Principal Engineer", rawText: "JD text" },
          requirement: { sourceText: "Principal Engineer" },
          role: { name: "Principal Engineer" },
        },
      });
    });
    await waitFor(() => expect(result.current.state.graph).not.toBeNull());
    const graphId = result.current.state.graph!.id;

    act(() => {
      result.current.dispatch({
        type: "ADD_NODE",
        input: {
          kind: "technology",
          name: "Prometheus",
          parentIds: [],
          provenance: [],
        },
      });
    });

    expect(result.current.state.error).toBeTruthy();
    expect(result.current.state.graph!.id).toBe(graphId);
    expect(result.current.state.graph!.nodes).toHaveLength(0);
  });

  it("auto-saves an accepted mutation and it survives a simulated reload", async () => {
    const { result, unmount } = renderProvider();
    await waitFor(() => expect(result.current.state.graph).toBeNull());

    act(() => {
      result.current.dispatch({
        type: "CREATE_FIRST_GRAPH",
        input: {
          jobDescription: { title: "Principal Engineer", rawText: "JD text" },
          requirement: { sourceText: "Principal Engineer" },
          role: { name: "Principal Engineer" },
        },
      });
    });
    await waitFor(() => expect(result.current.state.graph).not.toBeNull());
    const graphId = result.current.state.graph!.id;

    await waitFor(async () => {
      const persisted = await loadPersistedGraph();
      expect(persisted?.id).toBe(graphId);
    });

    unmount();

    const { result: reloaded } = renderProvider();
    await waitFor(() => expect(reloaded.current.state.graph?.id).toBe(graphId));
  });
});
