#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
[03_resolve_visual_images.py]
역할: Excalidraw 마크다운에 연결된 시각 자산(Visual Assets)의 실제 로컬 절대 경로를 해결합니다.
      1) Excalidraw 자동 내보내기 이미지 (.png / .svg)
      2) 캔버스 내부에 삽입된 스크린샷/임베드 파일 ([[Pasted Image ...]])
목적: 에이전트가 view_file 도구를 통해 멀티모달 비전으로 인간 사용자와 동일한 화면을 직접 볼 수 있도록 바인딩
"""

import sys
import os
import re
import argparse

# Windows 콘솔 인코딩 대응 (cp949 방지)
if sys.platform.startswith("win"):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")


def find_vault_root(start_dir: str) -> str:
    """디렉터리 상위로 올라가며 .obsidian 폴더가 있는 볼트 루트 탐색"""
    curr = os.path.abspath(start_dir)
    while True:
        if os.path.exists(os.path.join(curr, ".obsidian")):
            return curr
        parent = os.path.dirname(curr)
        if parent == curr:
            break
        curr = parent
    return os.path.abspath(start_dir)


def search_file_in_vault(vault_root: str, filename: str) -> str:
    """볼트 내에서 파일명으로 실제 경로 재귀 탐색"""
    # 1. 일반적인 첨부 폴더 먼저 우선 탐색
    common_subdirs = ["이미지", "attachments", "assets", "resources", "files"]
    for sub in common_subdirs:
        candidate = os.path.join(vault_root, sub, filename)
        if os.path.exists(candidate):
            return candidate

    # 2. 볼트 전체 재귀 탐색
    for root, dirs, files in os.walk(vault_root):
        # 불필요한 메타 디렉터리 건너뛰기
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ["node_modules", ".git"]]
        if filename in files:
            return os.path.join(root, filename)
            
    return None


def resolve_images(file_path: str):
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    abs_file_path = os.path.abspath(file_path)
    file_dir = os.path.dirname(abs_file_path)
    base_name = os.path.splitext(os.path.basename(abs_file_path))[0]
    vault_root = find_vault_root(file_dir)

    with open(abs_file_path, "r", encoding="utf-8") as f:
        content = f.read()

    print(f"=== [Excalidraw Visual Asset Resolver: {os.path.basename(file_path)}] ===")
    print(f"📁 Vault Root: {vault_root}\n")

    # 1. 캔버스 전체 내보내기 이미지 탐색 (.png / .svg / .excalidraw.png)
    export_candidates = [
        os.path.join(file_dir, f"{base_name}.png"),
        os.path.join(file_dir, f"{base_name}.svg"),
        os.path.join(file_dir, f"{base_name}.excalidraw.png"),
        os.path.join(file_dir, f"{base_name}.excalidraw.svg")
    ]
    found_exports = [p for p in export_candidates if os.path.exists(p)]

    print("--- [1. 캔버스 전체 렌더링 이미지 (Full Canvas View)] ---")
    if found_exports:
        for p in found_exports:
            size_kb = os.path.getsize(p) / 1024
            uri = "file:///" + p.replace("\\", "/")
            print(f"✅ 발견: {os.path.basename(p)} ({size_kb:.1f} KB)")
            print(f"   절대 경로: {p}")
            print(f"   Agent view_file URI: {uri}")
    else:
        print("ℹ️ 내보내기 이미지(.png/.svg)가 아직 생성되지 않았습니다.")
        print("   👉 Obsidian Excalidraw 설정에서 'Auto-export PNG/SVG'를 켜거나,")
        print("   👉 Excalidraw 메뉴의 'Export to PNG'를 실행하면 생성됩니다.\n")

    # 2. 캔버스 내부 임베드 이미지 탐색 (## Embedded Files)
    embedded_filenames = []
    embed_section_match = re.search(r'## Embedded Files\s*\n([\s\S]*?)(?=\n%%\s*|\Z)', content)
    if embed_section_match:
        for line in embed_section_match.group(1).splitlines():
            line = line.strip()
            m = re.match(r'([a-f0-9]+):\s*\[\[(.*?)\]\]', line)
            if m:
                embedded_filenames.append((m.group(1), m.group(2)))

    print("\n--- [2. 캔버스 내부 삽입 스크린샷/이미지 (Embedded Snapshots)] ---")
    if embedded_filenames:
        print(f"총 {len(embedded_filenames)}개의 첨부 이미지가 링크되어 있습니다:\n")
        for idx, (fhash, fname) in enumerate(embedded_filenames, 1):
            resolved_path = search_file_in_vault(vault_root, fname)
            if resolved_path:
                size_kb = os.path.getsize(resolved_path) / 1024
                uri = "file:///" + resolved_path.replace("\\", "/")
                print(f"{idx}. 📷 [[{fname}]] ({size_kb:.1f} KB)")
                print(f"   - 절대 경로: {resolved_path}")
                print(f"   - Agent view_file URI: {uri}")
            else:
                print(f"{idx}. ⚠️ [[{fname}]] (볼트 내에서 실제 파일을 찾지 못함)")
    else:
        print("ℹ️ 캔버스 내부에 삽입된 이미지 파일이 없습니다.")


def main():
    parser = argparse.ArgumentParser(
        description="Excalidraw 파일에 연결된 시각 이미지(PNG/SVG/첨부스크린샷)의 로컬 절대 경로를 해결하는 도구"
    )
    parser.add_argument("file", help="Excalidraw 마크다운 파일 (.md)")

    args = parser.parse_args()
    resolve_images(args.file)


if __name__ == "__main__":
    main()
