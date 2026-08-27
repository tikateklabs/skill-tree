import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { clearPersistedGraph, loadPersistedGraph, savePersistedGraph } from "./persistence.js";
import { createFirstGraph } from "./graphOperations.js";

describe("persistence", () => {
  // `persistence.ts` caches its db connection at module scope, so tests
  // share one fake-indexeddb instance for this file; reset by clearing
  // the record rather than swapping out `indexedDB` itself.
  beforeEach(async () => {
    await clearPersistedGraph();
  });

  it("returns null when nothing has been saved yet", async () => {
    const loaded = await loadPersistedGraph();
    expect(loaded).toBeNull();
  });

  it("round-trips a saved graph", async () => {
    const graph = createFirstGraph({
      jobDescription: { title: "Principal Engineer", rawText: "JD text" },
      requirement: { sourceText: "Principal Engineer" },
      role: { name: "Principal Engineer" },
    });

    await savePersistedGraph(graph);
    const loaded = await loadPersistedGraph();
    expect(loaded).toEqual(graph);
  });

  it("clears a saved graph", async () => {
    const graph = createFirstGraph({
      jobDescription: { title: "Principal Engineer", rawText: "JD text" },
      requirement: { sourceText: "Principal Engineer" },
      role: { name: "Principal Engineer" },
    });
    await savePersistedGraph(graph);
    await clearPersistedGraph();
    expect(await loadPersistedGraph()).toBeNull();
  });

  it("treats an invalid stored record as nothing saved, rather than throwing", async () => {
    const db = await import("idb");
    const conn = await db.openDB("skill-tree", 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("careerGraphs")) {
          database.createObjectStore("careerGraphs");
        }
      },
    });
    await conn.put("careerGraphs", { not: "a career graph" }, "current");

    const loaded = await loadPersistedGraph();
    expect(loaded).toBeNull();
  });
});
