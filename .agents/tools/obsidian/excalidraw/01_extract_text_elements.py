#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
[01_extract_text_elements.py]
역할: Excalidraw 마크다운 파일 상단에 위치한 '## Text Elements'와 '## Embedded Files'를
      '## Drawing'의 무거운 데이터 없이 초고속으로 슬라이싱하여 추출합니다.
목적: 제로 토큰 낭비, 실시간 아이디어 교환, 화두 및 키워드 목록 즉시 파악
"""

import sys
import os
import re
import argparse
import json

# Windows 콘솔 인코딩 대응 (cp949 방지)
if sys.platform.startswith("win"):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

def extract_text_elements(file_path: str, keep_ids: bool = False, as_json: bool = False):
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # ## Drawing 섹션 이전까지만 절삭 (무거운 드로잉 데이터 배제)
    drawing_pos = content.find("## Drawing")
    if drawing_pos != -1:
        header_content = content[:drawing_pos]
    else:
        drawing_pos_comment = content.find("%%\n## Drawing")
        if drawing_pos_comment != -1:
            header_content = content[:drawing_pos_comment]
        else:
            header_content = content

    # 1. Text Elements 추출
    text_elements = []
    text_section_match = re.search(r'## Text Elements\s*\n([\s\S]*?)(?=\n## Embedded Files|\n%%\s*|\Z)', header_content)
    if text_section_match:
        raw_text_section = text_section_match.group(1).strip()
        # 블록 단위로 분리 (^blockId 기준 또는 연속 빈줄 기준)
        blocks = re.split(r'\n{2,}', raw_text_section)
        for block in blocks:
            block = block.strip()
            if not block:
                continue
            
            # ^blockId 추출
            block_id_match = re.search(r'\^([a-zA-Z0-9_-]+)$', block)
            block_id = block_id_match.group(1) if block_id_match else None
            
            if not keep_ids and block_id_match:
                cleaned_text = re.sub(r'\s*\^[a-zA-Z0-9_-]+$', '', block).strip()
            else:
                cleaned_text = block
                
            text_elements.append({
                "id": block_id,
                "text": cleaned_text
            })

    # 2. Embedded Files 추출
    embedded_files = []
    embed_section_match = re.search(r'## Embedded Files\s*\n([\s\S]*?)(?=\n%%\s*|\Z)', header_content)
    if embed_section_match:
        raw_embed_section = embed_section_match.group(1).strip()
        for line in raw_embed_section.splitlines():
            line = line.strip()
            if not line:
                continue
            # 형식: hash: [[파일명]]
            m = re.match(r'([a-f0-9]+):\s*\[\[(.*?)\]\]', line)
            if m:
                embedded_files.append({
                    "file_id": m.group(1),
                    "file_name": m.group(2)
                })

    if as_json:
        result = {
            "source_file": file_path,
            "text_elements_count": len(text_elements),
            "embedded_files_count": len(embedded_files),
            "text_elements": text_elements,
            "embedded_files": embedded_files
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"=== [Excalidraw Text Elements: {os.path.basename(file_path)}] ===")
        print(f"총 텍스트 블록: {len(text_elements)}개 | 임베드 파일: {len(embedded_files)}개\n")
        
        print("--- [텍스트 블록 목록] ---")
        for idx, item in enumerate(text_elements, 1):
            id_tag = f" [ID: {item['id']}]" if item['id'] else ""
            print(f"{idx}. {item['text']}{id_tag}")
            
        if embedded_files:
            print("\n--- [임베드 파일 (스크린샷/첨부)] ---")
            for idx, item in enumerate(embedded_files, 1):
                print(f"{idx}. [[{item['file_name']}]] (Hash: {item['file_id'][:8]}...)")


def main():
    parser = argparse.ArgumentParser(
        description="Excalidraw 마크다운에서 상단 Text Elements 및 Embedded Files 초경량 추출 도구"
    )
    parser.add_argument("file", help="Excalidraw 마크다운 파일 경로 (.md)")
    parser.add_argument("--keep-ids", action="store_true", help="텍스트 뒤의 ^blockId 보존")
    parser.add_argument("--json", action="store_true", help="결과를 JSON 포맷으로 출력")

    args = parser.parse_args()
    extract_text_elements(args.file, keep_ids=args.keep_ids, as_json=args.json)


if __name__ == "__main__":
    main()
