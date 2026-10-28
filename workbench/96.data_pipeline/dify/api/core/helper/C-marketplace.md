---
type: card
title: "Marketplace"
description: "marketplace.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/helper/marketplace.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `marketplace.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | get_plugin_pkg_url | get_plugin_pkg_url 핵심 로직 및 프로시저 | `## def get_plugin_pkg_url` |
| E2 | 규칙 | download_plugin_pkg | download_plugin_pkg 핵심 로직 및 프로시저 | `## def download_plugin_pkg` |
| E3 | 규칙 | batch_fetch_plugin_manifests | batch_fetch_plugin_manifests 핵심 로직 및 프로시저 | `## def batch_fetch_plugin_manifests` |
| E4 | 규칙 | batch_fetch_plugin_by_ids | batch_fetch_plugin_by_ids 핵심 로직 및 프로시저 | `## def batch_fetch_plugin_by_ids` |
| E5 | 규칙 | record_install_plugin_event | record_install_plugin_event 핵심 로직 및 프로시저 | `## def record_install_plugin_event` |
| E6 | 규칙 | fetch_global_plugin_manifest | fetch_global_plugin_manifest 핵심 로직 및 프로시저 | `## def fetch_global_plugin_manifest` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[marketplace.py](../../../../../99.archive/dify/api/core/helper/marketplace.py)
