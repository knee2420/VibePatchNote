---
type: card
title: "Model Runtime Factory"
description: "model_runtime_factory.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/plugin/impl/model_runtime_factory.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `model_runtime_factory.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | create_model_type_instance | create_model_type_instance 핵심 로직 및 프로시저 | `## def create_model_type_instance` |
| E2 | 아키텍처 | PluginModelAssembly | PluginModelAssembly 클래스 정의 및 추상화 | `## class PluginModelAssembly` |
| E3 | 규칙 | create_plugin_model_assembly | create_plugin_model_assembly 핵심 로직 및 프로시저 | `## def create_plugin_model_assembly` |
| E4 | 규칙 | create_plugin_model_runtime | create_plugin_model_runtime 핵심 로직 및 프로시저 | `## def create_plugin_model_runtime` |
| E5 | 규칙 | create_plugin_model_provider_factory | create_plugin_model_provider_factory 핵심 로직 및 프로시저 | `## def create_plugin_model_provider_factory` |
| E6 | 규칙 | create_plugin_provider_manager | create_plugin_provider_manager 핵심 로직 및 프로시저 | `## def create_plugin_provider_manager` |
| E7 | 규칙 | create_plugin_model_manager | create_plugin_model_manager 핵심 로직 및 프로시저 | `## def create_plugin_model_manager` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[model_runtime_factory.py](../../../../../../99.archive/dify/api/core/plugin/impl/model_runtime_factory.py)
