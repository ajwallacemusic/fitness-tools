import { expect, test } from "vitest";
import { buildApp } from "./app.js";

test("GET /healthz returns ok", async () => {
  const res = await buildApp().request("/healthz");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
