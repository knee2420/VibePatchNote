---
type: card
title: "Animated SVG Edge"
description: "SVG 패스를 따라 점이나 빛 파티클이 동적으로 흐르는 고품질 애니메이션 엣지"
resource: "../../../99.archive/react-flow-ui/components/animated-svg-edge.tsx"
timestamp: "2026-09-06"
---

# summary
노드 간의 데이터 흐름이나 실행 파이프라인을 시각화하는 애니메이션 엣지. getBezierPath 또는 getSmoothStepPath와 SVG stroke-dashoffset / stroke-dasharray 키프레임을 결합하여 렌더링한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | AnimatedSvgEdge Component | EdgeProps<AnimatedSvgEdgeData> 기반의 애니메이션 엣지 | `export function AnimatedSvgEdge` |
| E2 | 아키텍처 | Bezier Path Calculation | 소스/타겟 좌표 기반의 베지어 곡선 패스 자동 계산 | `getBezierPath` |
| E3 | 코드 | SVG Animation Keyframe | 부드러운 대시 애니메이션을 제어하는 strokeDashoffset 스타일 | `strokeDashoffset` |

# 밖으로
- 데이터 라벨 엣지는 [C-data-edge.md](C-data-edge.md)를 참조하십시오.

# 원문
[animated-svg-edge.tsx](../../../99.archive/react-flow-ui/components/animated-svg-edge.tsx)
