#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
04_manage_attachments.py
Workflowy attachments_* 메커니즘을 벤치마킹한 아웃라인 미디어 첨부 및 자산 바인딩 도구.
이미지나 도면을 볼트 에셋 저장소에 안전하게 복사하고 노드에 원자적으로 바인딩(attach)하거나,
노드의 첨부파일을 로컬 캐시로 추출(pull)하여 멀티모달(Vision) 분석을 지원합니다.
"""

import sys
import os
import argparse
import json
import shutil
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def find_node(nodes: list, target_id: str) -> dict:
    for node in nodes:
        if node.get("id") == target_id:
            return node
        children = node.get("children", [])
        if isinstance(children, list):
            res = find_node(children, target_id)
            if res:
                return res
    return None


def resolve_asset_dir(outline_path: str) -> str:
    """아웃라인 파일과 인접한 '이미지' 폴더 또는 현재 폴더를 에셋 폴더로 지정"""
    parent_dir = os.path.dirname(os.path.abspath(outline_path))
    image_dir = os.path.join(parent_dir, "이미지")
    if os.path.exists(image_dir):
        return image_dir
    os.makedirs(image_dir, exist_ok=True)
    return image_dir


def main():
    parser = argparse.ArgumentParser(description="Workflowy attachments_* 기반 아웃라인 첨부파일 관리 도구")
    parser.add_argument("path", help="대상 .outline 파일 경로")
    parser.add_argument("action", choices=["attach", "pull", "detach"], help="수행할 작업 (attach: 첨부, pull: 추출, detach: 분리)")
    parser.add_argument("--node-id", required=True, help="대상 노드 ID")
    parser.add_argument("--file", help="첨부할 로컬 소스 파일 경로 (attach 액션에 필수)")
    parser.add_argument("--copy-to-assets", action="store_true", default=True, help="볼트 에셋 폴더로 파일 자동 복사 (기본: True)")

    args = parser.parse_args()

    if not os.path.exists(args.path):
        print(f"[ERROR] 아웃라인 파일을 찾을 수 없습니다: {args.path}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(args.path, "r", encoding="utf-8") as f:
            doc = json.load(f)
    except Exception as e:
        print(f"[ERROR] JSON 로드 실패: {e}", file=sys.stderr)
        sys.exit(1)

    root_nodes = doc.get("rootNodes", [])
    target_node = find_node(root_nodes, args.node_id)
    if not target_node:
        print(f"[ERROR] 대상 노드를 찾을 수 없습니다: {args.node_id}", file=sys.stderr)
        sys.exit(1)

    if args.action == "attach":
        if not args.file or not os.path.exists(args.file):
            print(f"[ERROR] 첨부할 소스 파일을 찾을 수 없습니다: {args.file}", file=sys.stderr)
            sys.exit(1)

        src_filename = os.path.basename(args.file)
        asset_dir = resolve_asset_dir(args.path)
        dest_path = os.path.join(asset_dir, src_filename)

        # 파일 복사
        shutil.copy2(args.file, dest_path)

        # 노드에 바인딩
        target_node["file"] = {
            "target": src_filename
        }
        target_node["updatedAt"] = int(time.time() * 1000)
        doc["updatedAt"] = int(time.time() * 1000)

        with open(args.path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)

        print(f"[PASS] 노드 [{args.node_id}]에 첨부 완료: target='{src_filename}' (저장 경로: {dest_path})")
        sys.exit(0)

    elif args.action == "pull":
        file_obj = target_node.get("file")
        if not file_obj or not file_obj.get("target"):
            print(f"[WARN] 노드 [{args.node_id}]에는 첨부된 파일이 없습니다.", file=sys.stderr)
            sys.exit(1)

        target_name = file_obj.get("target")
        parent_dir = os.path.dirname(os.path.abspath(args.path))
        
        # 파일 위치 탐색 (1. 인접 '이미지/' 폴더, 2. 현재 폴더)
        possible_paths = [
            os.path.join(parent_dir, "이미지", target_name),
            os.path.join(parent_dir, target_name)
        ]

        found_path = None
        for p in possible_paths:
            if os.path.exists(p):
                found_path = p
                break

        if not found_path:
            print(f"[ERROR] 첨부된 물리적 파일을 찾을 수 없습니다: {target_name}", file=sys.stderr)
            sys.exit(1)

        print(f"[PASS] 첨부파일 경로 확인: {found_path}")
        # 절대 경로 반환 (에이전트가 view_file로 열 수 있도록)
        print(f"FILE_PATH: {found_path}")
        sys.exit(0)

    elif args.action == "detach":
        if "file" in target_node:
            del target_node["file"]
            target_node["updatedAt"] = int(time.time() * 1000)
            doc["updatedAt"] = int(time.time() * 1000)
            with open(args.path, "w", encoding="utf-8", newline="\n") as f:
                json.dump(doc, f, ensure_ascii=False, indent=2)
            print(f"[PASS] 노드 [{args.node_id}] 첨부파일 해제 완료")
        else:
            print(f"[INFO] 노드 [{args.node_id}]에 첨부된 파일이 없습니다.")
        sys.exit(0)


if __name__ == "__main__":
    main()
