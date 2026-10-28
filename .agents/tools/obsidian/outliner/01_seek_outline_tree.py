#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
01_seek_outline_tree.py
Workflowy tree_seek 메커니즘을 벤치마킹한 초경량 아웃라인 트리 탐색 및 필터링 CLI 도구.
수천 줄의 원시 JSON 파일에서 노이즈를 걷어내고, 토큰을 90% 이상 절감하는 평탄화된 텍스트 스트림을 제공합니다.
"""

import sys
import os
import argparse
import json
from typing import Optional, Dict, Any, List

# Windows 콘솔 cp949 인코딩 충돌 방지
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def load_outline(file_path: str) -> dict:
    if not os.path.exists(file_path):
        print(f"[ERROR] 파일을 찾을 수 없습니다: {file_path}", file=sys.stderr)
        sys.exit(1)
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] JSON 파싱 실패: {e}", file=sys.stderr)
        sys.exit(1)


def build_parent_map(nodes: List[dict], parent_id: Optional[str] = None, p_map: dict = None, n_map: dict = None):
    if p_map is None:
        p_map = {}
    if n_map is None:
        n_map = {}
    for node in nodes:
        nid = node.get("id")
        if nid:
            p_map[nid] = parent_id
            n_map[nid] = node
        children = node.get("children", [])
        if isinstance(children, list):
            build_parent_map(children, nid, p_map, n_map)
    return p_map, n_map


def seek_downward(
    node: dict,
    current_depth: int,
    max_depth: Optional[int],
    query: Optional[str],
    truncate: int,
    results: list
):
    if max_depth is not None and current_depth > max_depth:
        return

    text = node.get("text", "")
    nid = node.get("id", "no-id")
    children = node.get("children", [])
    child_count = len(children)
    is_folded = node.get("isFolded", False)
    has_file = "file" in node
    note = node.get("note")

    # 검색 쿼리 검사
    matches = True
    if query:
        matches = query.lower() in text.lower() or (note and query.lower() in note.lower())

    if matches:
        display_text = text if len(text) <= truncate else text[:truncate] + "..."
        markers = []
        if child_count > 0:
            markers.append(f"({child_count})")
        if is_folded:
            markers.append("[folded]")
        if has_file:
            markers.append("[attachment]")
        
        marker_str = " " + " ".join(markers) if markers else ""
        indent = "  " * current_depth
        bullet = "•" if current_depth > 0 else "📌"
        line = f"[{nid}] {indent}{bullet} {display_text}{marker_str}"
        if note:
            note_indent = "  " * (current_depth + 1)
            display_note = note if len(note) <= truncate else note[:truncate] + "..."
            line += f"\n{note_indent}💬 note: {display_note}"
        results.append(line)

    for child in children:
        seek_downward(child, current_depth + 1, max_depth, query, truncate, results)


def seek_upward(target_id: str, p_map: dict, n_map: dict, truncate: int, results: list):
    curr = target_id
    ancestors = []
    while curr:
        node = n_map.get(curr)
        if node:
            ancestors.append(node)
        curr = p_map.get(curr)

    # 루트부터 대상 노드까지 순서대로 출력
    for depth, node in enumerate(reversed(ancestors)):
        nid = node.get("id", "")
        text = node.get("text", "")
        display_text = text if len(text) <= truncate else text[:truncate] + "..."
        indent = "  " * depth
        results.append(f"[{nid}] {indent}➔ {display_text}")


def main():
    parser = argparse.ArgumentParser(description="Workflowy tree_seek 기반 아웃라인 트리 탐색기")
    parser.add_argument("path", help="탐색할 .outline 파일 경로")
    parser.add_argument("--node-id", help="탐색을 시작할 특정 노드 ID (미지정 시 전체 루트)")
    parser.add_argument("--depth", type=int, default=None, help="최대 탐색 깊이 (0: 해당 레벨만, 1: 1단계 자식까지)")
    parser.add_argument("--query", help="텍스트 검색 필터")
    parser.add_argument("--direction", choices=["down", "up"], default="down", help="탐색 방향 (down: 하향 트리, up: 상향 조상 족보)")
    parser.add_argument("--truncate", type=int, default=120, help="노드 텍스트 말줄임 제한 (기본: 120자)")
    parser.add_argument("--format", choices=["text", "json"], default="text", help="출력 포맷")

    args = parser.parse_args()
    doc = load_outline(args.path)
    root_nodes = doc.get("rootNodes", [])

    p_map, n_map = build_parent_map(root_nodes)

    results = []

    if args.direction == "up":
        if not args.node_id:
            print("[ERROR] --direction up 모드는 --node-id가 필수입니다.", file=sys.stderr)
            sys.exit(1)
        seek_upward(args.node_id, p_map, n_map, args.truncate, results)
    else:
        # 하향 탐색
        if args.node_id:
            target_node = n_map.get(args.node_id)
            if not target_node:
                print(f"[ERROR] 노드 ID를 찾을 수 없습니다: {args.node_id}", file=sys.stderr)
                sys.exit(1)
            seek_downward(target_node, 0, args.depth, args.query, args.truncate, results)
        else:
            for node in root_nodes:
                seek_downward(node, 0, args.depth, args.query, args.truncate, results)

    if args.format == "json":
        print(json.dumps({"file": args.path, "total": len(results), "items": results}, ensure_ascii=False, indent=2))
    else:
        title = doc.get("title", os.path.basename(args.path))
        print(f"=== 🌲 Outline Tree: {title} (총 {len(results)}개 노드 출력) ===")
        for line in results:
            print(line)
        print("=" * 60)


if __name__ == "__main__":
    main()
