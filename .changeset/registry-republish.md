---
"@almostjacked/fitness-tools-mcp": patch
---

Re-publish to the MCP registry as 0.3.4. No code changes: version 0.3.3 is unpublishable
there — yesterday's registry run published server.json's prematurely-synced 0.3.3 (npm was
still 0.3.2), the registry later hid the entry with its dangling npm reference, and its
duplicate-version check reads the raw table without a status filter, so 0.3.3 is burned.
The registry-publish workflow now syncs server.json from package.json right before
publishing, so the committed file's version can never drift from the released package again.
