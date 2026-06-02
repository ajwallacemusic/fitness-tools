import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAll } from "./tools.js";

/** Build a fully-registered MCP server (no transport attached). */
export function buildServer(): McpServer {
  const server = new McpServer({
    name: "@almostjacked/fitness-tools-mcp",
    version: "0.1.0",
  });
  registerAll(server);
  return server;
}
