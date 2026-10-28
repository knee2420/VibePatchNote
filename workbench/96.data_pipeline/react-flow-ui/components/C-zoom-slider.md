---
type: card
title: "Zoom Slider Controller"
description: "캔버스 줌 배율을 미세 조절하는 슬라이더 바 컨트롤러"
resource: "../../../99.archive/react-flow-ui/components/zoom-slider.tsx"
timestamp: "2026-09-06"
---

# summary
마우스 드래그로 캔버스 줌 배율을 0.1x ~ 4x 범위에서 연속적으로 조절하는 슬라이더. shadcn Slider 컴포넌트와 useReactFlow 줌 상태를 동기화한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | ZoomSlider Component | Slider 기반의 연속 줌 배율 컨트롤러 | `export function ZoomSlider` |
| E2 | 아키텍처 | Dual-direction Sync | 캔버스 마우스 휠 줌과 슬라이더 값의 양방향 동기화 | `useReactFlow` |
| E3 | 코드 | Slider Track & Thumb | 모던 미니멀 스타일의 슬라이더 트랙 및 툴팁 힌트 | `className` |

# 밖으로
- 드롭다운 형태는 [C-zoom-select.md](C-zoom-select.md)를 참조하십시오.

# 원문
[zoom-slider.tsx](../../../99.archive/react-flow-ui/components/zoom-slider.tsx)
