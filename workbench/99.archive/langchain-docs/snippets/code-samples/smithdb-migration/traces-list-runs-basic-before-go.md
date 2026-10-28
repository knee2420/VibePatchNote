<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-list-runs-basic-before-go.mdx -->
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
	traceID := "<trace-id>"

	runs, err := client.Runs.Query(ctx, langsmith.RunQueryParams{
		Session: langsmith.F([]string{projectID}),
		Trace:   langsmith.F(traceID),
	})
	if err != nil {
		panic(err.Error())
	}
	for _, run := range runs.Runs {
		fmt.Println(run.Name, run.RunType, run.Status)
	}
}
```
