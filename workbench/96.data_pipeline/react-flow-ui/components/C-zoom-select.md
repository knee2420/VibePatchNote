---
type: card
title: "Zoom Select Dropdown"
description: "25%, 50%, 100%, 200%, Fit View 등 정형화된 줌 배율을 원클릭 선택하는 드롭다운"
resource: "../../../99.archive/react-flow-ui/components/zoom-select.tsx"
timestamp: "2026-09-06"
---

# summary
캔버스 하단 툴바에 배치되는 줌 배율 선택기. 현재 줌 레벨을 실시간 백분율로 표시하고, 프리셋 선택 시 useReactFlow().zoomTo()로 전환한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | ZoomSelect Component | shadcn/ui Select 기반의 줌 배율 선택 드롭다운 | `export function ZoomSelect` |
| E2 | 아키텍처 | Zoom Preset Logic | 0.25, 0.5, 1.0, 2.0 배율 프리셋 및 fitView 액션 매핑 | `zoomTo` |
| E3 | 코드 | Compact UI Style | 툴바에 어울리는 h-8 컴팩트 사이즈 및 아이콘 정렬 | `className` |

# 밖으로
- 슬라이더 형태는 [C-zoom-slider.md](C-zoom-slider.md)를 참조하십시오.

# 원문
[zoom-select.tsx](../../../99.archive/react-flow-ui/components/zoom-select.tsx)
