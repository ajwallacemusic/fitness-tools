import { zodToJsonSchema } from "zod-to-json-schema";
import { REGISTRY, type Tool } from "@almostjacked/fitness-tools";

export interface CatalogEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  methods: string[];
  input_schema: Record<string, unknown> & { type?: string };
  output_schema: Record<string, unknown> & { type?: string };
  examples: { input: unknown; output: unknown }[];
}

export function toCatalogEntry(tool: Tool): CatalogEntry {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    tags: tool.tags,
    methods: tool.methods,
    input_schema: zodToJsonSchema(tool.input, { target: "jsonSchema7" }) as CatalogEntry["input_schema"],
    output_schema: zodToJsonSchema(tool.output, { target: "jsonSchema7" }) as CatalogEntry["output_schema"],
    examples: tool.examples,
  };
}

export function fullCatalog(): CatalogEntry[] {
  return [...REGISTRY.values()].map(toCatalogEntry);
}
