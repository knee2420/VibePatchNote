---
type: card
title: "Plugin Daemon"
description: "plugin_daemon.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/plugin/entities/plugin_daemon.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `plugin_daemon.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | PluginDaemonBasicResponse | PluginDaemonBasicResponse 클래스 정의 및 추상화 | `## class PluginDaemonBasicResponse` |
| E2 | 아키텍처 | InstallPluginMessage | InstallPluginMessage 클래스 정의 및 추상화 | `## class InstallPluginMessage` |
| E3 | 아키텍처 | PluginToolProviderEntity | PluginToolProviderEntity 클래스 정의 및 추상화 | `## class PluginToolProviderEntity` |
| E4 | 아키텍처 | PluginDatasourceProviderEntity | PluginDatasourceProviderEntity 클래스 정의 및 추상화 | `## class PluginDatasourceProviderEntity` |
| E5 | 아키텍처 | PluginAgentProviderEntity | PluginAgentProviderEntity 클래스 정의 및 추상화 | `## class PluginAgentProviderEntity` |
| E6 | 아키텍처 | PluginBasicBooleanResponse | PluginBasicBooleanResponse 클래스 정의 및 추상화 | `## class PluginBasicBooleanResponse` |
| E7 | 아키텍처 | PluginModelSchemaEntity | PluginModelSchemaEntity 클래스 정의 및 추상화 | `## class PluginModelSchemaEntity` |
| E8 | 아키텍처 | PluginModelProviderDeclaration | PluginModelProviderDeclaration 클래스 정의 및 추상화 | `## class PluginModelProviderDeclaration` |
| E9 | 아키텍처 | PluginModelProviderEntity | PluginModelProviderEntity 클래스 정의 및 추상화 | `## class PluginModelProviderEntity` |
| E10 | 아키텍처 | PluginModelProviderBinding | PluginModelProviderBinding 클래스 정의 및 추상화 | `## class PluginModelProviderBinding` |
| E11 | 아키텍처 | PluginTextEmbeddingNumTokensResponse | PluginTextEmbeddingNumTokensResponse 클래스 정의 및 추상화 | `## class PluginTextEmbeddingNumTokensResponse` |
| E12 | 아키텍처 | PluginLLMNumTokensResponse | PluginLLMNumTokensResponse 클래스 정의 및 추상화 | `## class PluginLLMNumTokensResponse` |
| E13 | 아키텍처 | PluginStringResultResponse | PluginStringResultResponse 클래스 정의 및 추상화 | `## class PluginStringResultResponse` |
| E14 | 아키텍처 | PluginTTSResultResponse | PluginTTSResultResponse 클래스 정의 및 추상화 | `## class PluginTTSResultResponse` |
| E15 | 아키텍처 | TTSAudioChunk | TTSAudioChunk 클래스 정의 및 추상화 | `## class TTSAudioChunk` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[plugin_daemon.py](../../../../../../99.archive/dify/api/core/plugin/entities/plugin_daemon.py)
