<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/public-runs-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```typescript
// Share a trace.
const shareUrl = await client.shareRun(runId);

// Read the shared runs and one specific run.
const runs = await client.listSharedRuns(shareToken);
const [run] = await client.listSharedRuns(shareToken, {
  runIds: [runId],
});

// Check whether the run is shared.
const existingShareUrl = await client.readRunSharedLink(runId);

// Remove public access.
await client.unshareRun(runId);
```
