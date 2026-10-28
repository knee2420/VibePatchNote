<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-add-to-queue-before-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go Before
package main

import (
	"context"
	"time"

	"github.com/langchain-ai/langsmith-go"
)

ctx := context.Background()
client := langsmith.NewClient()

queueID := "<queue-id>"
projectID := "<project-id>"
found, err := client.Runs.Query(ctx, langsmith.RunQueryParams{
	Session: langsmith.F([]string{projectID}),
	Limit:   langsmith.F(int64(5)),
})
runIDs := make([]string, len(found.Runs))
for i, run := range found.Runs {
	runIDs[i] = run.ID
}
_, err = client.AnnotationQueues.Runs.New(ctx, queueID, langsmith.AnnotationQueueRunNewParams{
	Body: langsmith.AnnotationQueueRunNewParamsBodyRunsUuidArray(runIDs),
})
```
