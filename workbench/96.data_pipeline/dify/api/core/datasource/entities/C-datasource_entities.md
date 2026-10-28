---
type: card
title: "Datasource Entities"
description: "datasource_entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/datasource/entities/datasource_entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `datasource_entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | DatasourceProviderType | DatasourceProviderType 클래스 정의 및 추상화 | `## class DatasourceProviderType` |
| E2 | 아키텍처 | DatasourceParameter | DatasourceParameter 클래스 정의 및 추상화 | `## class DatasourceParameter` |
| E3 | 아키텍처 | DatasourceIdentity | DatasourceIdentity 클래스 정의 및 추상화 | `## class DatasourceIdentity` |
| E4 | 아키텍처 | DatasourceEntity | DatasourceEntity 클래스 정의 및 추상화 | `## class DatasourceEntity` |
| E5 | 아키텍처 | DatasourceProviderIdentity | DatasourceProviderIdentity 클래스 정의 및 추상화 | `## class DatasourceProviderIdentity` |
| E6 | 아키텍처 | DatasourceProviderEntity | DatasourceProviderEntity 클래스 정의 및 추상화 | `## class DatasourceProviderEntity` |
| E7 | 아키텍처 | DatasourceProviderEntityWithPlugin | DatasourceProviderEntityWithPlugin 클래스 정의 및 추상화 | `## class DatasourceProviderEntityWithPlugin` |
| E8 | 아키텍처 | DatasourceInvokeMetaDict | DatasourceInvokeMetaDict 클래스 정의 및 추상화 | `## class DatasourceInvokeMetaDict` |
| E9 | 아키텍처 | DatasourceInvokeMeta | DatasourceInvokeMeta 클래스 정의 및 추상화 | `## class DatasourceInvokeMeta` |
| E10 | 아키텍처 | DatasourceLabel | DatasourceLabel 클래스 정의 및 추상화 | `## class DatasourceLabel` |
| E11 | 아키텍처 | DatasourceInvokeFrom | DatasourceInvokeFrom 클래스 정의 및 추상화 | `## class DatasourceInvokeFrom` |
| E12 | 아키텍처 | OnlineDocumentPage | OnlineDocumentPage 클래스 정의 및 추상화 | `## class OnlineDocumentPage` |
| E13 | 아키텍처 | OnlineDocumentInfo | OnlineDocumentInfo 클래스 정의 및 추상화 | `## class OnlineDocumentInfo` |
| E14 | 아키텍처 | OnlineDocumentPagesMessage | OnlineDocumentPagesMessage 클래스 정의 및 추상화 | `## class OnlineDocumentPagesMessage` |
| E15 | 아키텍처 | GetOnlineDocumentPageContentRequest | GetOnlineDocumentPageContentRequest 클래스 정의 및 추상화 | `## class GetOnlineDocumentPageContentRequest` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[datasource_entities.py](../../../../../../99.archive/dify/api/core/datasource/entities/datasource_entities.py)
