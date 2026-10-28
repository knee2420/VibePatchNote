"""
[02.reconstruct] 전체 PDF 대상 Stage A -> B -> C 일괄 Tiptap 재구성 실행 스크립트.
"""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

# 윈도우 UTF-8 출력 강제
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")

RECON_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(RECON_DIR))

from pipeline.reconstructor import ScaffoldReconstructor

RAW_PDF_DIR = RECON_DIR.parent / "01.outline_extraction_v2" / "01.dataset" / "raw"
UPLOADS_DIR = RECON_DIR.parent.parent.parent / "apps" / "api" / "uploads"
OUTPUT_STAGING_DIR = RECON_DIR / "staging"
OUTPUT_STAGING_DIR.mkdir(parents=True, exist_ok=True)

reconstructor = ScaffoldReconstructor()

# 두 경로에서 모든 PDF 수집 (중복 제거)
pdf_map = {}
for search_dir in [RAW_PDF_DIR, UPLOADS_DIR]:
    if search_dir.exists():
        for p in search_dir.glob("*.pdf"):
            pdf_map[p.stem] = p

pdf_files = [pdf_map[k] for k in sorted(pdf_map.keys())]
print(f"=== 총 {len(pdf_files)}개 PDF 파일 대상 원자 그리드 고정밀 재구성 시작 ===\n")

for pdf_path in pdf_files:
    doc_stem = pdf_path.stem
    try:
        # force_fresh=True 로 신규 원자 그리드 & 고스트 오버레이 제거 엔진 강제 적용
        res = reconstructor.reconstruct(pdf_path, doc_id=doc_stem, force_fresh=True)

        out_path = OUTPUT_STAGING_DIR / f"scaffold_{doc_stem}.json"
        out_dict = res.model_dump(by_alias=True)
        out_path.write_text(json.dumps(out_dict, ensure_ascii=False, indent=2), encoding="utf-8")

        # 언더스코어 버전 경로도 동시 저장
        if " " in doc_stem:
            under_path = OUTPUT_STAGING_DIR / f"scaffold_{doc_stem.replace(' ', '_')}.json"
            under_path.write_text(json.dumps(out_dict, ensure_ascii=False, indent=2), encoding="utf-8")

        print(f"[*] {doc_stem}")
        print(f"    - 총 페이지: {res.meta.total_pages}p | 생성된 슬롯: {len(res.slots)}개 | HTML 크기: {len(res.html_content)}자")
    except Exception as e:
        print(f"[!] {doc_stem} 재구성 실패: {e}")

print("\n=== 전체 재구성 완료 ===")
