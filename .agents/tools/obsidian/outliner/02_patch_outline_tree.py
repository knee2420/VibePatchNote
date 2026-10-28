#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
02_patch_outline_tree.py
Workflowy tree_patch 메커니즘을 벤치마킹한 원자적 아웃라인 트리 뮤테이션 CLI 도구.
텍스트 치환(replace_file_content)의 문법 파괴, 인덱스 시프트, 부모 포인터 부재 문제를 완전히 해결합니다.
"""

import sys
import os
import argparse
import json
import secrets
import string
import time
import copy
from typing import Optional, List, Dict, Any, Tuple

# Windows 콘솔 인코딩 대응
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def gen_id() -> str:
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(12))


def load_outline(file_path: str) -> dict:
    if not os.path.exists(file_path):
        print(f"[ERROR] 파일을 찾을 수 없습니다: {file_path}", file=sys.stderr)
        sys.exit(1)
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] JSON 로드 실패: {e}", file=sys.stderr)
        sys.exit(1)


def save_outline(file_path: str, doc: dict):
    doc["updatedAt"] = int(time.time() * 1000)
    with open(file_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)


class OutlinePatcher:
    def __init__(self, doc: dict):
        self.doc = doc
        self.root_nodes = doc.get("rootNodes", [])
        self.now = int(time.time() * 1000)

    def _find_node_and_container(
        self, target_id: str, nodes: List[dict]
    ) -> Tuple[Optional[dict], Optional[List[dict]], Optional[int]]:
        """노드, 해당 노드가 속한 부모 리스트(container), 인덱스를 반환합니다."""
        for idx, node in enumerate(nodes):
            if node.get("id") == target_id:
                return node, nodes, idx
            children = node.get("children", [])
            if isinstance(children, list):
                res_node, res_container, res_idx = self._find_node_and_container(target_id, children)
                if res_node:
                    return res_node, res_container, res_idx
        return None, None, None

    def _find_node(self, target_id: str, nodes: List[dict]) -> Optional[dict]:
        node, _, _ = self._find_node_and_container(target_id, nodes)
        return node

    def _is_descendant(self, potential_child_id: str, ancestor_node: dict) -> bool:
        """순환 참조 방지: potential_child가 ancestor의 하위 노드인지 확인"""
        if ancestor_node.get("id") == potential_child_id:
            return True
        for child in ancestor_node.get("children", []):
            if self._is_descendant(potential_child_id, child):
                return True
        return False

    def op_replace(self, node_id: str, new_text: Optional[str] = None, new_note: Optional[str] = None) -> bool:
        node = self._find_node(node_id, self.root_nodes)
        if not node:
            raise ValueError(f"노드를 찾을 수 없습니다: {node_id}")
        if new_text is not None:
            node["text"] = new_text
        if new_note is not None:
            if new_note == "":
                node.pop("note", None)
            else:
                node["note"] = new_note
        node["updatedAt"] = self.now
        return True

    def _build_subtree(self, item: Any) -> dict:
        if isinstance(item, str):
            item = {"text": item}
        node = {
            "id": item.get("id") or gen_id(),
            "text": item.get("text", ""),
            "children": [self._build_subtree(c) for c in item.get("children", [])],
            "isFolded": item.get("isFolded", False),
            "createdAt": self.now,
            "updatedAt": self.now
        }
        if "note" in item and item["note"]:
            node["note"] = item["note"]
        return node

    def op_insert(
        self,
        target_id: str,
        text: str,
        position: str = "after",
        note: Optional[str] = None,
        children: Optional[list] = None
    ) -> str:
        """새 노드를 생성하여 target_id 기준 after, before, inside(자식 맨 앞/뒤)에 삽입합니다."""
        new_node = {
            "id": gen_id(),
            "text": text,
            "children": [self._build_subtree(c) for c in (children or [])],
            "isFolded": False,
            "createdAt": self.now,
            "updatedAt": self.now
        }
        if note:
            new_node["note"] = note

        if position == "inside" or position == "child":
            target_node = self._find_node(target_id, self.root_nodes)
            if not target_node:
                raise ValueError(f"부모 대상 노드를 찾을 수 없습니다: {target_id}")
            if "children" not in target_node or not isinstance(target_node["children"], list):
                target_node["children"] = []
            target_node["children"].append(new_node)
            target_node["updatedAt"] = self.now
        else:
            _, container, idx = self._find_node_and_container(target_id, self.root_nodes)
            if container is None or idx is None:
                raise ValueError(f"기준 노드를 찾을 수 없습니다: {target_id}")
            insert_idx = idx + 1 if position == "after" else idx
            container.insert(insert_idx, new_node)

        return new_node["id"]

    def op_move(self, source_id: str, new_parent_id: Optional[str] = None, position: Optional[int] = None) -> bool:
        """source 노드를 서브트리 전체와 함께 new_parent_id의 자식으로 이동합니다."""
        source_node, src_container, src_idx = self._find_node_and_container(source_id, self.root_nodes)
        if not source_node or src_container is None:
            raise ValueError(f"이동할 노드를 찾을 수 없습니다: {source_id}")

        if new_parent_id:
            dest_parent = self._find_node(new_parent_id, self.root_nodes)
            if not dest_parent:
                raise ValueError(f"목적지 부모 노드를 찾을 수 없습니다: {new_parent_id}")
            # 순환 참조 방지
            if self._is_descendant(new_parent_id, source_node):
                raise ValueError(f"순환 참조 발생: 노드 {new_parent_id}는 이동할 노드 {source_id}의 자손입니다.")
            dest_container = dest_parent.setdefault("children", [])
            dest_parent["updatedAt"] = self.now
        else:
            # 루트 레벨로 이동
            dest_container = self.root_nodes

        # 기존 위치에서 안전하게 분리
        detached_node = src_container.pop(src_idx)
        detached_node["updatedAt"] = self.now

        # 새 위치에 삽입
        if position is not None and 0 <= position <= len(dest_container):
            dest_container.insert(position, detached_node)
        else:
            dest_container.append(detached_node)

        return True

    def op_delete(self, node_id: str) -> bool:
        """노드 및 그 하위 트리를 재귀 삭제합니다."""
        _, container, idx = self._find_node_and_container(node_id, self.root_nodes)
        if container is None or idx is None:
            raise ValueError(f"삭제할 노드를 찾을 수 없습니다: {node_id}")
        container.pop(idx)
        return True


def main():
    parser = argparse.ArgumentParser(description="Workflowy tree_patch 기반 원자적 아웃라인 수정 도구")
    parser.add_argument("path", help="수정할 .outline 파일 경로")
    parser.add_argument("--replace", help="노드 내용 수정: <node_id>:<new_text>")
    parser.add_argument("--note", help="노드 메모(note) 설정 (replace와 함께 사용 가능)")
    parser.add_argument("--insert", help="새 노드 생성: <target_id>:<text>")
    parser.add_argument("--position", choices=["after", "before", "inside"], default="after", help="삽입 위치 (기본: after)")
    parser.add_argument("--move", help="노드 이동(한 depth 이동/부모 변경): <source_id>:<new_parent_id 또는 'root'>")
    parser.add_argument("--delete", help="노드 삭제: <node_id>")
    parser.add_argument("--batch", help="JSON 문자열 또는 JSON 파일 경로로 복수 작업 일괄 실행")

    args = parser.parse_args()
    # 안전한 롤백을 위한 원본 raw 텍스트 백업
    with open(args.path, "r", encoding="utf-8") as f:
        original_raw_text = f.read()

    doc = json.loads(original_raw_text)
    patcher = OutlinePatcher(doc)

    operations_applied = []

    try:
        if args.replace:
            parts = args.replace.split(":", 1)
            nid = parts[0].strip()
            text = parts[1].strip() if len(parts) > 1 else ""
            patcher.op_replace(nid, new_text=text, new_note=args.note)
            operations_applied.append(f"REPLACE [{nid}] -> '{text}'")

        if args.insert:
            parts = args.insert.split(":", 1)
            target_id = parts[0].strip()
            text = parts[1].strip() if len(parts) > 1 else ""
            new_id = patcher.op_insert(target_id, text, position=args.position, note=args.note)
            operations_applied.append(f"INSERT [{new_id}] {args.position} [{target_id}] -> '{text}'")

        if args.move:
            parts = args.move.split(":", 1)
            src_id = parts[0].strip()
            dest_id = parts[1].strip() if len(parts) > 1 else "root"
            parent_id = None if dest_id == "root" else dest_id
            patcher.op_move(src_id, new_parent_id=parent_id)
            operations_applied.append(f"MOVE [{src_id}] under [{dest_id}]")

        if args.delete:
            del_id = args.delete.strip()
            patcher.op_delete(del_id)
            operations_applied.append(f"DELETE [{del_id}]")

        if args.batch:
            batch_data = None
            if os.path.exists(args.batch):
                with open(args.batch, "r", encoding="utf-8") as bf:
                    batch_data = json.load(bf)
            else:
                batch_data = json.loads(args.batch)

            if isinstance(batch_data, list):
                for req in batch_data:
                    op = req.get("op")
                    if op == "replace":
                        patcher.op_replace(req["id"], req.get("text"), req.get("note"))
                        operations_applied.append(f"BATCH REPLACE [{req['id']}]")
                    elif op == "insert":
                        pos = req.get("position", "after")
                        nid = patcher.op_insert(
                            req["target_id"],
                            req["text"],
                            position=pos,
                            note=req.get("note"),
                            children=req.get("children")
                        )
                        operations_applied.append(f"BATCH INSERT [{nid}] {pos} [{req['target_id']}]")
                    elif op == "move":
                        pid = None if req.get("under") == "root" else req.get("under")
                        patcher.op_move(req["source_id"], new_parent_id=pid, position=req.get("index"))
                        operations_applied.append(f"BATCH MOVE [{req['source_id']}] under [{req.get('under')}]")
                    elif op == "delete":
                        patcher.op_delete(req["id"])
                        operations_applied.append(f"BATCH DELETE [{req['id']}]")

        if not operations_applied:
            print("[WARN] 적용할 작업이 지정되지 않았습니다.", file=sys.stderr)
            sys.exit(0)

        # 모든 작업 성공 시 디스크에 원자적 저장
        save_outline(args.path, patcher.doc)
        print(f"[SUCCESS] {len(operations_applied)}개 트리 연산 트랜잭션 성공 완료:")
        for op in operations_applied:
            print(f"  ✓ {op}")
        sys.exit(0)

    except Exception as e:
        print(f"[FAIL] 트리 연산 실패 (롤백 적용됨): {e}", file=sys.stderr)
        # 완전 롤백: 원본 텍스트 100% 무손실 복원
        with open(args.path, "w", encoding="utf-8", newline="\n") as f:
            f.write(original_raw_text)
        sys.exit(1)


if __name__ == "__main__":
    main()
