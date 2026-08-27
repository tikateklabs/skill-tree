import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildCareerGraphFixture } from "../../fixtures/careerGraphFixture.js";
import { PromptView } from "./PromptView.js";
import { buildPrompt } from "./buildPrompt.js";

describe("PromptView", () => {
  it("copies the full assembled prompt text to the clipboard", async () => {
    const user = userEvent.setup();
    const graph = buildCareerGraphFixture();
    render(<PromptView graph={graph} />);

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    await user.click(screen.getByRole("button", { name: /copy to clipboard/i }));

    const expected = buildPrompt(graph, graph.sourceJobDescriptions[0]!);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expected);
  });
});
