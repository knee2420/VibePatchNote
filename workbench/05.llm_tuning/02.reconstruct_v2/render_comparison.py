"""
[02.reconstruct_v2] 원본 PDF vs v2 와이어프레임 나란히 비교 이미지(Side-by-Side) 생성기.
3개 샘플 문서의 1페이지를 좌측(원본 PDF) / 우측(v2 Tiptap 렌더링)으로 합성하여 PNG로 저장합니다.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from PIL import Image

sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")

MODULE_DIR = Path(__file__).resolve().parent
RECON_V1_DIR = MODULE_DIR.parent / "02.reconstruct"

# v2 모듈을 최우선으로 추가
if str(MODULE_DIR) in sys.path:
    sys.path.remove(str(MODULE_DIR))
sys.path.insert(0, str(MODULE_DIR))

from pipeline.reconstructor import ScaffoldReconstructorV2

# scaffold_renderer는 v1 vision에서 로드
import importlib.util
spec = importlib.util.spec_from_file_location("scaffold_renderer", str(RECON_V1_DIR / "vision" / "scaffold_renderer.py"))
scaffold_renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scaffold_renderer)
render_scaffold_png = scaffold_renderer.render_scaffold_png

RAW_PDF_DIR = MODULE_DIR.parent / "01.outline_extraction_v2" / "01.dataset" / "raw"
OUTPUT_DIR = Path(r"C:\Users\knee2\.gemini\antigravity-ide\brain\20a324cf-aa3b-4194-9638-fe0ae7b315fc")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_FILES = [
    "디딤돌_참가신청서_딥드론.pdf",
    "11월_디딤돌_회의록.pdf",
    "Atticus_LLC_Invoice_000081709.pdf",
]

reconstructor = ScaffoldReconstructorV2(model="gemini-3.8-flash-low")

print("=== [02.reconstruct_v2] 3종 샘플 비교 캡처 생성 시작 ===\n")

for filename in SAMPLE_FILES:
    pdf_path = RAW_PDF_DIR / filename
    if not pdf_path.exists():
        print(f"[!] 파일 없음: {pdf_path}")
        continue

    stem = pdf_path.stem
    print(f"▶ 처리 중: {filename}")

    # 1. v2 재구성 실행
    res = reconstructor.reconstruct(str(pdf_path), force_fresh=True)

    # 2. 원본 PDF 1페이지 렌더링
    doc = fitz.open(pdf_path)
    page0 = doc[0]
    orig_pix = page0.get_pixmap(dpi=144, alpha=False)
    orig_img = Image.open(io.BytesIO(orig_pix.tobytes("png")))
    doc.close()

    # 3. v2 scaffold.html 에서 1페이지 분량만 분리하여 렌더링 (다중 페이지 오버레이 차단)
    p1_html = res.html_content
    if '<div data-type="scaffold-page"' in res.html_content:
        pages_split = res.html_content.split('<div data-type="scaffold-page"')
        if len(pages_split) > 1:
            p1_html = '<div data-type="scaffold-page"' + pages_split[1]
            if not p1_html.strip().endswith("</div>"):
                p1_html += "</div>"

    scaffold_bytes = render_scaffold_png(p1_html, dpi=144)
    if not scaffold_bytes:
        print(f"  [!] scaffold 렌더링 실패: {filename}")
        continue
    scaffold_img = Image.open(io.BytesIO(scaffold_bytes))

    # 4. 좌우 나란히 합성 (Side-by-side)
    max_h = max(orig_img.height, scaffold_img.height)
    total_w = orig_img.width + scaffold_img.width + 40  # 40px 간격

    combined = Image.new("RGB", (total_w, max_h + 60), color=(245, 247, 250))

    # 상단 캡션용 여백 고려 붙이기
    combined.paste(orig_img, (0, 50))
    combined.paste(scaffold_img, (orig_img.width + 40, 50))

    out_file = OUTPUT_DIR / f"compare_v2_{stem}.png"
    combined.save(str(out_file))
    print(f"  [*] 비교 이미지 저장 완료: {out_file} (슬롯: {len(res.slots)}개)")

print("\n=== 비교 캡처 생성 완료 ===")
