#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
03_lease_guard.py
Workflowy lease_* 메커니즘을 벤치마킹한 동시성 잠금 및 작업 임대(Lease) 가드 도구.
에이전트와 사용자가 동시에 동일한 노드를 편집하다가 발생하는 덮어쓰기 유실(Race Condition)을 방지합니다.
"""

import sys
import os
import argparse
import json
import time
import uuid

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def get_lease_path(outline_path: str) -> str:
    return outline_path + ".lease"


def load_lease(lease_path: str) -> dict:
    if not os.path.exists(lease_path):
        return {}
    try:
        with open(lease_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_lease(lease_path: str, data: dict):
    with open(lease_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def clean_expired(leases: dict, now: float) -> dict:
    valid = {}
    for token, item in leases.items():
        if item.get("expires_at", 0) > now:
            valid[token] = item
    return valid


def main():
    parser = argparse.ArgumentParser(description="Workflowy lease_* 기반 아웃라인 동시성 락 가드")
    parser.add_argument("path", help="대상 .outline 파일 경로")
    parser.add_argument("action", choices=["acquire", "release", "touch", "inspect"], help="수행할 락 액션")
    parser.add_argument("--token", help="기존 획득한 임대 토큰(UUID) (release, touch에 필요)")
    parser.add_argument("--ttl", type=int, default=60, help="임대 유효시간(초) (기본: 60초)")
    parser.add_argument("--node-ids", nargs="*", default=["all"], help="잠글 대상 노드 ID 리스트 (기본: all 전체 문서)")
    parser.add_argument("--agent-id", default="AntigravityAgent", help="에이전트 식별자")

    args = parser.parse_args()
    lease_path = get_lease_path(args.path)
    now = time.time()
    leases = clean_expired(load_lease(lease_path), now)

    if args.action == "inspect":
        if not leases:
            print(f"[INSPECT] {os.path.basename(args.path)}: 현재 활성 락 없음 (작업 가능)")
            sys.exit(0)
        print(f"[INSPECT] {os.path.basename(args.path)}: 총 {len(leases)}개 활성 락 존재")
        for token, item in leases.items():
            rem = int(item["expires_at"] - now)
            print(f"  🔒 Token: {token} | Agent: {item.get('agent_id')} | Target: {item.get('targets')} | 잔여: {rem}초")
        sys.exit(0)

    elif args.action == "acquire":
        # 기존 락과의 충돌 검사
        for token, item in leases.items():
            locked_targets = item.get("targets", [])
            if "all" in locked_targets or "all" in args.node_ids:
                print(f"[CONFLICT] 다른 프로세스({item.get('agent_id')})가 이미 락을 보유 중입니다 (남은 시간: {int(item['expires_at'] - now)}초)", file=sys.stderr)
                sys.exit(1)
            # 노드 ID 중복 교집합 검사
            overlap = set(locked_targets).intersection(set(args.node_ids))
            if overlap:
                print(f"[CONFLICT] 노드 {overlap}가 이미 락으로 잠겨 있습니다.", file=sys.stderr)
                sys.exit(1)

        token = str(uuid.uuid4())
        leases[token] = {
            "token": token,
            "agent_id": args.agent_id,
            "targets": args.node_ids,
            "acquired_at": now,
            "expires_at": now + args.ttl
        }
        save_lease(lease_path, leases)
        print(f"[PASS] 락 획득 성공 (Token: {token}, TTL: {args.ttl}초)")
        sys.exit(0)

    elif args.action == "release":
        if not args.token:
            print("[ERROR] 락 해제에는 --token이 필수입니다.", file=sys.stderr)
            sys.exit(1)
        if args.token in leases:
            del leases[args.token]
            if leases:
                save_lease(lease_path, leases)
            else:
                if os.path.exists(lease_path):
                    os.remove(lease_path)
            print(f"[PASS] 락 해제 성공 (Token: {args.token})")
            sys.exit(0)
        else:
            print(f"[WARN] 해당 토큰은 이미 만료되었거나 존재하지 않습니다: {args.token}")
            sys.exit(0)

    elif args.action == "touch":
        if not args.token or args.token not in leases:
            print(f"[ERROR] 연장할 유효 락을 찾을 수 없습니다: {args.token}", file=sys.stderr)
            sys.exit(1)
        leases[args.token]["expires_at"] = now + args.ttl
        save_lease(lease_path, leases)
        print(f"[PASS] 락 유효시간 연장 성공 (Token: {args.token}, 신규 TTL: {args.ttl}초)")
        sys.exit(0)


if __name__ == "__main__":
    main()
