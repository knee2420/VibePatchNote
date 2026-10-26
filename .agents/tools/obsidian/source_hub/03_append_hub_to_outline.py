#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
03_append_hub_to_outline.py
수급처 카드의 검증된 신규 허브를 상위 아웃라인 5번 마스터 레지스트리에 자동 등록하는 공식 CLI 도구.
- 4번 노드(서식 템플릿 수급처 분류 기준)의 38개 정규 어휘 화이트리스트 강제 검증 (OUT-TAX-001)
- 8대 기준 8개 뱃지 구조 검증 (OUT-TAX-002)
- 동일 플랫폼 / URL 중복 사전 차단 (L-10)
- LF 줄끝 보장 및 validate_outline.py 자동 연동 검증
"""

import sys
import os
import argparse
import json
import re
import secrets
import string
import subprocess
import time
import urllib.parse

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def gen_id() -> str:
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(12))


DEFAULT_OUTLINE_PATH = (
    r"c:\망고독 관련 자료\프로젝트_매니지먼트\What-s-in-my-head\3.📦(Resource) 자료"
    r"\📑 문서_서식_수집_파이프라인\디지털_문서_서식_플랫폼_정의_및_글로벌_벤치마크.outline"
)


def extract_node4_taxonomy(data: dict) -> tuple[set[str], dict[str, list[str]]]:
    """4번 노드에서 8대 기준 및 정규 어휘 목록을 추출합니다."""
    root_nodes = data.get("rootNodes", [])
    node4 = None
    for n in root_nodes:
        txt = n.get("text", "")
        if "4." in txt and "분류 기준" in txt:
            node4 = n
            break

    if not node4:
        raise ValueError("아웃라인에서 '4. 서식 템플릿 수급처 분류 기준' 노드를 찾을 수 없습니다.")

    taxonomy_dict: dict[str, list[str]] = {}
    allowed_terms: set[str] = set()

    for crit in node4.get("children", []):
        crit_title = crit.get("text", "").strip()
        items = [c.get("text", "").strip() for c in crit.get("children", []) if c.get("text")]
        taxonomy_dict[crit_title] = items
        allowed_terms.update(items)

    return allowed_terms, taxonomy_dict


def get_host(u: str) -> str:
    try:
        p = urllib.parse.urlparse(u)
        h = p.netloc.lower()
        if h.startswith("www."):
            h = h[4:]
        return h
    except Exception:
        return ""


def append_hub(
    card_name: str,
    header_name: str,
    display_name: str,
    url: str,
    badge_str: str,
    outline_path: str = DEFAULT_OUTLINE_PATH,
    parent_target: str = "",
) -> bool:
    if not os.path.exists(outline_path):
        print(f"[FAIL] 아웃라인 파일이 존재하지 않습니다: {outline_path}")
        return False

    with open(outline_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. 4번 노드 정규 어휘 추출 및 뱃지 검증
    allowed_terms, tax_dict = extract_node4_taxonomy(data)

    badges = re.findall(r"【(.*?)】", badge_str)
    if len(badges) != 8:
        print(f"[FAIL] 뱃지는 정확히 8대 기준(8개 뱃지)이어야 합니다. 현재: {len(badges)}개")
        print(f"입력값: {badge_str}")
        return False

    for b in badges:
        terms = [t.strip() for t in b.split(" · ")]
        for term in terms:
            if not term:
                continue
            if term not in allowed_terms:
                print(f"[FAIL] 4번 노드에 정의되지 않은 비표준 어휘 감지: '{term}'")
                print("=== 4번 노드 허용 정규 어휘 목록 ===")
                for crit, items in tax_dict.items():
                    print(f"  * {crit}: {', '.join(items)}")
                return False

    # 2. 5번 노드 찾기
    root_nodes = data.get("rootNodes", [])
    node5 = None
    for n in root_nodes:
        txt = n.get("text", "")
        if "5." in txt and "수급처" in txt:
            node5 = n
            break

    if not node5:
        print("[FAIL] 아웃라인에서 '5. 실제 조사 완료된 수급처 허브 목록' 노드를 찾을 수 없습니다.")
        return False

    # 3. 전수 재귀 중복 검사 (URL 일치 및 도메인 일치)
    url_clean = url.strip()
    target_host = get_host(url_clean)
    title_text = f"[[{card_name}#{header_name}|{display_name}]]"

    existing_urls = {}
    existing_hosts = {}

    def collect_existing(nodes, parent_desc=""):
        for n in nodes:
            txt = n.get("text", "").strip()
            if txt.startswith("http://") or txt.startswith("https://"):
                existing_urls[txt] = parent_desc
                h = get_host(txt)
                if h:
                    existing_hosts.setdefault(h, []).append((parent_desc, txt))
            collect_existing(n.get("children", []), parent_desc=txt if "[[" in txt or "(" in txt else parent_desc)

    collect_existing(node5.get("children", []))

    if title_text in existing_urls or any(title_text in n.get("text", "") for n in node5.get("children", [])):
        print(f"[WARN] 이미 동일한 헤더 링크가 등록되어 있습니다: {title_text}")
        return False

    if url_clean in existing_urls:
        print(f"[FAIL] 이미 동일한 URL이 5번 노드에 등록되어 있습니다: {url_clean} (등록 위치: {existing_urls[url_clean]})")
        return False

    # 도메인 중복 검사 (서브카탈로그화 의무 준수)
    if target_host and target_host in existing_hosts and not parent_target:
        matched_hubs = existing_hosts[target_host]
        print(f"[FAIL] 🚫 도메인/플랫폼 중복 감지: 호스트 '{target_host}'가 이미 5번 노드에 존재합니다!")
        for m_parent, m_url in matched_hubs[:3]:
            print(f"       기존 등록 수급처: {m_parent} ({m_url})")
        print("       [L-10 규칙] 동일 플랫폼의 다른 서식은 상위 플랫폼 노드 아래 서브카탈로그로 묶어야 합니다.")
        print(f"       해결 방법: --parent \"{matched_hubs[0][0].split('(')[0].strip()}\" 옵션을 지정하여 서브카탈로그로 추가하거나,")
        print("                 기존 원천 카드의 섹션 헤더를 트랜스클루전 임베드로 재사용하십시오.")
        return False

    # 4. 등록 대상 부모 노드 결정 (최상위 vs 서브카탈로그)
    target_container = node5["children"]
    if parent_target:
        found_parent = None
        for child in node5.get("children", []):
            if parent_target in child.get("text", ""):
                found_parent = child
                break
        if not found_parent:
            # 부모 노드가 없으면 새로 생성
            now_ts = int(time.time() * 1000)
            found_parent = {
                "id": gen_id(),
                "text": parent_target,
                "children": [],
                "createdAt": now_ts,
                "updatedAt": now_ts,
            }
            node5["children"].append(found_parent)
            print(f"[INFO] 서브카탈로그 상위 플랫폼 노드를 신규 생성했습니다: {parent_target}")
        target_container = found_parent["children"]

    # 5. 새 노드 구성 (타임스탬프는 반드시 정수 epoch ms)
    now = int(time.time() * 1000)
    new_node = {
        "id": gen_id(),
        "text": title_text,
        "children": [
            {
                "id": gen_id(),
                "text": url_clean,
                "children": [],
                "createdAt": now,
                "updatedAt": now,
            },
            {
                "id": gen_id(),
                "text": badge_str.strip(),
                "children": [],
                "createdAt": now,
                "updatedAt": now,
            },
        ],
        "createdAt": now,
        "updatedAt": now,
    }

    target_container.append(new_node)
    node5["updatedAt"] = now

    # 6. LF 줄끝으로 안전하게 저장
    with open(outline_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] 5번 마스터 레지스트리에 등록 완료: {display_name}")
    print(f"     링크: {title_text}")
    print(f"     뱃지: {badge_str}")
    if parent_target:
        print(f"     상위 플랫폼(서브카탈로그): {parent_target}")

    # 7. 자동 린터 검증 실행
    validator_path = os.path.normpath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "outline_validator",
            "validate_outline.py",
        )
    )
    if os.path.exists(validator_path):
        res = subprocess.run([sys.executable, validator_path, outline_path], capture_output=True, text=True, encoding="utf-8")
        if res.returncode == 0:
            print("[PASS] validate_outline.py 린터 검증 통과!")
            return True
        else:
            print("[FAIL] 린터 검증 실패:")
            print(res.stdout or res.stderr)
            return False

    return True


def main():
    parser = argparse.ArgumentParser(
        description="수급처 카드의 신규 허브를 5번 마스터 레지스트리에 정규 어휘 검증 후 추가합니다."
    )
    parser.add_argument("--card", required=True, help="원천 카드 파일명 (예: 03. (도메인) 경영·전략 서식 수급처 Top 10.md)")
    parser.add_argument("--header", required=True, help="섹션 헤더 (예: 6. 중소벤처기업부 — 기업마당 기업업무용 서식)")
    parser.add_argument("--display", required=True, help="아웃라인 표시명 (예: 기업마당 기업업무용 서식 (국내 공공))")
    parser.add_argument("--url", required=True, help="허브 실측 URL")
    parser.add_argument(
        "--badge",
        required=True,
        help="【과금】 【도메인】 【출처】 【포맷】 【형태】 【시장】 (4번 노드 정규 어휘만 허용)",
    )
    parser.add_argument("--outline", default=DEFAULT_OUTLINE_PATH, help="아웃라인 파일 경로")
    parser.add_argument("--parent", default="", help="서브카탈로그 등록 시 상위 플랫폼 노드명 (예: Microsoft Create (create.microsoft.com))")

    args = parser.parse_args()

    # .md 확장자 제거 처리 (옵시디언 위키링크 호환)
    card_name = args.card
    if card_name.endswith(".md"):
        card_name = card_name[:-3]

    success = append_hub(
        card_name=card_name,
        header_name=args.header,
        display_name=args.display,
        url=args.url,
        badge_str=args.badge,
        outline_path=args.outline,
        parent_target=args.parent,
    )

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
