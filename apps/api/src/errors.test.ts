import { expect, test } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import { DomainError } from "@fitness-tools/core";
import { installErrorHandler, envelope } from "./errors.js";

function appThatThrows(err: unknown): Hono {
  const app = new Hono();
  installErrorHandler(app);
  app.get("/boom", () => {
    throw err;
  });
  return app;
}

test("DomainError → 400 domain_error", async () => {
  const res = await appThatThrows(new DomainError("nope")).request("/boom");
  expect(res.status).toBe(400);
  expect((await res.json()).error.type).toBe("domain_error");
});

test("ZodError → 422 validation_error", async () => {
  const zerr = z.object({ x: z.number() }).safeParse({ x: "no" });
  const res = await appThatThrows((zerr as { error: unknown }).error).request("/boom");
  expect(res.status).toBe(422);
  expect((await res.json()).error.type).toBe("validation_error");
});

test("unhandled → 500 internal_error", async () => {
  const res = await appThatThrows(new RuntimeErrorLike()).request("/boom");
  expect(res.status).toBe(500);
  expect((await res.json()).error.type).toBe("internal_error");
});

class RuntimeErrorLike extends Error {}

test("envelope shape", () => {
  expect(envelope("not_found", "x")).toEqual({
    error: { type: "not_found", message: "x", details: null },
  });
});
