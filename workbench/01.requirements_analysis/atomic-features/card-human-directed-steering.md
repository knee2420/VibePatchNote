---
type: card
title: "Human-Directed Steering (휴먼 주도형 생성 가이드라인)"
category: "Feature / Authoring Experience"
---

# 휴먼 주도형 생성 및 아웃라인 설계 (Human-Directed Steering)

## 설명
새로운 문서를 빌드(Build)하기 전, 인간 기획자가 '초반 컨셉'과 '아웃라인 방향성'을 잡아주는 프롬프트 UI입니다. 여기서 에이전트에게 전달되는 **'리소스(Resource)'는 단순한 원시 텍스트가 아니라, `pipeline_96_reader` 시스템을 통해 불러올 수 있는 고도로 구조화된 기초 지식 카드(96.data_pipeline)들**입니다. 기획자는 이 지식 자산들을 근거로 새 템플릿에 어떻게 재배치할지 명확한 각(Angle)을 잡아줍니다.

## 핵심 가치
"이거 사람이 각을 잡아줄 수 밖에 없다"는 철학을 반영합니다. 에이전트가 자유도 높게 내용을 지어내는 환각(Hallucination)을 원천 차단하기 위해, **오직 첨부된 구조화된 리소스(지식 카드) 안에서만 0~100% 데이터를 차출하여 인간이 지시한 컨셉에 맞게 재조립(Re-assembly)하도록 강제**합니다. 완전히 통제된 조건 하에서의 안전한 생성(Safe Generation)을 보장합니다.
