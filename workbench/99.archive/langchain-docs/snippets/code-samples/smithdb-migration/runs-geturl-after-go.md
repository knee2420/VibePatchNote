<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-geturl-after-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go After
package main

import (
	"context"
	"fmt"
	"time"

	"github.com/langchain-ai/langsmith-go"
)

func main() {
	ctx := context.Background()
	client := langsmith.NewClient()

	runID := "<run-id>"
	run, err := client.Runs.Get(ctx, runID, langsmith.RunGetParams{})
	if err != nil {
		panic(err.Error())
	}

	response, err := client.Runs.GetURL(ctx, run.ID, langsmith.RunGetURLParams{
		ProjectID: langsmith.F(run.SessionID),
		TraceID:   langsmith.F(run.TraceID),
		StartTime: langsmith.F(run.StartTime.Format(time.RFC3339)), // Optional, but speeds up retrieval
	})
	if err != nil {
		panic(err.Error())
	}
	fmt.Println(response.URL)
}
```
