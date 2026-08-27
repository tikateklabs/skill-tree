import { describe, expect, it } from "vitest";
import { buildCareerGraphFixture } from "../../fixtures/careerGraphFixture.js";
import { buildPrompt } from "./buildPrompt.js";

describe("buildPrompt", () => {
  it("includes the target JD's raw text and the current graph's JSON", () => {
    const graph = buildCareerGraphFixture();
    const jobDescription = graph.sourceJobDescriptions[0]!;

    const prompt = buildPrompt(graph, jobDescription);

    expect(prompt).toContain(jobDescription.rawText);
    expect(prompt).toContain(JSON.stringify(graph.id));
    expect(prompt).toContain(`"version": ${graph.version}`);
  });

  it("instructs the patch-envelope shape so a stale-version check has something to compare", () => {
    const graph = buildCareerGraphFixture();
    const jobDescription = graph.sourceJobDescriptions[0]!;
    const prompt = buildPrompt(graph, jobDescription);
    expect(prompt).toContain("baseVersion");
    expect(prompt).toContain("operations");
  });
});
