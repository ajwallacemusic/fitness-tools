import { describe, expect, test } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { REGISTRY } from "@almostjacked/fitness-tools";
import { buildServer } from "./server.js";

async function connect(): Promise<Client> {
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const server = buildServer();
  await server.connect(serverT);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientT);
  return client;
}

describe("mcp server contract", () => {
  test("advertises every registry tool with object schemas", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    const names = new Set(tools.map((t) => t.name));

    expect(tools.length).toBe(9);
    for (const id of REGISTRY.keys()) expect(names.has(id)).toBe(true);

    const tdee = tools.find((t) => t.name === "tdee")!;
    expect(tdee.description).toContain("TDEE");
    expect((tdee.inputSchema as { type?: string }).type).toBe("object");
    expect((tdee.outputSchema as { type?: string } | undefined)?.type).toBe("object");
  });

  test.each([...REGISTRY.keys()])(
    "%s runs its example input and returns valid structuredContent",
    async (id) => {
      const client = await connect();
      const tool = REGISTRY.get(id)!;
      expect(tool.examples.length).toBeGreaterThan(0);

      const res = await client.callTool({
        name: id,
        arguments: tool.examples[0].input as Record<string, unknown>,
      });

      expect(res.isError).toBeFalsy();
      expect(res.structuredContent).toBeDefined();
      // structuredContent must satisfy the tool's own output schema
      expect(() => tool.output.parse(res.structuredContent)).not.toThrow();
      // text fallback present and parseable
      const text = (res.content as { type: string; text: string }[])[0];
      expect(text.type).toBe("text");
      expect(() => JSON.parse(text.text)).not.toThrow();
    },
  );

  test("omitted defaulted field is filled by the SDK before compute (tdee.methods)", async () => {
    const client = await connect();
    // No `methods` provided → must default to "all" and run multiple methods.
    const res = await client.callTool({
      name: "tdee",
      arguments: {
        sex: "male",
        age: 30,
        height: { value: 180, unit: "cm" },
        weight: { value: 80, unit: "kg" },
        activity: "moderate",
      },
    });

    expect(res.isError).toBeFalsy();
    const sc = res.structuredContent as { results: unknown[] };
    expect(sc.results.length).toBeGreaterThan(1);
  });

  test("explicit unknown method surfaces as a tool error", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "tdee",
      arguments: {
        sex: "male",
        age: 30,
        height: { value: 180, unit: "cm" },
        weight: { value: 80, unit: "kg" },
        activity: "moderate",
        methods: ["bogus"],
      },
    });

    expect(res.isError).toBe(true);
    const text = (res.content as { type: string; text: string }[])[0];
    expect(text.text.toLowerCase()).toContain("bogus");
  });
});
