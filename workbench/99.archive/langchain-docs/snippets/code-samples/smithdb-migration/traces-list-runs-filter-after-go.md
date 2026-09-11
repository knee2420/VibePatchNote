<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-list-runs-filter-after-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go After
package main

import (
	"context"
	"time"

	"github.com/langchain-ai/langsmith-go"
)

func main() {
	ctx := context.Background()
	client := langsmith.NewClient()

	sessions, err := client.Sessions.List(ctx, langsmith.SessionListParams{
		Name:  langsmith.F("default"),
		Limit: langsmith.F(int64(1)),
	})
	if err != nil {
		panic(err.Error())
	}
	projectID := sessions.Items[0].ID
	traceID := "<trace-id>"

	_, err = client.Traces.ListRuns(ctx, traceID, langsmith.TraceListRunsParams{
		ProjectID: langsmith.F(projectID),
		Filter:    langsmith.F(`eq(run_type, "llm")`),
		Selects: langsmith.F([]langsmith.TraceListRunsParamsSelect{
			langsmith.TraceListRunsParamsSelectName,
			langsmith.TraceListRunsParamsSelectStatus,
		}),
	})
	if err != nil {
		panic(err.Error())
	}
}
```
