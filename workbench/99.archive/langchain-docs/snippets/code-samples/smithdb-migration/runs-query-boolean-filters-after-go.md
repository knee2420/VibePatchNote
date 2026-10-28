<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-boolean-filters-after-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go After
package main

import (
	"context"

	"github.com/langchain-ai/langsmith-go"
)

ctx := context.Background()
client := langsmith.NewClient()

sessions, err := client.Sessions.List(ctx, langsmith.SessionListParams{
	Name:  langsmith.F("default"),
	Limit: langsmith.F(int64(1)),
})
project := sessions.Items[0]

filterStr := `and(gt(start_time, "2023-07-15T12:34:56Z"), or(neq(status, "error"), and(eq(feedback_key, "Correctness"), eq(feedback_score, 0.0))))`
runs, err := client.Runs.QueryV2(ctx, langsmith.RunQueryV2Params{
	ProjectIDs: langsmith.F([]string{project.ID}),
	Filter:     langsmith.F(filterStr),
})
```
