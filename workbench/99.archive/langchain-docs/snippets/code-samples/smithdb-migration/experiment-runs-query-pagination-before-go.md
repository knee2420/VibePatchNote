<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-pagination-before-go.mdx -->
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
var examplesWithRuns []langsmith.ExampleWithRunsCh
offset := int64(0)
limit := int64(20)
for {
	page, err := client.Datasets.Runs.Query(ctx, datasetID, langsmith.DatasetRunQueryParams{
		SessionIDs: langsmith.F([]string{experimentID}),
		Limit:      langsmith.F(limit),
		Offset:     langsmith.F(offset),
	})
	examplesWithRuns = append(examplesWithRuns, *page...)
	if len(examplesWithRuns) >= 100 || int64(len(*page)) < limit {
		break
	}
	offset += limit
}
```
