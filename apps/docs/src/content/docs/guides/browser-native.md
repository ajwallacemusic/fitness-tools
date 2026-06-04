---
title: Browser-native
description: Run the calculators client-side with no bundler.
sidebar:
  order: 5
---

The package is isomorphic — no Node-only APIs — so it runs directly in a browser:

```html
<script type="module">
  import { mifflinBmr } from "https://esm.sh/@almostjacked/fitness-tools";
  console.log(mifflinBmr("female", 65, 168, 28));
</script>
```

The registry works client-side too, so a form can validate input and compute results
entirely in the browser, with no server.
