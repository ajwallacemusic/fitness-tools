import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodObject, ZodRawShape } from "zod";
import { REGISTRY, DomainError, type Tool } from "@almostjacked/fitness-tools";

/** Register every tool in the core REGISTRY as an MCP tool on `server`. */
export function registerAll(server: McpServer): void {
  for (const tool of REGISTRY.values()) registerTool(server, tool);
}

function registerTool(server: McpServer, tool: Tool): void {
  const inputShape = (tool.input as ZodObject<ZodRawShape>).shape;
  const outputShape = (tool.output as ZodObject<ZodRawShape>).shape;

  server.registerTool(
    tool.id,
    {
      title: tool.name,
      description: tool.description,
      inputSchema: inputShape,
      outputSchema: outputShape,
    },
    async (args: unknown) => {
      try {
        const result = tool.compute(args) as Record<string, unknown>;
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          structuredContent: result,
        };
      } catch (err) {
        // Input ZodErrors are handled upstream by the SDK (it validates args
        // against inputSchema before calling this handler); only DomainError
        // from compute() reaches here.
        if (err instanceof DomainError) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: err.message }],
          };
        }
        throw err;
      }
    },
  );
}
