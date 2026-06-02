import { zodToJsonSchema } from "zod-to-json-schema";
import { REGISTRY, type Tool } from "@fitness-tools/core";

// Read at runtime when launched via pnpm/npm; harmless fallback otherwise.
const API_VERSION = process.env.npm_package_version ?? "0.1.0";

type JsonObject = Record<string, unknown>;

/** "body-fat" -> "BodyFat", "tdee" -> "Tdee" */
function pascalCase(id: string): string {
  return id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function schemaFor(tool: Tool, which: "input" | "output"): JsonObject {
  // $refStrategy: "none" inlines shared sub-shapes (Mass/Length) so each
  // component is self-contained; target openApi3 emits `nullable` and no $schema.
  return zodToJsonSchema(tool[which], {
    target: "openApi3",
    $refStrategy: "none",
  }) as JsonObject;
}

const ERROR_ENVELOPE: JsonObject = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        type: { type: "string" },
        message: { type: "string" },
        details: {},
      },
      required: ["type", "message"],
    },
  },
  required: ["error"],
};

function errorResponse(description: string): JsonObject {
  return {
    description,
    content: {
      "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
    },
  };
}

function toolPath(tool: Tool): JsonObject {
  const Pascal = pascalCase(tool.id);
  return {
    post: {
      operationId: `run${Pascal}`,
      summary: tool.name,
      description: tool.description,
      tags: [tool.category],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${Pascal}Input` },
            example: tool.examples[0]?.input ?? {},
          },
        },
      },
      responses: {
        "200": {
          description: `${tool.name} result`,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${Pascal}Output` },
            },
          },
        },
        "422": { $ref: "#/components/responses/ValidationError" },
        "400": { $ref: "#/components/responses/DomainError" },
      },
    },
  };
}

export function buildOpenApiDocument(): JsonObject {
  const tools = [...REGISTRY.values()];

  const schemas: JsonObject = { ErrorEnvelope: ERROR_ENVELOPE };
  const paths: JsonObject = {};

  for (const tool of tools) {
    const Pascal = pascalCase(tool.id);
    schemas[`${Pascal}Input`] = schemaFor(tool, "input");
    schemas[`${Pascal}Output`] = schemaFor(tool, "output");
    paths[`/v1/tools/${tool.id}`] = toolPath(tool);
  }

  paths["/v1/tools"] = {
    get: {
      operationId: "listTools",
      summary: "List all tools (machine-readable catalog)",
      tags: ["catalog"],
      responses: {
        "200": {
          description: "Tool catalog",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  };

  paths["/v1/tools/{id}"] = {
    get: {
      operationId: "getTool",
      summary: "Get one tool's catalog entry",
      tags: ["catalog"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        "200": {
          description: "Tool catalog entry",
          content: { "application/json": { schema: { type: "object" } } },
        },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  };

  paths["/healthz"] = {
    get: {
      operationId: "healthz",
      summary: "Liveness probe",
      tags: ["meta"],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { type: "object", properties: { status: { type: "string" } } },
            },
          },
        },
      },
    },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "Fitness Tools API",
      version: API_VERSION,
      description:
        "Reference HTTP server over @fitness-tools/core. Each tool is exposed as " +
        "POST /v1/tools/{id}; the same calculators are usable in-process via the npm package.",
      license: { name: "MIT" },
    },
    paths,
    components: {
      schemas,
      responses: {
        ValidationError: errorResponse("Input failed validation (Zod)."),
        DomainError: errorResponse("Inputs valid but semantically impossible, or a required method's inputs are missing."),
        NotFound: errorResponse("No tool with that id."),
      },
    },
  };
}
