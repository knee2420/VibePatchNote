<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-add-to-queue-after-go.mdx -->
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

queueID := "<queue-id>"
projectID := "<project-id>"
found, err := client.Runs.Query(ctx, langsmith.RunQueryParams{
	Session: langsmith.F([]string{projectID}),
	Limit:   langsmith.F(int64(5)),
})
body := make([]langsmith.AnnotationQueueRunNewByKeyParamsBody, len(found.Runs))
for i, run := range found.Runs {
	body[i] = langsmith.AnnotationQueueRunNewByKeyParamsBody{
		RunID:     langsmith.F(run.ID),
		SessionID: langsmith.F(run.SessionID),
		StartTime: langsmith.F(run.StartTime),
	}
}
_, err = client.AnnotationQueues.Runs.NewByKey(ctx, queueID, langsmith.AnnotationQueueRunNewByKeyParams{
	Body: body,
})
```
