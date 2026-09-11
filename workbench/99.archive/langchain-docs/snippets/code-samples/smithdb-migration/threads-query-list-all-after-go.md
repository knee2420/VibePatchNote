<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/threads-query-list-all-after-go.mdx -->
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

	sessions, err := client.Sessions.List(ctx, langsmith.SessionListParams{
		Name:  langsmith.F("default"),
		Limit: langsmith.F(int64(1)),
	})
	if err != nil {
		panic(err.Error())
	}
	projectID := sessions.Items[0].ID

	maxStart := time.Now().UTC()
	minStart := maxStart.AddDate(0, -1, 0)

	iter := client.Threads.QueryAutoPaging(ctx, langsmith.ThreadQueryParams{
		ProjectID:    langsmith.F(projectID),
		MinStartTime: langsmith.F(minStart),
		MaxStartTime: langsmith.F(maxStart),
	})
	for iter.Next() {
		thread := iter.Current()
		fmt.Println(thread.ThreadID, thread.Count)
	}
	if err := iter.Err(); err != nil {
		panic(err.Error())
	}
}
```
