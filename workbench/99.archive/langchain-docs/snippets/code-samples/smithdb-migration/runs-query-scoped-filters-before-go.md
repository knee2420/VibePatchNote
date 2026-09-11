<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-scoped-filters-before-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go Before
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

runs, err := client.Runs.Query(ctx, langsmith.RunQueryParams{
	Session:     langsmith.F([]string{project.ID}),
	Filter:      langsmith.F(`eq(name, "RetrieveDocs")`),
	TraceFilter: langsmith.F(`and(eq(feedback_key, "user_score"), eq(feedback_score, 1))`),
	TreeFilter:  langsmith.F(`eq(name, "ExpandQuery")`),
})
```
