#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
02_verify_hub_card.py
서식 수급처(허브) 카드 한 장을 기계적으로 검사하는 CLI 도구.
작업 에이전트의 "확인했습니다" 라는 말 대신, 제3자가 다시 확인할 수 있는 증거만 본다.

  H-LINK-*  `링크` 주소가 실제로 열리는가 (404 · 로그인 화면 · 다른 사이트로 넘어감 · 봇 차단)
  H-IMG-*   본문 이미지가 실제 캡처인가 (capture_manifest.json 의 출처 기록 + sha256 일치), 한 장이라도 있는가
  H-BODY-*  링크 ↔ 본문 ↔ 이미지 짝이 맞는가, 자기 인증 문구가 있는가
  H-OBS-*   볼트 공통 린터(validator/validate_obsidian_note.py) 결과

종료 코드: FAIL 이 하나라도 있으면 1, 아니면 0 (WARN 은 통과 — 리뷰어가 눈으로 본다)
"""

import argparse
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

# Windows 콘솔 cp949 인코딩 충돌 방지
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

try:
    import yaml
except ImportError:
    print("[ERROR] PyYAML 이 필요합니다: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

MANIFEST_NAME = "capture_manifest.json"
IMAGE_DIRS = ("이미지", "images", "")
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

LOGIN_URL_HINTS = ("login", "signin", "sign-in", "sign_in", "accounts.google.", "/auth/", "/sso")
LOGIN_TITLE = re.compile(r"(로그인|sign\s*in|log\s*in)", re.I)
SOFT_404_TITLE = re.compile(r"(오류\s*페이지|에러\s*페이지|not\s*found|찾을\s*수\s*없|페이지\s*변경\s*안내|page\s*not\s*found|\b404\b)", re.I)
BOTBLOCK_TITLE = re.compile(r"(just a moment|attention required|보안 확인|checking your browser)", re.I)
SELF_CERT = ("전수 검증", "검증 완료", "100%", "완벽", "검증된 공식")
VALIDATOR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "validator", "validate_obsidian_note.py")
OUTLINE_VALIDATOR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "outline_validator", "validate_outline.py")


class Report:
    def __init__(self):
        self.items = []

    def add(self, level: str, rule: str, message: str):
        self.items.append({"level": level, "rule": rule, "message": message})

    def fails(self):
        return [i for i in self.items if i["level"] == "FAIL"]

    def warns(self):
        return [i for i in self.items if i["level"] == "WARN"]


def read_note(path: str):
    with open(path, "r", encoding="utf-8", newline="") as f:
        text = f.read()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}, text
    try:
        fm = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        fm = {}
    return fm, text[m.end():]


def norm_url(u: str) -> str:
    u = u.strip().rstrip("/")
    return re.sub(r"^https?://(www\.)?", "", u, flags=re.I)


def site_of(u: str) -> str:
    host = urllib.parse.urlparse(u).hostname or ""
    parts = host.lower().split(".")
    if len(parts) >= 3 and parts[-2] in ("co", "or", "go", "ac", "ne", "re"):
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def fetch(url: str, timeout: int):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read(400_000).decode("utf-8", errors="replace")
            return resp.status, resp.geturl(), body
    except urllib.error.HTTPError as e:
        body = e.read(200_000).decode("utf-8", errors="replace") if e.fp else ""
        return e.code, e.geturl() or url, body
    except Exception as e:  # 네트워크 · SSL · 시간 초과
        return None, url, f"{type(e).__name__}: {e}"


def title_of(body: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S)
    return html.unescape(re.sub(r"\s+", " ", m.group(1))).strip() if m else ""


def check_links(links, rep: Report, timeout: int):
    for url in links:
        status, final, body = fetch(url, timeout)
        title = title_of(body) if status else ""
        shown = f"{url} → {status} {final if final != url else ''} 「{title[:60]}」".strip()
        if status is None:
            rep.add("WARN", "H-LINK-000", f"열지 못함 (네트워크) — 브라우저로 직접 확인: {url} ({body[:80]})")
            continue
        if status in (403, 503) and BOTBLOCK_TITLE.search(title):
            rep.add("WARN", "H-LINK-003", f"봇 차단 화면 — 사람이 보는 브라우저로 확인할 것: {shown}")
            continue
        if status >= 400:
            rep.add("FAIL", "H-LINK-001", f"열리지 않는 주소: {shown}")
            continue
        if SOFT_404_TITLE.search(title):
            rep.add("FAIL", "H-LINK-001", f"200 이지만 오류 페이지: {shown}")
            continue
        low = final.lower()
        if any(h in low for h in LOGIN_URL_HINTS) or (LOGIN_TITLE.search(title) and len(title) < 40):
            rep.add("FAIL", "H-LINK-002", f"로그인 화면으로 넘어감 — 공개 허브가 아님: {shown}")
            continue
        if site_of(final) != site_of(url):
            rep.add("WARN", "H-LINK-004", f"다른 사이트로 넘어감 — 허브가 아직 거기 있는지 볼 것: {shown}")
            continue
        rep.add("OK", "H-LINK", shown)


def find_image(note_dir: str, name: str):
    for sub in IMAGE_DIRS:
        p = os.path.join(note_dir, sub, name)
        if os.path.exists(p):
            return p
    return None


def sha256_of(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def check_images(note_path: str, body: str, links, rep: Report):
    note_dir = os.path.dirname(os.path.abspath(note_path))
    names = [n.strip() for n in re.findall(r"!\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]", body)]
    images = [n for n in names if n.lower().endswith(IMAGE_EXT)]
    link_keys = {norm_url(u) for u in links}
    manifests = {}
    used_urls = []

    for name in images:
        path = find_image(note_dir, os.path.basename(name))
        if not path:
            rep.add("FAIL", "H-IMG-001", f"본문에 끼운 이미지 파일이 없음: {name}")
            continue
        img_dir = os.path.dirname(path)
        if img_dir not in manifests:
            mp = os.path.join(img_dir, MANIFEST_NAME)
            manifests[img_dir] = json.load(open(mp, encoding="utf-8")) if os.path.exists(mp) else None
        manifest = manifests[img_dir]
        entry = (manifest or {}).get("captures", {}).get(os.path.basename(path))
        if not entry:
            rep.add("FAIL", "H-IMG-002", f"출처 기록 없는 이미지 (01_capture_hub_page.py 로 찍지 않음 — 그린 그림일 수 있음): {name}")
            continue
        if entry.get("sha256") != sha256_of(path):
            rep.add("FAIL", "H-IMG-002", f"기록과 파일 내용이 다름 (찍은 뒤 손댐): {name}")
            continue
        used_urls.append(entry.get("url", ""))
        if norm_url(entry.get("url", "")) not in link_keys:
            rep.add("FAIL", "H-IMG-004", f"캡처한 주소가 `링크` 에 없음: {name} ← {entry.get('url')}")
            continue
        if entry.get("source") != "headless-browser":
            rep.add("WARN", "H-IMG-003", f"사람 브라우저 화면으로 등록됨 ({entry.get('reason', '')}) — 리뷰어가 눈으로 확인: {name}")
            continue
        rep.add("OK", "H-IMG", f"{name} ← {entry.get('url')}")

    shot = {norm_url(u) for u in used_urls}
    for url in links:
        if norm_url(url) not in shot:
            rep.add("WARN", "H-IMG-005", f"캡처가 없는 링크: {url}")
    return images


def check_body(fm: dict, body: str, links, rep: Report):
    body_keys = {norm_url(u) for u in re.findall(r"https?://[^\s)\]>|`]+", body)}
    for url in links:
        if norm_url(url) not in body_keys:
            rep.add("FAIL", "H-BODY-001", f"`링크` 에는 있는데 본문에 없음: {url}")
    for phrase in SELF_CERT:
        if phrase in body or phrase in str(fm.get("요약") or ""):
            rep.add("WARN", "H-BODY-002", f"자기 인증 문구 「{phrase}」 — 무엇을 어떻게 확인했는지로 바꿀 것")
    if not fm.get("요약"):
        rep.add("FAIL", "H-BODY-003", "`요약` 이 비어 있음")
    authors = fm.get("작성자") or []
    if not authors:
        rep.add("FAIL", "H-BODY-004", "`작성자` 가 비어 있음 — 본문을 쓴 에이전트 이름을 넣을 것")


def check_vault_lint(note_path: str, rep: Report):
    if not os.path.exists(VALIDATOR):
        rep.add("WARN", "H-OBS-000", f"볼트 린터를 찾지 못함: {VALIDATOR}")
        return
    r = subprocess.run([sys.executable, VALIDATOR, note_path], capture_output=True, text=True, encoding="utf-8")
    if r.returncode == 0:
        rep.add("OK", "H-OBS", "볼트 린터 통과")
        return
    for line in (r.stdout + r.stderr).splitlines():
        line = line.strip()
        if line.startswith("->"):
            rep.add("FAIL", "H-OBS-001", line[2:].strip())


def check_pipeline_taxonomy(outline_path: str, fm: dict, rep: Report):
    """
    [섹터 전용 검증: H-TAX]
    4번 노드 '서식 템플릿 수급처 분류 기준 (Data Pipeline Source Types)'에 정의된 8대 기준 및 34개 정규 어휘 외에
    5번 노드 마스터 레지스트리 뱃지에 임의 어휘가 사용되었는지를 엄격히 검사합니다.
    """
    try:
        with open(outline_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        rep.add("WARN", "H-TAX-000", f"아웃라인 JSON 읽기 실패: {e}")
        return

    root_nodes = data.get("rootNodes", [])
    node4 = None
    node5 = None
    for n in root_nodes:
        txt = n.get("text", "")
        if "4." in txt and "분류 기준" in txt:
            node4 = n
        elif "5." in txt and "수급처" in txt:
            node5 = n

    if not node4:
        rep.add("WARN", "H-TAX-000", "4번 노드(분류 기준)를 찾을 수 없음")
        return

    # 4번 노드에서 허용 정규 어휘 세트 동적 추출
    allowed_terms = set()
    for crit in node4.get("children", []):
        for item in crit.get("children", []):
            item_text = item.get("text", "").strip()
            if item_text:
                allowed_terms.add(item_text)

    if not node5:
        return

    # 5번 노드의 모든 뱃지 노드 검증
    badge_count = 0
    invalid_terms = []
    structure_errors = []

    def inspect_hub_children(nodes):
        nonlocal badge_count
        for child in nodes:
            txt = child.get("text", "")
            if "【" in txt and "】" in txt:
                badge_count += 1
                badges = re.findall(r"【(.*?)】", txt)
                if len(badges) not in (6, 8):
                    structure_errors.append(f"뱃지 {len(badges)}개 (기준 6개 또는 8개 필요): {txt[:50]}")
                for b in badges:
                    terms = [t.strip() for t in b.split(" · ")]
                    for t in terms:
                        if t and t not in allowed_terms:
                            invalid_terms.append((t, txt[:60]))
            inspect_hub_children(child.get("children", []))

    inspect_hub_children(node5.get("children", []))

    if invalid_terms:
        unique_invalids = sorted(set(t[0] for t in invalid_terms))
        rep.add("FAIL", "H-TAX-001", f"4번 노드 분류 기준에 없는 비표준 어휘 감지: {unique_invalids} (4번 노드 {len(allowed_terms)}개 정규 어휘 외 사용 절대 금지)")
    elif structure_errors:
        rep.add("FAIL", "H-TAX-002", f"8대 기준 뱃지 구조 위반: {structure_errors[:3]}")
    else:
        rep.add("OK", "H-TAX", f"마스터 아웃라인 5번 노드 뱃지 검증 통과 (4번 노드 {len(allowed_terms)}개 정규 어휘 100% 준수, 검사된 뱃지: {badge_count}개)")


def check_hub_duplicates(note_path: str, body: str, links: list, outline_path: str, rep: Report):
    """
    [L-10 중복 방지 검증: H-DUP]
    신규 조사 대상 허브가 상위 아웃라인 5번 노드에 이미 등록된 동일 URL이거나,
    동일 도메인/플랫폼이 이미 존재하여 서브카탈로그화 또는 임베드 연동이 필요한지 검사합니다.
    """
    try:
        with open(outline_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return

    root_nodes = data.get("rootNodes", [])
    node5 = next((n for n in root_nodes if "5." in n.get("text", "") and "수급처" in n.get("text", "")), None)
    if not node5:
        return

    card_name = os.path.splitext(os.path.basename(note_path))[0]

    # 아웃라인 5번 노드의 기존 허브 URL 및 도메인 전수 수집 (자신의 카드는 제외)
    existing_urls = {}
    existing_domains = {}

    def collect(nodes, parent_desc=""):
        for n in nodes:
            txt = n.get("text", "").strip()
            if txt.startswith("http://") or txt.startswith("https://"):
                # URL 노드
                if card_name not in parent_desc:
                    clean_u = txt.rstrip("/").lower()
                    existing_urls[clean_u] = parent_desc
                    dom = site_of(txt)
                    if dom:
                        existing_domains.setdefault(dom, []).append((parent_desc, txt))
            collect(n.get("children", []), parent_desc=txt if "[[" in txt or "(" in txt else parent_desc)

    collect(node5.get("children", []))

    # 본문에서 '## 2. 순수 신규 조사 대상 허브' 이후의 링크만 신규 후보로 판별
    new_sec_match = re.search(r"## 2\.\s*순수\s*신규\s*조사\s*대상\s*허브(.*?)(?:##|\Z)", body, re.S)
    new_links = []
    if new_sec_match:
        new_links = re.findall(r"\* \*\*허브 링크\*\*:\s*(https?://[^\s\n\r]+)", new_sec_match.group(1))

    for u in new_links:
        clean_u = u.strip().rstrip("/").lower()
        if clean_u in existing_urls:
            rep.add("FAIL", "H-DUP-001", f"이미 5번 노드에 등록된 동일 URL 허브 (L-10 위반, 신규 조사가 아닌 트랜스클루전 임베드로 연동할 것): {u} (기존: {existing_urls[clean_u]})")
            continue
        dom = site_of(u)
        if dom in existing_domains:
            matched = existing_domains[dom]
            # 상위 플랫폼 서브카탈로그 노드로 묶여있지 않은 경우 경고
            rep.add("WARN", "H-DUP-002", f"동일 플랫폼/도메인({dom})이 이미 5번 노드에 등록되어 있음 (단일 플랫폼 서브카탈로그화 또는 기존 카드 임베드 연동 확인 필요): {u} ← 기존: {matched[0][0]}")

    if not rep.fails():
        rep.add("OK", "H-DUP", "아웃라인 5번 마스터 레지스트리 대조 중복 검사 통과")


def check_outline_lint(note_path: str, body: str, links: list, fm: dict, rep: Report):
    parent_raw = str(fm.get("상위") or "").strip()
    m = re.search(r"\[\[(.*?)\]\]", parent_raw)
    parent_title = m.group(1).strip() if m else parent_raw
    if not parent_title:
        return

    # 아웃라인 파일 찾기
    outline_path = (
        r"c:\망고독 관련 자료\프로젝트_매니지먼트\What-s-in-my-head\3.📦(Resource) 자료"
        rf"\📑 문서_서식_수집_파이프라인\{parent_title}.outline"
    )
    if not os.path.exists(outline_path):
        return

    if not os.path.exists(OUTLINE_VALIDATOR):
        rep.add("WARN", "H-OUT-000", f"아웃라인 린터를 찾지 못함: {OUTLINE_VALIDATOR}")
    else:
        r = subprocess.run([sys.executable, OUTLINE_VALIDATOR, outline_path], capture_output=True, text=True, encoding="utf-8")
        if r.returncode == 0:
            rep.add("OK", "H-OUT", "마스터 아웃라인 범용 린터 통과")
        else:
            for line in (r.stdout + r.stderr).splitlines():
                line = line.strip()
                if line.startswith("->"):
                    rep.add("FAIL", "H-OUT-001", line[2:].strip())

    # 섹터 전용 검증: 4번 노드 Taxonomy 검사
    check_pipeline_taxonomy(outline_path, fm, rep)
    # L-10 중복 검증: H-DUP 검사
    check_hub_duplicates(note_path, body, links, outline_path, rep)


def main() -> int:
    parser = argparse.ArgumentParser(description="서식 수급처 허브 카드 기계 검사")
    parser.add_argument("card", help="카드 .md 경로")
    parser.add_argument("--offline", action="store_true", help="링크 접속 검사를 건너뛴다")
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--json", dest="json_out", help="결과를 JSON 파일로도 쓴다 (리뷰어용)")
    args = parser.parse_args()

    if not os.path.exists(args.card):
        print(f"[ERROR] 카드가 없습니다: {args.card}", file=sys.stderr)
        return 2

    fm, body = read_note(args.card)
    links = [str(u).strip() for u in (fm.get("링크") or []) if str(u).strip()]
    rep = Report()

    if not links:
        rep.add("FAIL", "H-LINK-005", "`링크` 속성이 비어 있음")
    if not args.offline:
        check_links(links, rep, args.timeout)
    images = check_images(args.card, body, links, rep)
    if not images:
        rep.add("FAIL", "H-IMG-007", "캡처가 한 장도 없음 — 허브마다 01_capture_hub_page.py 로 찍어 본문에 끼울 것")
    if links and images and len(images) != len(links):
        rep.add("WARN", "H-IMG-006", f"링크 {len(links)}개 · 이미지 {len(images)}장 — 허브마다 캡처 한 장인지 볼 것")
    check_body(fm, body, links, rep)
    check_vault_lint(args.card, rep)
    check_outline_lint(args.card, body, links, fm, rep)

    print(f"=== Hub Card Verifier: {os.path.basename(args.card)} ===")
    for item in rep.items:
        tag = {"FAIL": "[FAIL]", "WARN": "[WARN]", "OK": "[ OK ]"}[item["level"]]
        print(f"{tag} {item['rule']:<11} {item['message']}")
    fails, warns = rep.fails(), rep.warns()
    print("=" * 60)
    print(f"결과: FAIL {len(fails)} · WARN {len(warns)} → {'반려' if fails else '기계 검사 통과 (WARN 은 리뷰어가 확인)'}")

    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8", newline="") as f:
            json.dump({"card": args.card, "items": rep.items, "fail": len(fails), "warn": len(warns)}, f, ensure_ascii=False, indent=2)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
