---
type: card
title: "Request"
description: "request.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/plugin/entities/request.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `request.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | InvokeCredentials | InvokeCredentials 클래스 정의 및 추상화 | `## class InvokeCredentials` |
| E2 | 아키텍처 | PluginInvokeContext | PluginInvokeContext 클래스 정의 및 추상화 | `## class PluginInvokeContext` |
| E3 | 아키텍처 | RequestInvokeTool | RequestInvokeTool 클래스 정의 및 추상화 | `## class RequestInvokeTool` |
| E4 | 아키텍처 | BaseRequestInvokeModel | BaseRequestInvokeModel 클래스 정의 및 추상화 | `## class BaseRequestInvokeModel` |
| E5 | 아키텍처 | RequestInvokeLLM | RequestInvokeLLM 클래스 정의 및 추상화 | `## class RequestInvokeLLM` |
| E6 | 아키텍처 | RequestInvokeLLMWithStructuredOutput | RequestInvokeLLMWithStructuredOutput 클래스 정의 및 추상화 | `## class RequestInvokeLLMWithStructuredOutput` |
| E7 | 아키텍처 | RequestInvokeTextEmbedding | RequestInvokeTextEmbedding 클래스 정의 및 추상화 | `## class RequestInvokeTextEmbedding` |
| E8 | 아키텍처 | RequestInvokeRerank | RequestInvokeRerank 클래스 정의 및 추상화 | `## class RequestInvokeRerank` |
| E9 | 아키텍처 | RequestInvokeTTS | RequestInvokeTTS 클래스 정의 및 추상화 | `## class RequestInvokeTTS` |
| E10 | 아키텍처 | RequestInvokeSpeech2Text | RequestInvokeSpeech2Text 클래스 정의 및 추상화 | `## class RequestInvokeSpeech2Text` |
| E11 | 아키텍처 | RequestInvokeModeration | RequestInvokeModeration 클래스 정의 및 추상화 | `## class RequestInvokeModeration` |
| E12 | 아키텍처 | RequestInvokeParameterExtractorNode | RequestInvokeParameterExtractorNode 클래스 정의 및 추상화 | `## class RequestInvokeParameterExtractorNode` |
| E13 | 아키텍처 | RequestInvokeQuestionClassifierNode | RequestInvokeQuestionClassifierNode 클래스 정의 및 추상화 | `## class RequestInvokeQuestionClassifierNode` |
| E14 | 아키텍처 | RequestInvokeApp | RequestInvokeApp 클래스 정의 및 추상화 | `## class RequestInvokeApp` |
| E15 | 아키텍처 | RequestInvokeEncrypt | RequestInvokeEncrypt 클래스 정의 및 추상화 | `## class RequestInvokeEncrypt` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[request.py](../../../../../../99.archive/dify/api/core/plugin/entities/request.py)
