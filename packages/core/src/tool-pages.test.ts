import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { REGISTRY } from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));
const TOOLS_DOCS_DIR = resolve(here, "../../../apps/docs/src/content/docs/tools");

describe("per-tool docs pages", () => {
  it("every registered tool has a docs page", () => {
    const pages = existsSync(TOOLS_DOCS_DIR)
      ? new Set(readdirSync(TOOLS_DOCS_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx")).map((f) => f.replace(/\.mdx?$/, "")))
      : new Set<string>();
    const missing = [...REGISTRY.keys()].filter((id) => !pages.has(id));
    expect(missing, `missing tools/<id>.md for: ${missing.join(", ")}`).toEqual([]);
  });

  it("every tool example parses and computes", () => {
    for (const tool of REGISTRY.values()) {
      for (const ex of tool.examples) {
        const parsed = tool.input.parse(ex.input);
        expect(() => tool.compute(parsed)).not.toThrow();
      }
    }
  });
});
