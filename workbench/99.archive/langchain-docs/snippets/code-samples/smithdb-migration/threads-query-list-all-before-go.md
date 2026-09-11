<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/threads-query-list-all-before-go.mdx -->
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

	runs, err := client.Runs.Query(ctx, langsmith.RunQueryParams{
		Session: langsmith.F([]string{projectID}),
		IsRoot:  langsmith.F(true),
	})
	if err != nil {
		panic(err.Error())
	}

	threads := map[string]int{}
	for _, run := range runs.Runs {
		metadata, ok := run.Extra["metadata"].(map[string]interface{})
		if !ok {
			continue
		}
		threadID, ok := metadata["thread_id"].(string)
		if ok {
			threads[threadID]++
		}
	}
	for threadID, count := range threads {
		fmt.Println(threadID, count)
	}
}
```
