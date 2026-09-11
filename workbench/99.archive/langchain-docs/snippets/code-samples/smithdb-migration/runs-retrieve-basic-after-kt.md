<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-basic-after-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin After
import java.time.OffsetDateTime

import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.runs.RunRetrieveV2Params
import com.langchain.smith.models.sessions.SessionListParams

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()

val project = client.sessions().list(
    SessionListParams.builder().name("default").limit(1L).build()
).items().first()

var runId = "<run-id>"
var startTime = "<run-start-time-rfc3339>"
val run = client.runs().retrieveV2(
    runId,
    RunRetrieveV2Params.builder()
        .projectId(project.id())
        .startTime(OffsetDateTime.parse(startTime))
        .addSelect(RunRetrieveV2Params.Select.NAME)
        .addSelect(RunRetrieveV2Params.Select.STATUS)
        .addSelect(RunRetrieveV2Params.Select.TOTAL_TOKENS)
        .build()
)
println("${run.name()} ${run.status()} ${run.totalTokens()}")
```
