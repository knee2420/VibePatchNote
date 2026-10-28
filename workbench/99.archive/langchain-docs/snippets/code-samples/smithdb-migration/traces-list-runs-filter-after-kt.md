<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-list-runs-filter-after-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin After
import java.time.OffsetDateTime

import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.sessions.SessionListParams
import com.langchain.smith.models.traces.TraceListRunsParams
import com.langchain.smith.models.traces.TraceQueryParams

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()

val project = client.sessions().list(
    SessionListParams.builder().name("default").limit(1L).build()
).items().first()

var traceId = "<trace-id>"

client.traces().listRuns(
    traceId,
    TraceListRunsParams.builder()
        .projectId(project.id())
        .filter("eq(run_type, \"llm\")")
        .addSelect(TraceListRunsParams.Select.NAME)
        .addSelect(TraceListRunsParams.Select.STATUS)
        .build()
)
```
