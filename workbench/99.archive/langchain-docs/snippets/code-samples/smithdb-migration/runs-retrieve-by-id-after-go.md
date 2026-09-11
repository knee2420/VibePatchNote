<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-by-id-after-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go After
package main

import (
	"context"
	"time"

	"github.com/langchain-ai/langsmith-go"
)

ctx := context.Background()
client := langsmith.NewClient()

runID := "<run-id>"
startTime := time.Date(2026, 6, 1, 12, 0, 0, 0, time.UTC) // Optional, but speeds up retrieval
projectID := "<project-id>"
run, err := client.Runs.GetV2(ctx, runID, langsmith.RunGetV2Params{
	ProjectID: langsmith.F(projectID),
	StartTime: langsmith.F(startTime),
})
```
