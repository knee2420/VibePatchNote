# 🔍 [세그먼트 스캔] 논리 블록 탐색 튜닝

- **연계 코드**: `apps/api/app/documents/prompts.py` (`build_segment_scan_prompt`)
- **담당 역할**: 업로드 직후 문서의 표/목록/섹션을 고속으로 바운딩 박스 감지.
- **평가 핵심**: 박스 IoU(Intersection over Union) ≥ 0.6 및 컴포넌트 타입 라벨링 정확도.
