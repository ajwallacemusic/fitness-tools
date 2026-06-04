import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { toolsTableMarkdown } from "./tools-table.js";

describe("toolsTableMarkdown", () => {
  const md = toolsTableMarkdown();

  test("is a markdown table with a header row", () => {
    expect(md).toContain("| Tool | Methods | Description |");
    expect(md).toContain("|---|---|---|");
  });

  test("lists all 9 tools with their methods", () => {
    expect(md).toContain("`tdee`");
    expect(md).toContain("mifflin, harris, katch, cunningham");
    expect(md).toContain("`powerlifting-attempts`");
    expect(md).toContain("`muscle-potential`");
    expect(md).toContain("`ffmi`");
    expect(md.split("\n").filter((l) => l.startsWith("| `")).length).toBe(9);
  });

  test("the committed README table matches a fresh generation", () => {
    const readmePath = fileURLToPath(new URL("../README.md", import.meta.url));
    const readme = readFileSync(readmePath, "utf8");
    const block = readme
      .split("<!-- tools:start -->")[1]
      ?.split("<!-- tools:end -->")[0]
      ?.trim();
    expect(block).toBe(toolsTableMarkdown());
  });
});
