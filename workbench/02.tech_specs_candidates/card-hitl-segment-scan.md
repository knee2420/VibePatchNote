---
type: card
title: "HITL Flat Segment Scanning (평면 세그먼트 마스킹 스캔)"
category: "Candidate / Visual Masking"
status: "Pending / Experimental (보류/실험)"
created_at: "2026-09-08"
related_code:
  backend: "apps/api/app/documents/experimental/prompts.py"
  frontend: "apps/web/src/entities/reference-document/ui/ReferenceCardHeader.tsx (FlaskConical 버튼)"
---

# 평면 세그먼트 마스킹 스캔 (HITL Flat Segment Scan)

## 1. 개요 및 목적
- PDF 문서의 논리적 구역(표, 목록, 본문 섹션)을 단순 평면 직사각형(`box_2d`)으로 탐색하여 문서 뷰어 위에 반투명 컬러 박스로 시각화하고, 사용자가 모서리를 드래그해 경계를 수동 조절(HITL)하는 기능.

## 2. 현재 상태: 🟡 보류 (Pending / Experimental)
- **보류 사유:**
  1. 신규 **`Outline V2` (`packages/scaffold-engine/outline/`)**가 개발되면서, 단순 평면 박스가 아닌 **L1~L4 심층 계층 목차 트리와 표 내부 세부 필드/실측값을 1-Stage로 전수 추출**하게 됨.
  2. 따라서 메인 서식 복원 및 스캐폴딩 파이프라인의 Ground Truth는 `Outline V2`로 단일화되었음.
- **화면 및 코드 유지 사유:**
  - PDF 뷰어 상의 컬러 마스크 오버레이 및 마우스 리사이징(수동 각잡기) 인터랙션 프로토타입 검증을 위해 화면에서 즉시 걷어내지 않고 **실험실(Lab) 트랙**으로 보존.

## 3. 관리 방침
- **백엔드 위치:** 정식 파이프라인과 혼선이 없도록 `apps/api/app/documents/experimental/` 하위로 격리 관리.
- **프론트엔드 UI:** 메인 기능(`✨ 아웃라인`, `📖 패널`, `T 서식`)과 시각적으로 분리하여 **`🔬 실험실(FlaskConical)`** 아이콘과 구분선으로 렌더링.
- 향후 Outline V2의 바운딩 박스를 직접 편집하는 캔버스 오버레이 기능이 정식 도입될 경우, 본 실험 코드는 최종 폐기(Deprecate) 예정.
