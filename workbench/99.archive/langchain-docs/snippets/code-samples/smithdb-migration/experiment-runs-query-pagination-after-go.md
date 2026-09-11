<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-pagination-after-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go After
package main

import (
	"context"

	"github.com/langchain-ai/langsmith-go"
)

ctx := context.Background()
client := langsmith.NewClient()
params := langsmith.DatasetExperimentRunQueryParams{
	ExperimentIDs: langsmith.F([]string{experimentID}),
	PageSize:      langsmith.F(int64(1)),
}
var examplesWithRuns []langsmith.DatasetExperimentRunQueryResponse
for {
	page, err := client.Datasets.ExperimentRuns.Query(ctx, datasetID, params)
	examplesWithRuns = append(examplesWithRuns, page.Items...)
	if page.NextCursor == "" || len(examplesWithRuns) >= 100 {
		break
	}
	params.Cursor = langsmith.F(page.NextCursor)
}
```
