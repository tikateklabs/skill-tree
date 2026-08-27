import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Not using vitest's `globals: true`, so @testing-library/react's
// automatic afterEach cleanup (which relies on detecting a global
// afterEach) never registers on its own - without this, DOM from one
// test in a file leaks into the next, causing spurious
// "multiple elements found" failures.
afterEach(() => {
  cleanup();
});
