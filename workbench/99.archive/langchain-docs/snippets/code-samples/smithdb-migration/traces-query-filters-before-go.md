<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-query-filters-before-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go Before
package main

import (
	"context"
	"fmt"

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

	// v1 has no root-run-only filter concept — IsRoot plus a regular filter is
	// the closest equivalent, still scanning every run to match.
	runs, err := client.Runs.Query(ctx, langsmith.RunQueryParams{
		Session: langsmith.F([]string{projectID}),
		IsRoot:  langsmith.F(true),
		Filter:  langsmith.F(`eq(status, "error")`),
		Limit:   langsmith.F(int64(5)),
	})
	if err != nil {
		panic(err.Error())
	}
	for _, run := range runs.Runs {
		fmt.Println(run.TraceID)
	}
}
```
