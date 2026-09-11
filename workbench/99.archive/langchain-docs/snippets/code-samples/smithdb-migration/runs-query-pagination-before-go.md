<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-pagination-before-go.mdx -->
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

runs := []langsmith.RunSchema{}
iter := client.Runs.QueryAutoPaging(ctx, langsmith.RunQueryParams{
	Session: langsmith.F([]string{project.ID}),
})
for iter.Next() {
	runs = append(runs, iter.Current())
	if len(runs) >= 150 {
		break
	}
}
```
