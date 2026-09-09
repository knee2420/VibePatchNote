"""
[02.reconstruct_v2] 일괄 재구성 배치 러너.
"""
from __future__ import annotations

import io
import json
import sys
import time
from pathlib import Path

# UTF-8 강제
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")

MODULE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(MODULE_DIR))

from pipeline.reconstructor import ScaffoldReconstructorV2

RAW_PDF_DIR = MODULE_DIR.parent / "01.outline_extraction_v2" / "01.dataset" / "raw"

SAMPLE_FILES = [
    "디딤돌_참가신청서_딥드론.pdf",
    "11월_디딤돌_회의록.pdf",
    "Atticus_LLC_Invoice_000081709.pdf",
]

reconstructor = ScaffoldReconstructorV2(model="gemini-3.8-flash-low")

print("=== [02.reconstruct_v2] 비전-원자그리드 융합 정밀 재구성 시작 ===\n")

for filename in SAMPLE_FILES:
    pdf_path = RAW_PDF_DIR / filename
    if not pdf_path.exists():
        print(f"[!] 파일 없음: {pdf_path}")
        continue

    print(f"▶ 재구성 중: {filename}")
    t0 = time.perf_counter()
    try:
        res = reconstructor.reconstruct(str(pdf_path), force_fresh=True)
        elapsed = (time.perf_counter() - t0) * 1000.0

        print(f"  [*] 완료! (소요시간: {elapsed:.2f} ms)")
        print(f"      - 페이지 수: {res.meta.total_pages}p | 슬롯 수: {len(res.slots)}개 | HTML 크기: {len(res.html_content)}자")
    except Exception as e:
        print(f"  [!] 실패: {e}")

print("\n=== [02.reconstruct_v2] 전체 재구성 완료 ===")
