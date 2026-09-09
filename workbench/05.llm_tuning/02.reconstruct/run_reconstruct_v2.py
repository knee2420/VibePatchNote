"""
[02.reconstruct] 전체 PDF 대상 v2 (비전 아웃라인 통합형) 일괄 Tiptap 재구성 러너.
"""
from __future__ import annotations

import io
import json
import sys
import time
from pathlib import Path

# 윈도우 UTF-8 출력 강제
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")

RECON_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(RECON_DIR))

from pipeline.reconstructor_v2 import ScaffoldReconstructorV2

OUTLINE_STAGING_DIR = RECON_DIR.parent / "01.outline_extraction_v2" / "staging" / "step1_outline"
OUTPUT_STAGING_DIR = RECON_DIR / "staging"
OUTPUT_STAGING_DIR.mkdir(parents=True, exist_ok=True)

reconstructor = ScaffoldReconstructorV2()

# 사용 가능한 모든 outline 파일 수집
outline_files = sorted(OUTLINE_STAGING_DIR.glob("output_*.json"))
print(f"=== 총 {len(outline_files)}개 문서 대상 v2 (비전-아웃라인 통합형) 재구성 시작 ===\n")

total_start = time.perf_counter()

for p in outline_files:
    doc_stem = p.stem.replace("output_", "")
    t0 = time.perf_counter()
    try:
        res = reconstructor.reconstruct(doc_stem)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        out_path = OUTPUT_STAGING_DIR / f"scaffold_v2_{doc_stem}.json"
        out_dict = res.model_dump(by_alias=True)
        out_path.write_text(json.dumps(out_dict, ensure_ascii=False, indent=2), encoding="utf-8")

        # viz 스튜디오 기본 호환성을 위해 scaffold_{doc_stem}.json 에도 동시 갱신
        compat_path = OUTPUT_STAGING_DIR / f"scaffold_{doc_stem}.json"
        compat_path.write_text(json.dumps(out_dict, ensure_ascii=False, indent=2), encoding="utf-8")
        if " " in doc_stem:
            under_path = OUTPUT_STAGING_DIR / f"scaffold_{doc_stem.replace(' ', '_')}.json"
            under_path.write_text(json.dumps(out_dict, ensure_ascii=False, indent=2), encoding="utf-8")

        print(f"[*] {doc_stem} (소요시간: {elapsed_ms:.2f} ms)")
        print(f"    - 총 페이지: {res.meta.total_pages}p | 생성된 슬롯: {len(res.slots)}개 | HTML 크기: {len(res.html_content)}자")
    except Exception as e:
        print(f"[!] {doc_stem} v2 재구성 실패: {e}")

total_elapsed = time.perf_counter() - total_start
print(f"\n=== v2 전체 재구성 완료! (총 소요 시간: {total_elapsed:.2f}초) ===")
