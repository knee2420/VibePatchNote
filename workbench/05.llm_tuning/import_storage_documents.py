"""
[workbench/05.llm_tuning] storage documents 임포트 및 실험실 동기화 스크립트.
apps/api/storage/documents에 저장된 실제 outline 데이터 및 uploads의 PDF들을
실험실(workbench/05.llm_tuning)로 가져와 01.outline 및 02.reconstruct의 SSOT로 연동합니다.
"""
from __future__ import annotations

import io
import json
import shutil
import sys
from pathlib import Path

# 윈도우 콘솔 UTF-8 출력 강제
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
STORAGE_DOCS_DIR = PROJECT_ROOT / "apps" / "api" / "storage" / "documents"
UPLOADS_DIR = PROJECT_ROOT / "apps" / "api" / "uploads"

TUNING_DIR = PROJECT_ROOT / "workbench" / "05.llm_tuning"
V2_DIR = TUNING_DIR / "01.outline_extraction_v2"
V2_STAGING = V2_DIR / "staging" / "step1_outline"
V2_RAW_PDF = V2_DIR / "01.dataset" / "raw"

RECON_DIR = TUNING_DIR / "02.reconstruct"
RECON_STAGING = RECON_DIR / "staging"

V2_STAGING.mkdir(parents=True, exist_ok=True)
V2_RAW_PDF.mkdir(parents=True, exist_ok=True)
RECON_STAGING.mkdir(parents=True, exist_ok=True)


def normalize_name(name: str) -> str:
    """파일명 및 폴더명 표준화."""
    return name.replace(" ", "_").replace("__", "_")


def main():
    print("=" * 68)
    print("  [*] apps/api/storage/documents -> workbench/05.llm_tuning 임포트 시작")
    print("=" * 68)

    if not STORAGE_DOCS_DIR.exists():
        print(f"[!] Storage directory not found: {STORAGE_DOCS_DIR}")
        return

    # 1. PDF 파일 동기화
    pdf_files = list(UPLOADS_DIR.glob("*.pdf"))
    pdf_map = {}
    for p in pdf_files:
        norm_stem = normalize_name(p.stem)
        pdf_map[norm_stem] = p
        # 복사
        dest_pdf = V2_RAW_PDF / f"{norm_stem}.pdf"
        if not dest_pdf.exists() or dest_pdf.stat().st_size != p.stat().st_size:
            shutil.copy2(p, dest_pdf)
            print(f"[*] PDF 복사: {p.name} -> {dest_pdf.name}")

    # 2. 문서 폴더 탐색
    doc_dirs = [d for d in STORAGE_DOCS_DIR.iterdir() if d.is_dir()]
    print(f"\n총 {len(doc_dirs)}개 저장소 문서 감지됨.\n")

    imported_docs = []

    for d in sorted(doc_dirs):
        doc_id = normalize_name(d.name)
        outline_tree_file = d / "outline" / "outline_tree.json"
        manifest_file = d / "outline" / "manifest.json"

        if not outline_tree_file.exists():
            print(f"[-] {d.name}: outline_tree.json 없음. 건너뜀.")
            continue

        try:
            tree_data = json.loads(outline_tree_file.read_text(encoding="utf-8"))
            dest_file = V2_STAGING / f"output_{doc_id}.json"
            dest_file.write_text(json.dumps(tree_data, ensure_ascii=False, indent=2), encoding="utf-8")

            total_pages = tree_data.get("total_pages", 0)
            outlines_count = len(tree_data.get("outlines", []))

            print(f"[+] 문서 임포트 완료: {doc_id}")
            print(f"    - 페이지: {total_pages}p | 최상위 노드: {outlines_count}개")
            print(f"    - 대상 파일: {dest_file.relative_to(PROJECT_ROOT)}")

            imported_docs.append({
                "id": doc_id,
                "dir_name": d.name,
                "total_pages": total_pages,
            })
        except Exception as e:
            print(f"[!] {d.name} 임포트 에러: {e}")

    print("\n" + "=" * 68)
    print(f"  총 {len(imported_docs)}개 문서의 Outline 데이터 임포트 완료.")
    print("=" * 68)


if __name__ == "__main__":
    main()
