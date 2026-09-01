---
type: card
title: "Interactive Block Masking (인터랙티브 블록 마스킹 및 국소 재생성)"
category: "Feature / Authoring Experience"
---

# 인터랙티브 블록 마스킹 (Interactive Block Masking)

## 설명
격자형 캔버스(혹은 텍스트 에디터) 안에서, 생성된 텍스트 중 마음에 들지 않는 **특정 문장이나 단락(Block)만을 드래그하여 '마스킹(Masking)' 처리한 뒤, 해당 부분만 에이전트에게 재생성(Inpainting)을 지시하는 기능**입니다.

## 핵심 가치
1. **정밀한 국소 외과수술 (Surgical Editing):** 에이전트가 쓴 글 90%는 마음에 드는데 10%의 표현이 어색할 때, 전체를 다시 생성(Regenerate)하는 도박을 할 필요가 없습니다. 문제의 10%만 마스킹하여 "이 부분만 좀 더 부드러운 어조로 바꿔줘"라고 핀포인트 지시를 내릴 수 있습니다.
2. **컨텍스트 인식 인페인팅 (Context-Aware Inpainting):** 마스킹된 영역을 재생성할 때, 에이전트는 주변 텍스트(앞뒤 문맥)를 고려하여 자연스럽게 이어지도록 해당 블록을 다시 칠해 넣습니다. 이는 기획자의 직접 편집(Direct Edit)을 AI가 매끄럽게 이어받는 환상적인 협업 경험을 제공합니다.
