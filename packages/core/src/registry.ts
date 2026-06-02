import type { z } from "zod";

export interface Tool<I = any, O = any> {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  methods: string[];
  // The third type param (the schema's INPUT) is left as `unknown` so schemas
  // that use .default()/nullable-with-default — whose parse-input type differs
  // from their z.output type — are still assignable. `I`/`O` track z.output.
  input: z.ZodType<I, z.ZodTypeDef, unknown>;
  output: z.ZodType<O, z.ZodTypeDef, unknown>;
  compute: (input: I) => O;
  examples: { input: unknown; output: unknown }[];
}

export const REGISTRY = new Map<string, Tool>();

export function register<I, O>(tool: Tool<I, O>): Tool<I, O> {
  if (REGISTRY.has(tool.id)) throw new Error(`duplicate tool id: ${tool.id}`);
  REGISTRY.set(tool.id, tool);
  return tool;
}
