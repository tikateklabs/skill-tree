import { describe, expect, it } from "vitest";
import { deriveNodeId, slug } from "./id.js";

describe("slug", () => {
  it("lowercases and collapses whitespace", () => {
    expect(slug("Large-scale distributed systems operations")).toBe(
      "large-scale-distributed-systems-operations",
    );
  });

  it("collapses irregular whitespace and trims", () => {
    expect(slug("  Prometheus  ")).toBe("prometheus");
    expect(slug("prometheus")).toBe("prometheus");
  });
});

describe("deriveNodeId", () => {
  it("combines kind, namespace, and name", () => {
    expect(deriveNodeId("technology", "generic", "Prometheus")).toBe(
      "technology:generic:prometheus",
    );
  });

  it("same name, same namespace, case/whitespace variants resolve to one id", () => {
    const a = deriveNodeId("technology", "generic", "Prometheus");
    const b = deriveNodeId("technology", "generic", "prometheus ");
    expect(a).toBe(b);
  });

  it("same name, different namespace, stays distinct", () => {
    const mongo = deriveNodeId("technology", "mongodb", "Atlas");
    const internal = deriveNodeId("technology", "internal", "Atlas");
    expect(mongo).not.toBe(internal);
    expect(mongo).toBe("technology:mongodb:atlas");
    expect(internal).toBe("technology:internal:atlas");
  });
});
