---
type: card
title: "Cell-Level Agentic Generation (셀 단위 독립 생성 및 제어)"
category: "Feature / Authoring Experience"
---

# 셀 단위 독립 생성 및 제어 (Cell-Level Agentic Generation)

## 설명
최종 작업 캔버스(Document Spread)에서 문서 전체를 한 번에 생성하는 것이 아니라, **아웃라인의 최소 단위(예: 특정 절이나 항)를 하나의 '셀(Cell)'로 취급하여 개별적으로 에이전트를 호출하고 생성하는 기능**입니다.

## 핵심 가치
1. **토큰 및 컨텍스트 격리 (Context Isolation):** 에이전트가 5장 1절(특정 셀)을 작성할 때, 문서 전체의 문맥에 짓눌리지 않고 **오직 해당 셀에 부착된 리소스(포스트잇)와 로컬 프롬프트에만 집중**하여 최고의 품질을 뽑아냅니다.
2. **부분적 실패의 허용 (Blast Radius Control):** 3장 2절의 생성이 마음에 들지 않아도 문서 전체를 롤백하거나 재생성할 필요가 없습니다. 문제가 발생한 특정 셀만 비우고 에이전트에게 다시 지시를 내리면 됩니다. 기획자의 다이렉트 수정(Direct Edit)과 에이전트의 생성이 충돌 없이 공존할 수 있는 기반이 됩니다.
