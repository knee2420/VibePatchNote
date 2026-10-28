<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-selecting-fields-before-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go Before
package main

import (
	"context"
	"fmt"

	"github.com/langchain-ai/langsmith-go"
)

ctx := context.Background()
client := langsmith.NewClient()

sessions, err := client.Sessions.List(ctx, langsmith.SessionListParams{
	Name:  langsmith.F("default"),
	Limit: langsmith.F(int64(1)),
})
project := sessions.Items[0]

// returns a default set of fields; no explicit selection needed
runs, err := client.Runs.Query(ctx, langsmith.RunQueryParams{
	Session: langsmith.F([]string{project.ID}),
})
for _, run := range runs.Runs {
	fmt.Println(run.ID, run.Name, run.RunType, run.Status, run.StartTime, run.Inputs, run.Error)
}
```
