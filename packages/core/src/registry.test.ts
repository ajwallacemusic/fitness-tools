import { describe, expect, test } from "vitest";
import { z } from "zod";
import { type Tool, REGISTRY, register } from "./registry.js";

function makeTool(id = "double"): Tool {
  const input = z.object({ x: z.number() });
  const output = z.object({ y: z.number() });
  return {
    id,
    name: "Double",
    description: "doubles x",
    category: "test",
    tags: ["t"],
    methods: ["double"],
    input,
    output,
    compute: (i: { x: number }) => ({ y: i.x * 2 }),
    examples: [{ input: { x: 2 }, output: { y: 4 } }],
  };
}

describe("registry", () => {
  test("register adds to registry", () => {
    const t = makeTool("double-add");
    register(t);
    expect(REGISTRY.get("double-add")).toBe(t);
  });
  test("duplicate id rejected", () => {
    register(makeTool("double-dup"));
    expect(() => register(makeTool("double-dup"))).toThrow();
  });
});
