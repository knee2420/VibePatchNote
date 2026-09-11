<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-basic-before-go.mdx -->
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

runID := "<run-id>"
run, err := client.Runs.Get(ctx, runID, langsmith.RunGetParams{})
fmt.Println(run.Name, run.Status, run.TotalTokens)
```
