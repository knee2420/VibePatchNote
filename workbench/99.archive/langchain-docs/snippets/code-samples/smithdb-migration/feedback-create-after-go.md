<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/feedback-create-after-go.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```go After
package main

import (
	"context"

	"github.com/langchain-ai/langsmith-go"
	"github.com/langchain-ai/langsmith-go/shared"
)

ctx := context.Background()
client := langsmith.NewClient()

runID := "<run-id>"
sessionID := "<session-id>"
var err error
_, err = client.Feedback.New(ctx, langsmith.FeedbackNewParams{
	FeedbackCreateSchema: langsmith.FeedbackCreateSchemaParam{
		RunID:     langsmith.F(runID),
		Key:       langsmith.F("user_feedback"),
		Score:     langsmith.F[langsmith.FeedbackCreateSchemaScoreUnionParam](shared.UnionFloat(1.0)),
		SessionID: langsmith.F(sessionID),
	},
})
```
