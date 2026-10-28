<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/threads-list-traces-basic-after-go.mdx -->
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
	threadID := "<thread-id>"

	iter := client.Threads.ListTracesAutoPaging(ctx, threadID, langsmith.ThreadListTracesParams{
		ProjectID: langsmith.F(projectID),
		Selects:   langsmith.F([]langsmith.ThreadListTracesParamsSelect{langsmith.ThreadListTracesParamsSelectTraceID, langsmith.ThreadListTracesParamsSelectStartTime}),
	})
	for iter.Next() {
		trace := iter.Current()
		fmt.Println(trace.TraceID, trace.StartTime)
	}
	if err := iter.Err(); err != nil {
		panic(err.Error())
	}
}
```
