# 🏗️ [스캐폴드 서식 생성] Tiptap 와이어프레임 튜닝

- **연계 코드**: `packages/scaffold-engine/scaffold_engine/core/pipeline.py`
- **담당 역할**: PDF 시각 비전 및 텍스트를 Tiptap 호환 HTML DOM, 슬롯(Slots), 마크다운으로 조립.
- **평가 핵심**: 슬롯 좌표 오차율(Pixel Deviation), HTML DOM 태그 유효성, 스타일 누락률.
