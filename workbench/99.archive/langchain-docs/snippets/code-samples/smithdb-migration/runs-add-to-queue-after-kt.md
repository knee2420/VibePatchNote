<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-add-to-queue-after-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin After
import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.annotationqueues.AnnotationQueueAnnotationQueuesParams
import com.langchain.smith.models.annotationqueues.runs.RunCreateByKeyParams
import com.langchain.smith.models.runs.RunQueryParams
import com.langchain.smith.models.sessions.SessionListParams

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()

var queueId = "<queue-id>"
var projectId = "<project-id>"
val runs = client.runs().query(
    RunQueryParams.builder().session(listOf(projectId)).limit(5L).build()
).items()

val params = RunCreateByKeyParams.builder().queueId(queueId)
for (run in runs) {
    params.addBody(
        RunCreateByKeyParams.Body.builder()
            .runId(run.id())
            .sessionId(run.sessionId())
            .startTime(run.startTime().get())
            .build()
    )
}
client.annotationQueues().runs().createByKey(params.build())
```
