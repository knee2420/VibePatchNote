<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-sort-after-go.mdx -->
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
page, err := client.Datasets.ExperimentRuns.Query(ctx, datasetID, langsmith.DatasetExperimentRunQueryParams{
	ExperimentIDs: langsmith.F([]string{experimentID}),
	Sort: langsmith.F(langsmith.DatasetExperimentRunQueryParamsSort{
		By:    langsmith.F("feedback.correctness"),
		Order: langsmith.F("ASC"),
	}),
})
```
