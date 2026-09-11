<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-not-found-before-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go Before
package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/langchain-ai/langsmith-go"
)

ctx := context.Background()
client := langsmith.NewClient()

runID := "<run-id>"
_, err := client.Runs.Get(ctx, runID, langsmith.RunGetParams{})
if err != nil {
	var apiErr *langsmith.Error
	if errors.As(err, &apiErr) && apiErr.StatusCode == 404 {
		fmt.Printf("Run %s not found\n", runID)
	} else {
		panic(err)
	}
}
```
