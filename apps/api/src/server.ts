import { serve } from "@hono/node-server";
import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? 8080);
serve({ fetch: buildApp().fetch, port }, (info) => {
  console.log(`fitness-tools-api listening on :${info.port}`);
});
