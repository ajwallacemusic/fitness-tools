import { REGISTRY } from "./index.js";

/** A markdown table of the registered tools, generated from the registry. */
export function toolsTableMarkdown(): string {
  const header = "| Tool | Methods | Description |\n|---|---|---|";
  // Escape `|` so a future tool description can't break the table row.
  const cell = (s: string) => s.replace(/\|/g, "\\|");
  const rows = [...REGISTRY.values()].map(
    (t) => `| \`${t.id}\` | ${cell(t.methods.join(", "))} | ${cell(t.description)} |`,
  );
  return [header, ...rows].join("\n");
}
