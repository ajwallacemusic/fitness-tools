import type { z } from "zod";

export interface Tool<I = any, O = any> {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  methods: string[];
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  compute: (input: I) => O;
  examples: { input: unknown; output: unknown }[];
}

export const REGISTRY = new Map<string, Tool>();

export function register<I, O>(tool: Tool<I, O>): Tool<I, O> {
  if (REGISTRY.has(tool.id)) throw new Error(`duplicate tool id: ${tool.id}`);
  REGISTRY.set(tool.id, tool);
  return tool;
}
