import type { Hono } from "hono";
import { ZodError } from "zod";
import { DomainError } from "@fitness-tools/core";

export function envelope(type: string, message: string, details: unknown = null) {
  return { error: { type, message, details } };
}

export function installErrorHandler(app: Hono): void {
  app.onError((err, c) => {
    if (err instanceof ZodError) {
      return c.json(envelope("validation_error", "Input validation failed", err.issues), 422);
    }
    if (err instanceof DomainError) {
      return c.json(envelope("domain_error", err.message), 400);
    }
    return c.json(envelope("internal_error", "An unexpected error occurred"), 500);
  });
}
