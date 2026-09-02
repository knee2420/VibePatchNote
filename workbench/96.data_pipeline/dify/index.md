---
type: index
title: "Dify (Core Engine Data Pipeline)"
description: "Dify 프로젝트의 백엔드 핵심 엔진(LLM 런타임 및 워크플로우 캔버스)에 대한 아키텍처 정밀 타격 파이프라인"
resource: "../../99.archive/dify/"
timestamp: "2026-09-02"
---

원문 출처: [github/langgenius/dify](https://github.com/langgenius/dify) · 총 13,600+ 파일 중 핵심 `api/core` 모듈 집중 추출 / 카드 총 518장

# 이 지식 파이프라인은

Dify 저장소는 엔터프라이즈급 LLM 앱 개발 플랫폼으로, 우리가 만들고자 하는 **Document Builder**의 백엔드(하네스 엔진) 설계 시 가장 완벽한 구조적 벤치마크가 됩니다.
이 파이프라인은 전체 저장소가 아닌 프론트엔드와 분리된 **순수 백엔드 LLM 엔진 및 캔버스 워크플로우 파서(`api/core`)**에만 집중하여, 객체 지향적으로 모델을 추상화하고 캔버스 노드를 비동기 그래프로 실행하는 방법에 대한 지식만을 고밀도로 캡슐화했습니다.

이 파이프라인의 설계 사상을 바탕으로, 우리는 실제 LLM 통신 부품만 Antigravity SDK로 교체하는 하이브리드 백엔드 아키텍처를 구축할 수 있습니다.

# 지도

```
dify/
└── api/
    └── core/               [백엔드 핵심 코어 허브]       카드 518장
    ├── agent/          [agent 모듈]       카드 9장
    ├── agent/output_parser/          [output_parser 모듈]       카드 1장
    ├── agent/prompt/          [prompt 모듈]       카드 1장
    ├── agent/strategy/          [strategy 모듈]       카드 2장
    ├── app/app_config/          [app_config 모듈]       카드 2장
    ├── app/app_config/common/sensitive_word_avoidance/          [sensitive_word_avoidance 모듈]       카드 1장
    ├── app/app_config/easy_ui_based_app/agent/          [agent 모듈]       카드 1장
    ├── app/app_config/easy_ui_based_app/dataset/          [dataset 모듈]       카드 1장
    ├── app/app_config/easy_ui_based_app/model_config/          [model_config 모듈]       카드 2장
    ├── app/app_config/easy_ui_based_app/prompt_template/          [prompt_template 모듈]       카드 1장
    ├── app/app_config/easy_ui_based_app/variables/          [variables 모듈]       카드 1장
    ├── app/app_config/features/file_upload/          [file_upload 모듈]       카드 1장
    ├── app/app_config/features/more_like_this/          [more_like_this 모듈]       카드 1장
    ├── app/app_config/features/opening_statement/          [opening_statement 모듈]       카드 1장
    ├── app/app_config/features/retrieval_resource/          [retrieval_resource 모듈]       카드 1장
    ├── app/app_config/features/speech_to_text/          [speech_to_text 모듈]       카드 1장
    ├── app/app_config/features/suggested_questions_after_answer/          [suggested_questions_after_answer 모듈]       카드 1장
    ├── app/app_config/features/text_to_speech/          [text_to_speech 모듈]       카드 1장
    ├── app/app_config/workflow_ui_based_app/variables/          [variables 모듈]       카드 1장
    ├── app/apps/          [apps 모듈]       카드 12장
    ├── app/apps/advanced_chat/          [advanced_chat 모듈]       카드 5장
    ├── app/apps/agent_app/          [agent_app 모듈]       카드 9장
    ├── app/apps/agent_chat/          [agent_chat 모듈]       카드 4장
    ├── app/apps/chat/          [chat 모듈]       카드 4장
    ├── app/apps/common/          [common 모듈]       카드 2장
    ├── app/apps/completion/          [completion 모듈]       카드 4장
    ├── app/apps/pipeline/          [pipeline 모듈]       카드 5장
    ├── app/apps/workflow/          [workflow 모듈]       카드 10장
    ├── app/entities/          [entities 모듈]       카드 5장
    ├── app/features/annotation_reply/          [annotation_reply 모듈]       카드 1장
    ├── app/features/hosting_moderation/          [hosting_moderation 모듈]       카드 1장
    ├── app/features/rate_limiting/          [rate_limiting 모듈]       카드 1장
    ├── app/file_access/          [file_access 모듈]       카드 3장
    ├── app/layers/          [layers 모듈]       카드 5장
    ├── app/llm/          [llm 모듈]       카드 2장
    ├── app/task_pipeline/          [task_pipeline 모듈]       카드 5장
    ├── app/workflow/          [workflow 모듈]       카드 2장
    ├── app/workflow/layers/          [layers 모듈]       카드 2장
    ├── base/tts/          [tts 모듈]       카드 2장
    ├── callback_handler/          [callback_handler 모듈]       카드 3장
    ├── datasource/          [datasource 모듈]       카드 3장
    ├── datasource/__base/          [__base 모듈]       카드 3장
    ├── datasource/entities/          [entities 모듈]       카드 3장
    ├── datasource/local_file/          [local_file 모듈]       카드 2장
    ├── datasource/online_document/          [online_document 모듈]       카드 2장
    ├── datasource/online_drive/          [online_drive 모듈]       카드 2장
    ├── datasource/utils/          [utils 모듈]       카드 1장
    ├── datasource/website_crawl/          [website_crawl 모듈]       카드 2장
    ├── db/          [db 모듈]       카드 1장
    ├── entities/          [entities 모듈]       카드 11장
    ├── errors/          [errors 모듈]       카드 1장
    ├── extension/          [extension 모듈]       카드 3장
    ├── external_data_tool/          [external_data_tool 모듈]       카드 3장
    ├── external_data_tool/api/          [api 모듈]       카드 1장
    ├── file/          [file 모듈]       카드 1장
    ├── helper/          [helper 모듈]       카드 17장
    ├── helper/code_executor/          [code_executor 모듈]       카드 3장
    ├── helper/code_executor/javascript/          [javascript 모듈]       카드 2장
    ├── helper/code_executor/jinja2/          [jinja2 모듈]       카드 2장
    ├── helper/code_executor/python3/          [python3 모듈]       카드 2장
    ├── llm_generator/          [llm_generator 모듈]       카드 3장
    ├── llm_generator/output_parser/          [output_parser 모듈]       카드 4장
    ├── logging/          [logging 모듈]       카드 3장
    ├── mcp/          [mcp 모듈]       카드 6장
    ├── mcp/auth/          [auth 모듈]       카드 1장
    ├── mcp/client/          [client 모듈]       카드 2장
    ├── mcp/server/          [server 모듈]       카드 1장
    ├── mcp/session/          [session 모듈]       카드 2장
    ├── memory/          [memory 모듈]       카드 1장
    ├── moderation/          [moderation 모듈]       카드 4장
    ├── moderation/api/          [api 모듈]       카드 1장
    ├── moderation/keywords/          [keywords 모듈]       카드 1장
    ├── moderation/openai_moderation/          [openai_moderation 모듈]       카드 1장
    ├── ops/          [ops 모듈]       카드 4장
    ├── ops/entities/          [entities 모듈]       카드 2장
    ├── ops/unified_trace/          [unified_trace 모듈]       카드 6장
    ├── plugin/          [plugin 모듈]       카드 2장
    ├── plugin/backwards_invocation/          [backwards_invocation 모듈]       카드 6장
    ├── plugin/endpoint/          [endpoint 모듈]       카드 1장
    ├── plugin/entities/          [entities 모듈]       카드 9장
    ├── plugin/impl/          [impl 모듈]       카드 15장
    ├── plugin/utils/          [utils 모듈]       카드 3장
    ├── prompt/          [prompt 모듈]       카드 4장
    ├── prompt/entities/          [entities 모듈]       카드 1장
    ├── prompt/prompt_templates/          [prompt_templates 모듈]       카드 1장
    ├── prompt/utils/          [utils 모듈]       카드 4장
    ├── rag/cleaner/          [cleaner 모듈]       카드 2장
    ├── rag/data_post_processor/          [data_post_processor 모듈]       카드 2장
    ├── rag/datasource/          [datasource 모듈]       카드 1장
    ├── rag/datasource/keyword/          [keyword 모듈]       카드 3장
    ├── rag/datasource/keyword/jieba/          [jieba 모듈]       카드 3장
    ├── rag/datasource/vdb/          [vdb 모듈]       카드 6장
    ├── rag/docstore/          [docstore 모듈]       카드 1장
    ├── rag/embedding/          [embedding 모듈]       카드 4장
    ├── rag/entities/          [entities 모듈]       카드 7장
    ├── rag/extractor/          [extractor 모듈]       카드 12장
    ├── rag/extractor/blob/          [blob 모듈]       카드 1장
    ├── rag/extractor/entity/          [entity 모듈]       카드 2장
    ├── rag/extractor/firecrawl/          [firecrawl 모듈]       카드 2장
    ├── rag/extractor/unstructured/          [unstructured 모듈]       카드 8장
    ├── rag/extractor/watercrawl/          [watercrawl 모듈]       카드 4장
    ├── rag/index_processor/          [index_processor 모듈]       카드 3장
    ├── rag/index_processor/constant/          [constant 모듈]       카드 4장
    ├── rag/index_processor/processor/          [processor 모듈]       카드 3장
    ├── rag/models/          [models 모듈]       카드 1장
    ├── rag/pipeline/          [pipeline 모듈]       카드 1장
    ├── rag/rerank/          [rerank 모듈]       카드 5장
    ├── rag/rerank/entity/          [entity 모듈]       카드 1장
    ├── rag/retrieval/          [retrieval 모듈]       카드 3장
    ├── rag/retrieval/output_parser/          [output_parser 모듈]       카드 2장
    ├── rag/retrieval/router/          [router 모듈]       카드 2장
    ├── rag/splitter/          [splitter 모듈]       카드 2장
    ├── rag/summary_index/          [summary_index 모듈]       카드 1장
    ├── rbac/          [rbac 모듈]       카드 1장
    ├── repositories/          [repositories 모듈]       카드 6장
    ├── schemas/          [schemas 모듈]       카드 3장
    ├── telemetry/          [telemetry 모듈]       카드 2장
    ├── tools/          [tools 모듈]       카드 6장
    ├── tools/__base/          [__base 모듈]       카드 3장
    ├── tools/builtin_tool/          [builtin_tool 모듈]       카드 2장
    ├── tools/builtin_tool/providers/          [providers 모듈]       카드 1장
    ├── tools/builtin_tool/providers/audio/          [audio 모듈]       카드 1장
    ├── tools/builtin_tool/providers/audio/tools/          [tools 모듈]       카드 2장
    ├── tools/builtin_tool/providers/code/          [code 모듈]       카드 1장
    ├── tools/builtin_tool/providers/code/tools/          [tools 모듈]       카드 1장
    ├── tools/builtin_tool/providers/time/          [time 모듈]       카드 1장
    ├── tools/builtin_tool/providers/time/tools/          [tools 모듈]       카드 5장
    ├── tools/builtin_tool/providers/webscraper/          [webscraper 모듈]       카드 1장
    ├── tools/builtin_tool/providers/webscraper/tools/          [tools 모듈]       카드 1장
    ├── tools/custom_tool/          [custom_tool 모듈]       카드 2장
    ├── tools/entities/          [entities 모듈]       카드 6장
    ├── tools/mcp_tool/          [mcp_tool 모듈]       카드 2장
    ├── tools/plugin_tool/          [plugin_tool 모듈]       카드 2장
    ├── tools/utils/          [utils 모듈]       카드 12장
    ├── tools/utils/dataset_retriever/          [dataset_retriever 모듈]       카드 3장
    ├── tools/workflow_as_tool/          [workflow_as_tool 모듈]       카드 2장
    ├── trigger/          [trigger 모듈]       카드 4장
    ├── trigger/debug/          [debug 모듈]       카드 3장
    ├── trigger/entities/          [entities 모듈]       카드 2장
    ├── trigger/utils/          [utils 모듈]       카드 3장
    ├── workflow/          [workflow 모듈]       카드 17장
    ├── workflow/generator/          [generator 모듈]       카드 3장
    ├── workflow/generator/prompts/          [prompts 모듈]       카드 4장
    ├── workflow/nodes/agent/          [agent 모듈]       카드 8장
    ├── workflow/nodes/agent_v2/          [agent_v2 모듈]       카드 17장
    ├── workflow/nodes/datasource/          [datasource 모듈]       카드 4장
    ├── workflow/nodes/human_input/          [human_input 모듈]       카드 7장
    ├── workflow/nodes/knowledge_index/          [knowledge_index 모듈]       카드 4장
    ├── workflow/nodes/knowledge_retrieval/          [knowledge_retrieval 모듈]       카드 5장
    ├── workflow/nodes/trigger_plugin/          [trigger_plugin 모듈]       카드 3장
    ├── workflow/nodes/trigger_schedule/          [trigger_schedule 모듈]       카드 3장
    ├── workflow/nodes/trigger_webhook/          [trigger_webhook 모듈]       카드 3장

원문: ../../99.archive/dify/
```

# 전체 카드

## api/core
- [C-credit_usage.md](api/core/C-credit_usage.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-hosting_configuration.md](api/core/C-hosting_configuration.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-indexing_runner.md](api/core/C-indexing_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model_context.md](api/core/C-model_context.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model_manager.md](api/core/C-model_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider_manager.md](api/core/C-provider_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/agent
- [C-base_agent_runner.md](api/core/agent/C-base_agent_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-cot_agent_runner.md](api/core/agent/C-cot_agent_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-cot_chat_agent_runner.md](api/core/agent/C-cot_chat_agent_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-cot_completion_agent_runner.md](api/core/agent/C-cot_completion_agent_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-entities.md](api/core/agent/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-errors.md](api/core/agent/C-errors.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-fc_agent_runner.md](api/core/agent/C-fc_agent_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-plugin_entities.md](api/core/agent/C-plugin_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-publish_visibility.md](api/core/agent/C-publish_visibility.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/agent/output_parser
- [C-cot_output_parser.md](api/core/agent/output_parser/C-cot_output_parser.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/agent/prompt
- [C-template.md](api/core/agent/prompt/C-template.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/agent/strategy
- [C-base.md](api/core/agent/strategy/C-base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-plugin.md](api/core/agent/strategy/C-plugin.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config
- [C-base_app_config_manager.md](api/core/app/app_config/C-base_app_config_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-entities.md](api/core/app/app_config/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/common/sensitive_word_avoidance
- [C-manager.md](api/core/app/app_config/common/sensitive_word_avoidance/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/easy_ui_based_app/agent
- [C-manager.md](api/core/app/app_config/easy_ui_based_app/agent/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/easy_ui_based_app/dataset
- [C-manager.md](api/core/app/app_config/easy_ui_based_app/dataset/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/easy_ui_based_app/model_config
- [C-converter.md](api/core/app/app_config/easy_ui_based_app/model_config/C-converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-manager.md](api/core/app/app_config/easy_ui_based_app/model_config/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/easy_ui_based_app/prompt_template
- [C-manager.md](api/core/app/app_config/easy_ui_based_app/prompt_template/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/easy_ui_based_app/variables
- [C-manager.md](api/core/app/app_config/easy_ui_based_app/variables/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/features/file_upload
- [C-manager.md](api/core/app/app_config/features/file_upload/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/features/more_like_this
- [C-manager.md](api/core/app/app_config/features/more_like_this/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/features/opening_statement
- [C-manager.md](api/core/app/app_config/features/opening_statement/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/features/retrieval_resource
- [C-manager.md](api/core/app/app_config/features/retrieval_resource/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/features/speech_to_text
- [C-manager.md](api/core/app/app_config/features/speech_to_text/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/features/suggested_questions_after_answer
- [C-manager.md](api/core/app/app_config/features/suggested_questions_after_answer/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/features/text_to_speech
- [C-manager.md](api/core/app/app_config/features/text_to_speech/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/app_config/workflow_ui_based_app/variables
- [C-manager.md](api/core/app/app_config/workflow_ui_based_app/variables/C-manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps
- [C-base_app_generate_response_converter.md](api/core/app/apps/C-base_app_generate_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-base_app_generator.md](api/core/app/apps/C-base_app_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-base_app_queue_manager.md](api/core/app/apps/C-base_app_queue_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-base_app_runner.md](api/core/app/apps/C-base_app_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-draft_variable_saver.md](api/core/app/apps/C-draft_variable_saver.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/app/apps/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-execution_coordinator.md](api/core/app/apps/C-execution_coordinator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-message_based_app_generator.md](api/core/app/apps/C-message_based_app_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-message_based_app_queue_manager.md](api/core/app/apps/C-message_based_app_queue_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-message_generator.md](api/core/app/apps/C-message_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-streaming_utils.md](api/core/app/apps/C-streaming_utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-workflow_app_runner.md](api/core/app/apps/C-workflow_app_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps/advanced_chat
- [C-app_config_manager.md](api/core/app/apps/advanced_chat/C-app_config_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_generator.md](api/core/app/apps/advanced_chat/C-app_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_runner.md](api/core/app/apps/advanced_chat/C-app_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-generate_response_converter.md](api/core/app/apps/advanced_chat/C-generate_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-generate_task_pipeline.md](api/core/app/apps/advanced_chat/C-generate_task_pipeline.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps/agent_app
- [C-app_config_manager.md](api/core/app/apps/agent_app/C-app_config_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_feature_projection.md](api/core/app/apps/agent_app/C-app_feature_projection.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_generator.md](api/core/app/apps/agent_app/C-app_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_runner.md](api/core/app/apps/agent_app/C-app_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_variable_projection.md](api/core/app/apps/agent_app/C-app_variable_projection.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-errors.md](api/core/app/apps/agent_app/C-errors.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-generate_response_converter.md](api/core/app/apps/agent_app/C-generate_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-runtime_request_builder.md](api/core/app/apps/agent_app/C-runtime_request_builder.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-session_store.md](api/core/app/apps/agent_app/C-session_store.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps/agent_chat
- [C-app_config_manager.md](api/core/app/apps/agent_chat/C-app_config_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_generator.md](api/core/app/apps/agent_chat/C-app_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_runner.md](api/core/app/apps/agent_chat/C-app_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-generate_response_converter.md](api/core/app/apps/agent_chat/C-generate_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps/chat
- [C-app_config_manager.md](api/core/app/apps/chat/C-app_config_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_generator.md](api/core/app/apps/chat/C-app_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_runner.md](api/core/app/apps/chat/C-app_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-generate_response_converter.md](api/core/app/apps/chat/C-generate_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps/common
- [C-graph_runtime_state_support.md](api/core/app/apps/common/C-graph_runtime_state_support.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-workflow_response_converter.md](api/core/app/apps/common/C-workflow_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps/completion
- [C-app_config_manager.md](api/core/app/apps/completion/C-app_config_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_generator.md](api/core/app/apps/completion/C-app_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_runner.md](api/core/app/apps/completion/C-app_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-generate_response_converter.md](api/core/app/apps/completion/C-generate_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps/pipeline
- [C-generate_response_converter.md](api/core/app/apps/pipeline/C-generate_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-pipeline_config_manager.md](api/core/app/apps/pipeline/C-pipeline_config_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-pipeline_generator.md](api/core/app/apps/pipeline/C-pipeline_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-pipeline_queue_manager.md](api/core/app/apps/pipeline/C-pipeline_queue_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-pipeline_runner.md](api/core/app/apps/pipeline/C-pipeline_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/apps/workflow
- [C-active_workflow_tasks.md](api/core/app/apps/workflow/C-active_workflow_tasks.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_config_manager.md](api/core/app/apps/workflow/C-app_config_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_generator.md](api/core/app/apps/workflow/C-app_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_queue_manager.md](api/core/app/apps/workflow/C-app_queue_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_runner.md](api/core/app/apps/workflow/C-app_runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-command_channels.md](api/core/app/apps/workflow/C-command_channels.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-errors.md](api/core/app/apps/workflow/C-errors.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-generate_response_converter.md](api/core/app/apps/workflow/C-generate_response_converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-generate_task_pipeline.md](api/core/app/apps/workflow/C-generate_task_pipeline.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-stop_aware_ready_queue.md](api/core/app/apps/workflow/C-stop_aware_ready_queue.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/entities
- [C-agent_strategy.md](api/core/app/entities/C-agent_strategy.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-app_invoke_entities.md](api/core/app/entities/C-app_invoke_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-queue_entities.md](api/core/app/entities/C-queue_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-rag_pipeline_invoke_entities.md](api/core/app/entities/C-rag_pipeline_invoke_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-task_entities.md](api/core/app/entities/C-task_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/features/annotation_reply
- [C-annotation_reply.md](api/core/app/features/annotation_reply/C-annotation_reply.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/features/hosting_moderation
- [C-hosting_moderation.md](api/core/app/features/hosting_moderation/C-hosting_moderation.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/features/rate_limiting
- [C-rate_limit.md](api/core/app/features/rate_limiting/C-rate_limit.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/file_access
- [C-controller.md](api/core/app/file_access/C-controller.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-protocols.md](api/core/app/file_access/C-protocols.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-scope.md](api/core/app/file_access/C-scope.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/layers
- [C-conversation_variable_persist_layer.md](api/core/app/layers/C-conversation_variable_persist_layer.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-pause_state_persist_layer.md](api/core/app/layers/C-pause_state_persist_layer.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-suspend_layer.md](api/core/app/layers/C-suspend_layer.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-timeslice_layer.md](api/core/app/layers/C-timeslice_layer.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-trigger_post_layer.md](api/core/app/layers/C-trigger_post_layer.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/llm
- [C-model_access.md](api/core/app/llm/C-model_access.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-quota.md](api/core/app/llm/C-quota.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/task_pipeline
- [C-based_generate_task_pipeline.md](api/core/app/task_pipeline/C-based_generate_task_pipeline.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-easy_ui_based_generate_task_pipeline.md](api/core/app/task_pipeline/C-easy_ui_based_generate_task_pipeline.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/app/task_pipeline/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-message_cycle_manager.md](api/core/app/task_pipeline/C-message_cycle_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-message_file_utils.md](api/core/app/task_pipeline/C-message_file_utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/workflow
- [C-file_runtime.md](api/core/app/workflow/C-file_runtime.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-retry_history.md](api/core/app/workflow/C-retry_history.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/app/workflow/layers
- [C-observability.md](api/core/app/workflow/layers/C-observability.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-persistence.md](api/core/app/workflow/layers/C-persistence.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/base/tts
- [C-app_generator_tts_publisher.md](api/core/base/tts/C-app_generator_tts_publisher.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-audio_mime.md](api/core/base/tts/C-audio_mime.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/callback_handler
- [C-agent_tool_callback_handler.md](api/core/callback_handler/C-agent_tool_callback_handler.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-index_tool_callback_handler.md](api/core/callback_handler/C-index_tool_callback_handler.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-workflow_tool_callback_handler.md](api/core/callback_handler/C-workflow_tool_callback_handler.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/datasource
- [C-datasource_file_manager.md](api/core/datasource/C-datasource_file_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-datasource_manager.md](api/core/datasource/C-datasource_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-errors.md](api/core/datasource/C-errors.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/datasource/__base
- [C-datasource_plugin.md](api/core/datasource/__base/C-datasource_plugin.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-datasource_provider.md](api/core/datasource/__base/C-datasource_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-datasource_runtime.md](api/core/datasource/__base/C-datasource_runtime.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/datasource/entities
- [C-api_entities.md](api/core/datasource/entities/C-api_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-common_entities.md](api/core/datasource/entities/C-common_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-datasource_entities.md](api/core/datasource/entities/C-datasource_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/datasource/local_file
- [C-local_file_plugin.md](api/core/datasource/local_file/C-local_file_plugin.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-local_file_provider.md](api/core/datasource/local_file/C-local_file_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/datasource/online_document
- [C-online_document_plugin.md](api/core/datasource/online_document/C-online_document_plugin.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-online_document_provider.md](api/core/datasource/online_document/C-online_document_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/datasource/online_drive
- [C-online_drive_plugin.md](api/core/datasource/online_drive/C-online_drive_plugin.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-online_drive_provider.md](api/core/datasource/online_drive/C-online_drive_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/datasource/utils
- [C-message_transformer.md](api/core/datasource/utils/C-message_transformer.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/datasource/website_crawl
- [C-website_crawl_plugin.md](api/core/datasource/website_crawl/C-website_crawl_plugin.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-website_crawl_provider.md](api/core/datasource/website_crawl/C-website_crawl_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/db
- [C-session_factory.md](api/core/db/C-session_factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/entities
- [C-agent_entities.md](api/core/entities/C-agent_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-document_task.md](api/core/entities/C-document_task.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-embedding_type.md](api/core/entities/C-embedding_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-execution_extra_content.md](api/core/entities/C-execution_extra_content.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-knowledge_entities.md](api/core/entities/C-knowledge_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-mcp_provider.md](api/core/entities/C-mcp_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model_entities.md](api/core/entities/C-model_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-parameter_entities.md](api/core/entities/C-parameter_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-plugin_credential_type.md](api/core/entities/C-plugin_credential_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider_configuration.md](api/core/entities/C-provider_configuration.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider_entities.md](api/core/entities/C-provider_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/errors
- [C-error.md](api/core/errors/C-error.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/extension
- [C-api_based_extension_requestor.md](api/core/extension/C-api_based_extension_requestor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-extensible.md](api/core/extension/C-extensible.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-extension.md](api/core/extension/C-extension.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/external_data_tool
- [C-base.md](api/core/external_data_tool/C-base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-external_data_fetch.md](api/core/external_data_tool/C-external_data_fetch.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-factory.md](api/core/external_data_tool/C-factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/external_data_tool/api
- [C-api.md](api/core/external_data_tool/api/C-api.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/file
- [C-remote_fetcher.md](api/core/file/C-remote_fetcher.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/helper
- [C-creators.md](api/core/helper/C-creators.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-credential_utils.md](api/core/helper/C-credential_utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-csv_sanitizer.md](api/core/helper/C-csv_sanitizer.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-download.md](api/core/helper/C-download.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-encrypter.md](api/core/helper/C-encrypter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-http_client_pooling.md](api/core/helper/C-http_client_pooling.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-marketplace.md](api/core/helper/C-marketplace.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model_provider_cache.md](api/core/helper/C-model_provider_cache.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-moderation.md](api/core/helper/C-moderation.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-module_import_helper.md](api/core/helper/C-module_import_helper.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-name_generator.md](api/core/helper/C-name_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-position_helper.md](api/core/helper/C-position_helper.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider_cache.md](api/core/helper/C-provider_cache.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider_encryption.md](api/core/helper/C-provider_encryption.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-ssrf_proxy.md](api/core/helper/C-ssrf_proxy.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_parameter_cache.md](api/core/helper/C-tool_parameter_cache.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-trace_id_helper.md](api/core/helper/C-trace_id_helper.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/helper/code_executor
- [C-code_executor.md](api/core/helper/code_executor/C-code_executor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-code_node_provider.md](api/core/helper/code_executor/C-code_node_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-template_transformer.md](api/core/helper/code_executor/C-template_transformer.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/helper/code_executor/javascript
- [C-javascript_code_provider.md](api/core/helper/code_executor/javascript/C-javascript_code_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-javascript_transformer.md](api/core/helper/code_executor/javascript/C-javascript_transformer.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/helper/code_executor/jinja2
- [C-jinja2_formatter.md](api/core/helper/code_executor/jinja2/C-jinja2_formatter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-jinja2_transformer.md](api/core/helper/code_executor/jinja2/C-jinja2_transformer.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/helper/code_executor/python3
- [C-python3_code_provider.md](api/core/helper/code_executor/python3/C-python3_code_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-python3_transformer.md](api/core/helper/code_executor/python3/C-python3_transformer.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/llm_generator
- [C-entities.md](api/core/llm_generator/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-llm_generator.md](api/core/llm_generator/C-llm_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-prompts.md](api/core/llm_generator/C-prompts.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/llm_generator/output_parser
- [C-errors.md](api/core/llm_generator/output_parser/C-errors.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-rule_config_generator.md](api/core/llm_generator/output_parser/C-rule_config_generator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-structured_output.md](api/core/llm_generator/output_parser/C-structured_output.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-suggested_questions_after_answer.md](api/core/llm_generator/output_parser/C-suggested_questions_after_answer.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/logging
- [C-context.md](api/core/logging/C-context.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-filters.md](api/core/logging/C-filters.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-structured_formatter.md](api/core/logging/C-structured_formatter.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/mcp
- [C-auth_client.md](api/core/mcp/C-auth_client.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-entities.md](api/core/mcp/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-error.md](api/core/mcp/C-error.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-mcp_client.md](api/core/mcp/C-mcp_client.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-types.md](api/core/mcp/C-types.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-utils.md](api/core/mcp/C-utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/mcp/auth
- [C-auth_flow.md](api/core/mcp/auth/C-auth_flow.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/mcp/client
- [C-sse_client.md](api/core/mcp/client/C-sse_client.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-streamable_client.md](api/core/mcp/client/C-streamable_client.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/mcp/server
- [C-streamable_http.md](api/core/mcp/server/C-streamable_http.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/mcp/session
- [C-base_session.md](api/core/mcp/session/C-base_session.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-client_session.md](api/core/mcp/session/C-client_session.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/memory
- [C-token_buffer_memory.md](api/core/memory/C-token_buffer_memory.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/moderation
- [C-base.md](api/core/moderation/C-base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-factory.md](api/core/moderation/C-factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-input_moderation.md](api/core/moderation/C-input_moderation.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-output_moderation.md](api/core/moderation/C-output_moderation.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/moderation/api
- [C-api.md](api/core/moderation/api/C-api.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/moderation/keywords
- [C-keywords.md](api/core/moderation/keywords/C-keywords.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/moderation/openai_moderation
- [C-openai_moderation.md](api/core/moderation/openai_moderation/C-openai_moderation.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/ops
- [C-base_trace_instance.md](api/core/ops/C-base_trace_instance.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exceptions.md](api/core/ops/C-exceptions.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-ops_trace_manager.md](api/core/ops/C-ops_trace_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-utils.md](api/core/ops/C-utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/ops/entities
- [C-config_entity.md](api/core/ops/entities/C-config_entity.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-trace_entity.md](api/core/ops/entities/C-trace_entity.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/ops/unified_trace
- [C-entities.md](api/core/ops/unified_trace/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-hierarchy.md](api/core/ops/unified_trace/C-hierarchy.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-parent_context.md](api/core/ops/unified_trace/C-parent_context.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider.md](api/core/ops/unified_trace/C-provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-registry.md](api/core/ops/unified_trace/C-registry.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-trace_builder.md](api/core/ops/unified_trace/C-trace_builder.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/plugin
- [C-plugin_service.md](api/core/plugin/C-plugin_service.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider_identity.md](api/core/plugin/C-provider_identity.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/plugin/backwards_invocation
- [C-app.md](api/core/plugin/backwards_invocation/C-app.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-base.md](api/core/plugin/backwards_invocation/C-base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-encrypt.md](api/core/plugin/backwards_invocation/C-encrypt.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model.md](api/core/plugin/backwards_invocation/C-model.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-node.md](api/core/plugin/backwards_invocation/C-node.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool.md](api/core/plugin/backwards_invocation/C-tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/plugin/endpoint
- [C-exc.md](api/core/plugin/endpoint/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/plugin/entities
- [C-base.md](api/core/plugin/entities/C-base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-bundle.md](api/core/plugin/entities/C-bundle.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-endpoint.md](api/core/plugin/entities/C-endpoint.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-marketplace.md](api/core/plugin/entities/C-marketplace.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-oauth.md](api/core/plugin/entities/C-oauth.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-parameters.md](api/core/plugin/entities/C-parameters.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-plugin.md](api/core/plugin/entities/C-plugin.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-plugin_daemon.md](api/core/plugin/entities/C-plugin_daemon.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-request.md](api/core/plugin/entities/C-request.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/plugin/impl
- [C-agent.md](api/core/plugin/impl/C-agent.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-asset.md](api/core/plugin/impl/C-asset.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-base.md](api/core/plugin/impl/C-base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-datasource.md](api/core/plugin/impl/C-datasource.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-debugging.md](api/core/plugin/impl/C-debugging.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-dynamic_select.md](api/core/plugin/impl/C-dynamic_select.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-endpoint.md](api/core/plugin/impl/C-endpoint.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/plugin/impl/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model.md](api/core/plugin/impl/C-model.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model_runtime.md](api/core/plugin/impl/C-model_runtime.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model_runtime_factory.md](api/core/plugin/impl/C-model_runtime_factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-oauth.md](api/core/plugin/impl/C-oauth.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-plugin.md](api/core/plugin/impl/C-plugin.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool.md](api/core/plugin/impl/C-tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-trigger.md](api/core/plugin/impl/C-trigger.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/plugin/utils
- [C-chunk_merger.md](api/core/plugin/utils/C-chunk_merger.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-converter.md](api/core/plugin/utils/C-converter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-http_parser.md](api/core/plugin/utils/C-http_parser.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/prompt
- [C-advanced_prompt_transform.md](api/core/prompt/C-advanced_prompt_transform.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-agent_history_prompt_transform.md](api/core/prompt/C-agent_history_prompt_transform.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-prompt_transform.md](api/core/prompt/C-prompt_transform.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-simple_prompt_transform.md](api/core/prompt/C-simple_prompt_transform.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/prompt/entities
- [C-advanced_prompt_entities.md](api/core/prompt/entities/C-advanced_prompt_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/prompt/prompt_templates
- [C-advanced_prompt_templates.md](api/core/prompt/prompt_templates/C-advanced_prompt_templates.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/prompt/utils
- [C-extract_thread_messages.md](api/core/prompt/utils/C-extract_thread_messages.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-get_thread_messages_length.md](api/core/prompt/utils/C-get_thread_messages_length.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-prompt_message_util.md](api/core/prompt/utils/C-prompt_message_util.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-prompt_template_parser.md](api/core/prompt/utils/C-prompt_template_parser.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/cleaner
- [C-clean_processor.md](api/core/rag/cleaner/C-clean_processor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-cleaner_base.md](api/core/rag/cleaner/C-cleaner_base.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/data_post_processor
- [C-data_post_processor.md](api/core/rag/data_post_processor/C-data_post_processor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-reorder.md](api/core/rag/data_post_processor/C-reorder.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/datasource
- [C-retrieval_service.md](api/core/rag/datasource/C-retrieval_service.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/datasource/keyword
- [C-keyword_base.md](api/core/rag/datasource/keyword/C-keyword_base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-keyword_factory.md](api/core/rag/datasource/keyword/C-keyword_factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-keyword_type.md](api/core/rag/datasource/keyword/C-keyword_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/datasource/keyword/jieba
- [C-jieba.md](api/core/rag/datasource/keyword/jieba/C-jieba.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-jieba_keyword_table_handler.md](api/core/rag/datasource/keyword/jieba/C-jieba_keyword_table_handler.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-stopwords.md](api/core/rag/datasource/keyword/jieba/C-stopwords.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/datasource/vdb
- [C-field.md](api/core/rag/datasource/vdb/C-field.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-vector_backend_registry.md](api/core/rag/datasource/vdb/C-vector_backend_registry.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-vector_base.md](api/core/rag/datasource/vdb/C-vector_base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-vector_factory.md](api/core/rag/datasource/vdb/C-vector_factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-vector_integration_test_support.md](api/core/rag/datasource/vdb/C-vector_integration_test_support.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-vector_type.md](api/core/rag/datasource/vdb/C-vector_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/docstore
- [C-dataset_docstore.md](api/core/rag/docstore/C-dataset_docstore.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/embedding
- [C-cached_embedding.md](api/core/rag/embedding/C-cached_embedding.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-embedding_base.md](api/core/rag/embedding/C-embedding_base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-retrieval.md](api/core/rag/embedding/C-retrieval.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-token_counter.md](api/core/rag/embedding/C-token_counter.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/entities
- [C-citation_metadata.md](api/core/rag/entities/C-citation_metadata.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-context_entities.md](api/core/rag/entities/C-context_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-event.md](api/core/rag/entities/C-event.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-index_entities.md](api/core/rag/entities/C-index_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-metadata_entities.md](api/core/rag/entities/C-metadata_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-processing_entities.md](api/core/rag/entities/C-processing_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-retrieval_settings.md](api/core/rag/entities/C-retrieval_settings.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/extractor
- [C-csv_extractor.md](api/core/rag/extractor/C-csv_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-excel_extractor.md](api/core/rag/extractor/C-excel_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-extract_processor.md](api/core/rag/extractor/C-extract_processor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-extractor_base.md](api/core/rag/extractor/C-extractor_base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-helpers.md](api/core/rag/extractor/C-helpers.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-html_extractor.md](api/core/rag/extractor/C-html_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-jina_reader_extractor.md](api/core/rag/extractor/C-jina_reader_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-markdown_extractor.md](api/core/rag/extractor/C-markdown_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-notion_extractor.md](api/core/rag/extractor/C-notion_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-pdf_extractor.md](api/core/rag/extractor/C-pdf_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-text_extractor.md](api/core/rag/extractor/C-text_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-word_extractor.md](api/core/rag/extractor/C-word_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/extractor/blob
- [C-blob.md](api/core/rag/extractor/blob/C-blob.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/extractor/entity
- [C-datasource_type.md](api/core/rag/extractor/entity/C-datasource_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-extract_setting.md](api/core/rag/extractor/entity/C-extract_setting.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/extractor/firecrawl
- [C-firecrawl_app.md](api/core/rag/extractor/firecrawl/C-firecrawl_app.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-firecrawl_web_extractor.md](api/core/rag/extractor/firecrawl/C-firecrawl_web_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/extractor/unstructured
- [C-unstructured_doc_extractor.md](api/core/rag/extractor/unstructured/C-unstructured_doc_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-unstructured_eml_extractor.md](api/core/rag/extractor/unstructured/C-unstructured_eml_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-unstructured_epub_extractor.md](api/core/rag/extractor/unstructured/C-unstructured_epub_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-unstructured_markdown_extractor.md](api/core/rag/extractor/unstructured/C-unstructured_markdown_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-unstructured_msg_extractor.md](api/core/rag/extractor/unstructured/C-unstructured_msg_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-unstructured_ppt_extractor.md](api/core/rag/extractor/unstructured/C-unstructured_ppt_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-unstructured_pptx_extractor.md](api/core/rag/extractor/unstructured/C-unstructured_pptx_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-unstructured_xml_extractor.md](api/core/rag/extractor/unstructured/C-unstructured_xml_extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/extractor/watercrawl
- [C-client.md](api/core/rag/extractor/watercrawl/C-client.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exceptions.md](api/core/rag/extractor/watercrawl/C-exceptions.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-extractor.md](api/core/rag/extractor/watercrawl/C-extractor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider.md](api/core/rag/extractor/watercrawl/C-provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/index_processor
- [C-index_processor.md](api/core/rag/index_processor/C-index_processor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-index_processor_base.md](api/core/rag/index_processor/C-index_processor_base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-index_processor_factory.md](api/core/rag/index_processor/C-index_processor_factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/index_processor/constant
- [C-built_in_field.md](api/core/rag/index_processor/constant/C-built_in_field.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-doc_type.md](api/core/rag/index_processor/constant/C-doc_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-index_type.md](api/core/rag/index_processor/constant/C-index_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-query_type.md](api/core/rag/index_processor/constant/C-query_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/index_processor/processor
- [C-paragraph_index_processor.md](api/core/rag/index_processor/processor/C-paragraph_index_processor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-parent_child_index_processor.md](api/core/rag/index_processor/processor/C-parent_child_index_processor.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-qa_index_processor.md](api/core/rag/index_processor/processor/C-qa_index_processor.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/models
- [C-document.md](api/core/rag/models/C-document.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/pipeline
- [C-queue.md](api/core/rag/pipeline/C-queue.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/rerank
- [C-rerank_base.md](api/core/rag/rerank/C-rerank_base.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-rerank_factory.md](api/core/rag/rerank/C-rerank_factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-rerank_model.md](api/core/rag/rerank/C-rerank_model.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-rerank_type.md](api/core/rag/rerank/C-rerank_type.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-weight_rerank.md](api/core/rag/rerank/C-weight_rerank.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/rerank/entity
- [C-weight.md](api/core/rag/rerank/entity/C-weight.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/retrieval
- [C-dataset_retrieval.md](api/core/rag/retrieval/C-dataset_retrieval.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-retrieval_methods.md](api/core/rag/retrieval/C-retrieval_methods.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-template_prompts.md](api/core/rag/retrieval/C-template_prompts.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/retrieval/output_parser
- [C-react_output.md](api/core/rag/retrieval/output_parser/C-react_output.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-structured_chat.md](api/core/rag/retrieval/output_parser/C-structured_chat.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/retrieval/router
- [C-multi_dataset_function_call_router.md](api/core/rag/retrieval/router/C-multi_dataset_function_call_router.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-multi_dataset_react_route.md](api/core/rag/retrieval/router/C-multi_dataset_react_route.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/splitter
- [C-fixed_text_splitter.md](api/core/rag/splitter/C-fixed_text_splitter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-text_splitter.md](api/core/rag/splitter/C-text_splitter.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rag/summary_index
- [C-summary_index.md](api/core/rag/summary_index/C-summary_index.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/rbac
- [C-entities.md](api/core/rbac/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/repositories
- [C-celery_workflow_execution_repository.md](api/core/repositories/C-celery_workflow_execution_repository.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-celery_workflow_node_execution_repository.md](api/core/repositories/C-celery_workflow_node_execution_repository.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-factory.md](api/core/repositories/C-factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-human_input_repository.md](api/core/repositories/C-human_input_repository.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-sqlalchemy_workflow_execution_repository.md](api/core/repositories/C-sqlalchemy_workflow_execution_repository.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-sqlalchemy_workflow_node_execution_repository.md](api/core/repositories/C-sqlalchemy_workflow_node_execution_repository.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/schemas
- [C-registry.md](api/core/schemas/C-registry.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-resolver.md](api/core/schemas/C-resolver.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-schema_manager.md](api/core/schemas/C-schema_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/telemetry
- [C-events.md](api/core/telemetry/C-events.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-gateway.md](api/core/telemetry/C-gateway.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools
- [C-errors.md](api/core/tools/C-errors.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-signature.md](api/core/tools/C-signature.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_engine.md](api/core/tools/C-tool_engine.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_file_manager.md](api/core/tools/C-tool_file_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_label_manager.md](api/core/tools/C-tool_label_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_manager.md](api/core/tools/C-tool_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/__base
- [C-tool.md](api/core/tools/__base/C-tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_provider.md](api/core/tools/__base/C-tool_provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_runtime.md](api/core/tools/__base/C-tool_runtime.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool
- [C-provider.md](api/core/tools/builtin_tool/C-provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool.md](api/core/tools/builtin_tool/C-tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers
- [C-_positions.md](api/core/tools/builtin_tool/providers/C-_positions.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers/audio
- [C-audio.md](api/core/tools/builtin_tool/providers/audio/C-audio.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers/audio/tools
- [C-asr.md](api/core/tools/builtin_tool/providers/audio/tools/C-asr.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tts.md](api/core/tools/builtin_tool/providers/audio/tools/C-tts.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers/code
- [C-code.md](api/core/tools/builtin_tool/providers/code/C-code.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers/code/tools
- [C-simple_code.md](api/core/tools/builtin_tool/providers/code/tools/C-simple_code.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers/time
- [C-time.md](api/core/tools/builtin_tool/providers/time/C-time.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers/time/tools
- [C-current_time.md](api/core/tools/builtin_tool/providers/time/tools/C-current_time.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-localtime_to_timestamp.md](api/core/tools/builtin_tool/providers/time/tools/C-localtime_to_timestamp.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-timestamp_to_localtime.md](api/core/tools/builtin_tool/providers/time/tools/C-timestamp_to_localtime.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-timezone_conversion.md](api/core/tools/builtin_tool/providers/time/tools/C-timezone_conversion.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-weekday.md](api/core/tools/builtin_tool/providers/time/tools/C-weekday.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers/webscraper
- [C-webscraper.md](api/core/tools/builtin_tool/providers/webscraper/C-webscraper.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/builtin_tool/providers/webscraper/tools
- [C-webscraper.md](api/core/tools/builtin_tool/providers/webscraper/tools/C-webscraper.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/custom_tool
- [C-provider.md](api/core/tools/custom_tool/C-provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool.md](api/core/tools/custom_tool/C-tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/entities
- [C-api_entities.md](api/core/tools/entities/C-api_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-common_entities.md](api/core/tools/entities/C-common_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-constants.md](api/core/tools/entities/C-constants.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_bundle.md](api/core/tools/entities/C-tool_bundle.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_entities.md](api/core/tools/entities/C-tool_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-values.md](api/core/tools/entities/C-values.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/mcp_tool
- [C-provider.md](api/core/tools/mcp_tool/C-provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool.md](api/core/tools/mcp_tool/C-tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/plugin_tool
- [C-provider.md](api/core/tools/plugin_tool/C-provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool.md](api/core/tools/plugin_tool/C-tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/utils
- [C-configuration.md](api/core/tools/utils/C-configuration.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-dataset_retriever_tool.md](api/core/tools/utils/C-dataset_retriever_tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-encryption.md](api/core/tools/utils/C-encryption.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-message_transformer.md](api/core/tools/utils/C-message_transformer.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-model_invocation_utils.md](api/core/tools/utils/C-model_invocation_utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-parser.md](api/core/tools/utils/C-parser.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-system_encryption.md](api/core/tools/utils/C-system_encryption.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-text_processing_utils.md](api/core/tools/utils/C-text_processing_utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-uuid_utils.md](api/core/tools/utils/C-uuid_utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-web_reader_tool.md](api/core/tools/utils/C-web_reader_tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-workflow_configuration_sync.md](api/core/tools/utils/C-workflow_configuration_sync.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-yaml_utils.md](api/core/tools/utils/C-yaml_utils.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/utils/dataset_retriever
- [C-dataset_multi_retriever_tool.md](api/core/tools/utils/dataset_retriever/C-dataset_multi_retriever_tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-dataset_retriever_base_tool.md](api/core/tools/utils/dataset_retriever/C-dataset_retriever_base_tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-dataset_retriever_tool.md](api/core/tools/utils/dataset_retriever/C-dataset_retriever_tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/tools/workflow_as_tool
- [C-provider.md](api/core/tools/workflow_as_tool/C-provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool.md](api/core/tools/workflow_as_tool/C-tool.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/trigger
- [C-constants.md](api/core/trigger/C-constants.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-errors.md](api/core/trigger/C-errors.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-provider.md](api/core/trigger/C-provider.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-trigger_manager.md](api/core/trigger/C-trigger_manager.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/trigger/debug
- [C-event_bus.md](api/core/trigger/debug/C-event_bus.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-event_selectors.md](api/core/trigger/debug/C-event_selectors.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-events.md](api/core/trigger/debug/C-events.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/trigger/entities
- [C-api_entities.md](api/core/trigger/entities/C-api_entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-entities.md](api/core/trigger/entities/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/trigger/utils
- [C-encryption.md](api/core/trigger/utils/C-encryption.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-endpoint.md](api/core/trigger/utils/C-endpoint.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-locks.md](api/core/trigger/utils/C-locks.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow
- [C-file_reference.md](api/core/workflow/C-file_reference.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-graph_topology.md](api/core/workflow/C-graph_topology.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-human_input_adapter.md](api/core/workflow/C-human_input_adapter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-human_input_forms.md](api/core/workflow/C-human_input_forms.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-human_input_policy.md](api/core/workflow/C-human_input_policy.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-llm_environment_variable.md](api/core/workflow/C-llm_environment_variable.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-llm_node.md](api/core/workflow/C-llm_node.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-node_execution_process_data.md](api/core/workflow/C-node_execution_process_data.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-node_factory.md](api/core/workflow/C-node_factory.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-node_runtime.md](api/core/workflow/C-node_runtime.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-snippet_start.md](api/core/workflow/C-snippet_start.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-system_variables.md](api/core/workflow/C-system_variables.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-template_rendering.md](api/core/workflow/C-template_rendering.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-variable_pool_initializer.md](api/core/workflow/C-variable_pool_initializer.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-variable_prefixes.md](api/core/workflow/C-variable_prefixes.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-workflow_entry.md](api/core/workflow/C-workflow_entry.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-workflow_run_outputs.md](api/core/workflow/C-workflow_run_outputs.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/generator
- [C-runner.md](api/core/workflow/generator/C-runner.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_catalogue.md](api/core/workflow/generator/C-tool_catalogue.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-types.md](api/core/workflow/generator/C-types.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/generator/prompts
- [C-builder_prompts.md](api/core/workflow/generator/prompts/C-builder_prompts.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-node_builder_prompts.md](api/core/workflow/generator/prompts/C-node_builder_prompts.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-planner_prompts.md](api/core/workflow/generator/prompts/C-planner_prompts.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-tool_router_prompts.md](api/core/workflow/generator/prompts/C-tool_router_prompts.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/agent
- [C-agent_node.md](api/core/workflow/nodes/agent/C-agent_node.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-entities.md](api/core/workflow/nodes/agent/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-events.md](api/core/workflow/nodes/agent/C-events.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exceptions.md](api/core/workflow/nodes/agent/C-exceptions.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-message_transformer.md](api/core/workflow/nodes/agent/C-message_transformer.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-plugin_strategy_adapter.md](api/core/workflow/nodes/agent/C-plugin_strategy_adapter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-runtime_support.md](api/core/workflow/nodes/agent/C-runtime_support.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-strategy_protocols.md](api/core/workflow/nodes/agent/C-strategy_protocols.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/agent_v2
- [C-agent_node.md](api/core/workflow/nodes/agent_v2/C-agent_node.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-ask_human_hitl.md](api/core/workflow/nodes/agent_v2/C-ask_human_hitl.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-ask_human_resume.md](api/core/workflow/nodes/agent_v2/C-ask_human_resume.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-binding_resolver.md](api/core/workflow/nodes/agent_v2/C-binding_resolver.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-dify_tools_builder.md](api/core/workflow/nodes/agent_v2/C-dify_tools_builder.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-discriminator.md](api/core/workflow/nodes/agent_v2/C-discriminator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-entities.md](api/core/workflow/nodes/agent_v2/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-file_tenant_validator.md](api/core/workflow/nodes/agent_v2/C-file_tenant_validator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-output_adapter.md](api/core/workflow/nodes/agent_v2/C-output_adapter.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-output_failure_orchestrator.md](api/core/workflow/nodes/agent_v2/C-output_failure_orchestrator.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-output_file_rebacker.md](api/core/workflow/nodes/agent_v2/C-output_file_rebacker.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-output_type_checker.md](api/core/workflow/nodes/agent_v2/C-output_type_checker.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-runtime_feature_manifest.md](api/core/workflow/nodes/agent_v2/C-runtime_feature_manifest.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-runtime_request_builder.md](api/core/workflow/nodes/agent_v2/C-runtime_request_builder.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-session_store.md](api/core/workflow/nodes/agent_v2/C-session_store.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-validators.md](api/core/workflow/nodes/agent_v2/C-validators.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-workspace_retirement_layer.md](api/core/workflow/nodes/agent_v2/C-workspace_retirement_layer.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/datasource
- [C-datasource_node.md](api/core/workflow/nodes/datasource/C-datasource_node.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-entities.md](api/core/workflow/nodes/datasource/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/workflow/nodes/datasource/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-protocols.md](api/core/workflow/nodes/datasource/C-protocols.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/human_input
- [C-_exc.md](api/core/workflow/nodes/human_input/C-_exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-boundary.md](api/core/workflow/nodes/human_input/C-boundary.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-callback.md](api/core/workflow/nodes/human_input/C-callback.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-entities.md](api/core/workflow/nodes/human_input/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-enums.md](api/core/workflow/nodes/human_input/C-enums.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-pause_reason.md](api/core/workflow/nodes/human_input/C-pause_reason.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-session_binding.md](api/core/workflow/nodes/human_input/C-session_binding.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/knowledge_index
- [C-entities.md](api/core/workflow/nodes/knowledge_index/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/workflow/nodes/knowledge_index/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-knowledge_index_node.md](api/core/workflow/nodes/knowledge_index/C-knowledge_index_node.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-protocols.md](api/core/workflow/nodes/knowledge_index/C-protocols.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/knowledge_retrieval
- [C-entities.md](api/core/workflow/nodes/knowledge_retrieval/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/workflow/nodes/knowledge_retrieval/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-knowledge_retrieval_node.md](api/core/workflow/nodes/knowledge_retrieval/C-knowledge_retrieval_node.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-retrieval.md](api/core/workflow/nodes/knowledge_retrieval/C-retrieval.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-template_prompts.md](api/core/workflow/nodes/knowledge_retrieval/C-template_prompts.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/trigger_plugin
- [C-entities.md](api/core/workflow/nodes/trigger_plugin/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/workflow/nodes/trigger_plugin/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-trigger_event_node.md](api/core/workflow/nodes/trigger_plugin/C-trigger_event_node.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/trigger_schedule
- [C-entities.md](api/core/workflow/nodes/trigger_schedule/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/workflow/nodes/trigger_schedule/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-trigger_schedule_node.md](api/core/workflow/nodes/trigger_schedule/C-trigger_schedule_node.md) — 자동 추출된 1:1 아키텍처 매핑 카드

## api/core/workflow/nodes/trigger_webhook
- [C-entities.md](api/core/workflow/nodes/trigger_webhook/C-entities.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-exc.md](api/core/workflow/nodes/trigger_webhook/C-exc.md) — 자동 추출된 1:1 아키텍처 매핑 카드
- [C-node.md](api/core/workflow/nodes/trigger_webhook/C-node.md) — 자동 추출된 1:1 아키텍처 매핑 카드


# 가로축 — 전체를 관통하는 핵심 줄기

한 카드만 단편적으로 읽었을 때 놓치기 쉬운 거시적 연결고리.

1. **[모델 추상화 및 권한 통제 줄기]**
   `ProviderManager`(테넌트 설정 조립) → `ModelManager`(단일 인터페이스 인스턴스화) → `model_runtime/`(실제 LLM 호출)
   이 흐름은 프론트엔드 요청이 어떻게 특정 벤더에 종속되지 않고 안전하게 로드 밸런싱되어 호출되는지 보여주는 핵심 파이프라인입니다.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 |
|---|---|
| Document Builder에서 다양한 로컬/클라우드 모델을 유연하게 교체하는 구조를 짤 때 | [C-model_manager.md](api/core/C-model_manager.md) |
| 사용자 계정(Tenant)별로 호출 권한이나 API 키를 다르게 매핑해야 할 때 | [C-provider_manager.md](api/core/C-provider_manager.md) |
