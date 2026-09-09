import importlib.util
import io
import json
from pathlib import Path
from PIL import Image
try:
    import pymupdf as fitz
except ImportError:
    import fitz

# scaffold_renderer 로드
spec = importlib.util.spec_from_file_location("sr", "workbench/05.llm_tuning/02.reconstruct/vision/scaffold_renderer.py")
sr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sr)

brain_dir = Path(r"C:\Users\knee2\.gemini\antigravity-ide\brain\20a324cf-aa3b-4194-9638-fe0ae7b315fc")
staging_dir = Path("workbench/05.llm_tuning/02.reconstruct_v2/staging")
raw_dir = Path("workbench/05.llm_tuning/01.outline_extraction_v2/01.dataset/raw")

cases = [
    ("디딤돌_참가신청서_딥드론", "디딤돌_참가신청서_딥드론.pdf"),
    ("11월_디딤돌_회의록", "11월_디딤돌_회의록.pdf"),
    ("Atticus_LLC_Invoice_000081709", "Atticus_LLC_Invoice_000081709.pdf"),
]

for doc_id, pdf_name in cases:
    json_path = staging_dir / f"scaffold_v2_{doc_id}.json"
    pdf_path = raw_dir / pdf_name
    if not json_path.exists() or not pdf_path.exists():
        continue

    data = json.loads(json_path.read_text(encoding="utf-8"))
    html = data["htmlContent"]

    # 1페이지 HTML만 엄격하게 분리
    # <div data-type="scaffold-page" ...> ... </div>\n\n<div data-type="scaffold-page"
    if "\n\n<div data-type=\"scaffold-page\"" in html:
        p1_html = html.split("\n\n<div data-type=\"scaffold-page\"")[0]
    else:
        p1_html = html

    # 원본 1페이지 렌더링
    doc = fitz.open(pdf_path)
    orig_pix = doc[0].get_pixmap(dpi=144, alpha=False)
    orig_img = Image.open(io.BytesIO(orig_pix.tobytes("png")))
    doc.close()

    # scaffold 1페이지 렌더링
    png_bytes = sr.render_scaffold_png(p1_html, dpi=144)
    scaffold_img = Image.open(io.BytesIO(png_bytes))

    # 나란히 합성
    w = orig_img.width + scaffold_img.width + 40
    h = max(orig_img.height, scaffold_img.height) + 40
    comp = Image.new("RGB", (w, h), (245, 247, 250))
    comp.paste(orig_img, (0, 20))
    comp.paste(scaffold_img, (orig_img.width + 40, 20))

    out_file = brain_dir / f"clean_compare_v2_{doc_id}.png"
    comp.save(str(out_file))
    print(f"[*] 완료: {out_file.name}")
