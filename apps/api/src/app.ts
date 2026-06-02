import { Hono } from "hono";
import { REGISTRY } from "@fitness-tools/core";
import { installErrorHandler, envelope } from "./errors.js";
import { fullCatalog, toCatalogEntry } from "./catalog.js";

export function buildApp(): Hono {
  const app = new Hono();
  installErrorHandler(app);

  app.get("/healthz", (c) => c.json({ status: "ok" }));

  app.get("/v1/tools", (c) => c.json(fullCatalog()));

  app.get("/v1/tools/:id", (c) => {
    const tool = REGISTRY.get(c.req.param("id"));
    if (!tool) return c.json(envelope("not_found", "tool not found"), 404);
    return c.json(toCatalogEntry(tool));
  });

  app.post("/v1/tools/:id", async (c) => {
    const tool = REGISTRY.get(c.req.param("id"));
    if (!tool) return c.json(envelope("not_found", "tool not found"), 404);
    const body = await c.req.json().catch(() => ({}));
    const input = tool.input.parse(body); // ZodError → 422 via onError
    return c.json(tool.compute(input)); // DomainError → 400 via onError
  });

  return app;
}
