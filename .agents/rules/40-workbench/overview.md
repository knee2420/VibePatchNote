# Workbench Overview & General Guidelines

## 목적
- `workbench/` 디렉토리는 소스코드(`apps/`, `packages/`)와 완전히 분리된 프로젝트 백데이터, 리서치, 데이터 파이프라인, 아카이빙 및 이력 관리 전용 작업 공간입니다.
- 개발 빌드 및 프로덕션 번들에 절대 포함되지 않으며, 프로젝트의 핵심 지식 베이스로 기능합니다.

## 디렉토리 체계 요약
- **`03.patch_note/`**: 타임라인별 불변 패치노트 카드(Immutable Patch Card) 및 변경 이력 아카이브 (`03-patch-note.md` 가이드 준수).
- **`96.data_pipeline/`**: 고밀도 지식 카드(C-XX) 및 인덱스 기반 메타 데이터베이스 (`pipeline_96_generator` / `pipeline_96_reader` 대상).
- **`97.reference/`**: 외부 레퍼런스, 표준 아키텍처 가이드, 벤치마킹 자료 보관.
- **`98.collection/`**: 원본 수집 자료, 도메인 실데이터 저장소.
- **`99.archive/`**: 완료된 기록, 공식 Git 클론 저장소(FSD, AHA 등), 지난 의사결정(ADR), 마일스톤 보관.
