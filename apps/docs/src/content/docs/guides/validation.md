---
title: Validation & schemas
description: Runtime validation and self-describing schemas, from one Zod definition.
sidebar:
  order: 4
---

Every tool carries a Zod schema, so one definition gives you runtime validation, static
types, and a JSON-Schema description. TypeScript can't catch a negative age at a form
boundary; the schema can:

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const tdee = REGISTRY.get("tdee")!;
const r = tdee.input.safeParse({ sex: "male", age: -5 /* … */ });
if (!r.success) {
  // r.error.issues → per-field errors you can render in a form
}
```

The same schemas are what generate the [HTTP API](/fitness-tools/api/) catalog and OpenAPI
spec — no hand-written API docs.
