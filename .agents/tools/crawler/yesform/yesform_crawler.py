#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
예스폼(yesform.com) 무료 서식 수집 및 포맷별 다운로더 도구

목적:
  1) 검색 결과 목록에서 무료 표기가 붙은 서식 목록 수집
  2) 서식 상세 페이지에서 지원 포맷(한글, 워드, PDF, 엑셀 등) 파싱
  3) 포맷별 실제 서식 파일 다운로드 (로그인 세션 쿠키 지원)
"""

import os
import sys
import re
import time
import csv
import json
import argparse
from pathlib import Path
from urllib.parse import quote, urljoin, unquote

import requests
from bs4 import BeautifulSoup

# Windows 콘솔 인코딩 대응
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


# =====================================================================
# 기본 설정 상수
# =====================================================================
BASE_URL = "https://www.yesform.com"
LIST_PATH = "/docs/formList.php"
DOWNLOAD_ENDPOINT = "/z_n/forms/dw_form.php"

# 검색 기본값
DEFAULT_KEYWORD = "회의록"
KEYWORD_ENCODING = "euc-kr"
LIST_FIXED_PARAMS = {
    "action_type": "1",
    "division": "A11",
    "language": "",
    "menu": "",
}
PAGE_PARAM_NAME = "page"
START_PAGE = 1

# 서식 식별 및 판별
FREE_LABEL = "무료"
NON_FREE_LABELS = {"유료", "프리미엄"}
DETAIL_URL_PATTERN = re.compile(r"(vform_(\d+)\.php|vbizf_(\d+)\.php|iso_(\d+)\.html)")

# 포맷 매핑
FORMAT_NAME_TO_TYPE = {
    "pdf": "pdf",
    "한글": "hwp",
    "hwp": "hwp",
    "워드": "doc",
    "doc": "doc",
    "docx": "doc",
    "엑셀": "xls",
    "xls": "xls",
    "xlsx": "xls",
    "구글 시트": "sheet",
    "구글시트": "sheet",
    "ppt": "ppt",
    "pptx": "ppt"
}

# 네트워크 기본값
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)
REQUEST_DELAY_SEC = 1.0
TIMEOUT_SEC = 20
PAGE_ENCODINGS = ("utf-8", "euc-kr")


class YesformCrawler:
    """예스폼 무료 서식 수집 및 다운로더"""

    def __init__(self, cookie: str = "", delay: float = REQUEST_DELAY_SEC, output_dir: Path = None):
        self.cookie = cookie.strip()
        self.delay = delay
        self.output_dir = output_dir or Path("./yesform_downloads")
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        if self.cookie:
            self.session.headers["Cookie"] = self.cookie

    def decode_html(self, raw: bytes) -> str:
        """UTF-8 및 EUC-KR 순차 디코딩"""
        for enc in PAGE_ENCODINGS:
            text = raw.decode(enc, errors="replace")
            if "" not in text:
                return text
        return raw.decode(PAGE_ENCODINGS[-1], errors="replace")

    def get_soup(self, url: str) -> BeautifulSoup:
        """HTML 요청 및 BeautifulSoup 파싱"""
        r = self.session.get(url, timeout=TIMEOUT_SEC)
        r.raise_for_status()
        time.sleep(self.delay)
        return BeautifulSoup(self.decode_html(r.content), "html.parser")

    def parse_item_id(self, url: str) -> tuple[str, str]:
        """
        URL에서 mtbl과 rowid 추출
        반환: (mtbl, rowid) - 예: ('form', '128700'), ('bizf', '6005')
        """
        m = DETAIL_URL_PATTERN.search(url)
        if not m:
            return "form", ""
        full, vform_id, vbizf_id, iso_id = m.groups()
        if vform_id:
            return "form", vform_id
        if vbizf_id:
            return "bizf", vbizf_id
        if iso_id:
            return "form", iso_id
        return "form", ""

    def parse_formats(self, detail_url: str) -> dict[str, str]:
        """
        상세 페이지에서 제공 포맷 목록 및 다운로드 링크 생성
        반환: { 'PDF': download_url, '한글': download_url, ... }
        """
        soup = self.get_soup(detail_url)
        mtbl, rowid = self.parse_item_id(detail_url)
        formats = {}

        # 1. view-format__item 버튼 탐색
        format_items = soup.find_all("a", class_=lambda c: c and "format" in str(c))
        for item in format_items:
            name = item.get_text(strip=True)
            if not name or name in {"내려받기", "다운로드"}:
                continue
            fmt_type = FORMAT_NAME_TO_TYPE.get(name.lower(), name.lower())
            if rowid:
                dw_url = urljoin(BASE_URL, f"{DOWNLOAD_ENDPOINT}?mtbl={mtbl}&rowid={rowid}&type={fmt_type}")
                formats[name] = dw_url

        # 2. 버튼이 없거나 특수 케이스: href에 dw_form.php가 직접 걸린 링크 탐색
        if not formats:
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if "dw_form.php" in href:
                    text = a.get_text(strip=True)
                    if text and text not in {"내려받기", ""}:
                        formats.setdefault(text, urljoin(BASE_URL, href))

        return formats

    def build_list_url(self, keyword: str, page: int) -> str:
        """검색 목록 URL 생성 (EUC-KR 인코딩 반영)"""
        q = quote(keyword.encode(KEYWORD_ENCODING))
        params = "&".join(f"{k}={v}" for k, v in LIST_FIXED_PARAMS.items())
        return f"{BASE_URL}{LIST_PATH}?{params}&q={q}&{PAGE_PARAM_NAME}={page}"

    def parse_list_page(self, soup: BeautifulSoup) -> list[dict]:
        """목록 페이지에서 무료 서식 추출"""
        results, seen = [], set()

        def find_card(a_tag):
            target = DETAIL_URL_PATTERN.search(a_tag["href"]).group(1)
            card = a_tag
            while card.parent is not None:
                ids = {
                    m.group(1)
                    for x in card.parent.find_all("a", href=True)
                    if (m := DETAIL_URL_PATTERN.search(x["href"]))
                }
                if ids != {target}:
                    break
                card = card.parent
            return card

        for a in soup.find_all("a", href=True):
            if not DETAIL_URL_PATTERN.search(a["href"]):
                continue
            url = urljoin(BASE_URL, a["href"])
            if url in seen:
                continue
            seen.add(url)

            card = find_card(a)
            lines = [t.strip() for t in card.get_text("\n").split("\n") if t.strip()]
            label = next((l for l in lines if l == FREE_LABEL or l in NON_FREE_LABELS), None)
            if label != FREE_LABEL:
                continue
            title = next((l for l in lines if len(l) > 4 and l != FREE_LABEL), "")
            results.append({"title": title, "detail_url": url})

        return results

    def collect_free_forms(self, keyword: str = DEFAULT_KEYWORD, start_page: int = 1, max_pages: int = None) -> list[dict]:
        """무료 서식 검색 결과 전수 수집"""
        all_items, page = [], start_page
        while True:
            if max_pages and page > max_pages:
                break
            url = self.build_list_url(keyword, page)
            soup = self.get_soup(url)
            items = self.parse_list_page(soup)
            print(f"[LIST] {page}페이지: 무료 서식 {len(items)}개 발견")
            if not items:
                break
            for it in items:
                it["page"] = page
            all_items.extend(items)
            page += 1
        return all_items

    def filename_from_response(self, r: requests.Response, fallback: str) -> str:
        """응답 헤더(Content-Disposition)에서 파일명 추출"""
        cd = r.headers.get("Content-Disposition", "")
        m = re.search(r"filename\*?=(?:UTF-8'')?\"?([^\";]+)", cd)
        if not m:
            return fallback
        raw_name = m.group(1)
        name = unquote(raw_name)
        # cp949/euc-kr 디코딩 시도
        try:
            if "" in name or any(ord(c) > 127 for c in raw_name):
                name = raw_name.encode("latin-1").decode("euc-kr")
        except Exception:
            pass
        # 파일명 금지 문자 정제
        name = re.sub(r'[\\/*?:"<>|]', "", name).strip()
        return name or fallback

    def download_file(self, download_url: str, fmt: str, fallback_name: str) -> dict:
        """
        서식 파일 1건 다운로드 수행
        반환: { "status": "success"|"need_login"|"error", "path": ..., "message": ... }
        """
        folder = self.output_dir / fmt.upper()
        folder.mkdir(parents=True, exist_ok=True)

        try:
            r = self.session.get(download_url, timeout=TIMEOUT_SEC)
            r.raise_for_status()

            content_type = r.headers.get("Content-Type", "")
            # HTML 응답인 경우 (로그인 미인증 또는 접근 제한)
            if "text/html" in content_type:
                text = self.decode_html(r.content)
                if "로그인" in text or "history.back" in text:
                    msg = "로그인이 필요한 서식입니다. (세션 쿠키 미제공 또는 만료)"
                    print(f"  ❌ [로그인 필요] {fallback_name} -> {msg}")
                    return {"status": "need_login", "message": msg, "url": download_url}
                msg = "정상 파일 대신 HTML 페이지가 반환되었습니다."
                print(f"  ❌ [실패] {fallback_name} -> {msg}")
                return {"status": "error", "message": msg, "url": download_url}

            ext = f".{fmt.lower()}"
            safe_fallback = f"{fallback_name}{ext}" if not fallback_name.endswith(ext) else fallback_name
            filename = self.filename_from_response(r, safe_fallback)
            if not filename.endswith(ext):
                filename += ext

            target_path = folder / filename
            target_path.write_bytes(r.content)
            print(f"  ✅ [저장 완료] {target_path}")
            return {"status": "success", "path": str(target_path), "size": len(r.content)}

        except Exception as e:
            msg = str(e)
            print(f"  ❌ [오류] {fallback_name} -> {msg}")
            return {"status": "error", "message": msg, "url": download_url}


# =====================================================================
# CLI 실행부
# =====================================================================

def parse_urls_from_outline(outline_path: str, limit: int = None) -> list[tuple[str, str]]:
    """아웃라인 파일에서 서식 제목과 상세 URL 추출"""
    with open(outline_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = []

    def traverse(node):
        text = node.get("text", "")
        # 마크다운 링크 파싱: [제목](URL)
        m = re.search(r"\[([^\]]+)\]\((https?://[^\)]+)\)", text)
        if m:
            title, url = m.groups()
            if "yesform.com" in url:
                results.append((title, url))
        for child in node.get("children", []):
            traverse(child)

    for root in data.get("rootNodes", []):
        traverse(root)

    if limit:
        return results[:limit]
    return results


def main():
    parser = argparse.ArgumentParser(description="예스폼(yesform.com) 무료 서식 수집 및 포맷별 다운로더")
    parser.add_argument("--search", type=str, help="검색어로 서식 목록 수집 (예: 회의록)")
    parser.add_argument("--pages", type=int, default=1, help="수집할 검색 결과 최대 페이지 수 (기본: 1)")
    parser.add_argument("--urls", nargs="+", help="직접 지정한 상세 페이지 URL 목록")
    parser.add_argument("--outline", type=str, help="서식 URL을 추출할 .outline 파일 경로")
    parser.add_argument("--format", type=str, default="pdf", help="다운로드할 포맷 (기본: pdf)")
    parser.add_argument("--limit", type=int, help="처리할 최대 서식 건수")
    parser.add_argument("--cookie", type=str, default="", help="로그인 세션 쿠키 문자열")
    parser.add_argument("--output-dir", type=str, default="./yesform_downloads", help="저장 디렉토리 경로")
    parser.add_argument("--delay", type=float, default=1.0, help="요청 간 대기 시간(초, 기본 1.0)")
    parser.add_argument("--download", action="store_true", help="실제 파일 다운로드 수행 여부")

    args = parser.parse_args()

    cookie_val = args.cookie
    if not cookie_val:
        default_cookie_path = Path(__file__).parent / "cookie.txt"
        if default_cookie_path.exists():
            cookie_val = default_cookie_path.read_text(encoding="utf-8").strip()
            print(f"[AUTH] 로컬 cookie.txt 세션 자동 로드 완료")

    crawler = YesformCrawler(cookie=cookie_val, delay=args.delay, output_dir=Path(args.output_dir))

    target_items = []

    # 1. 아웃라인에서 URL 추출
    if args.outline:
        print(f"[LOAD] 아웃라인에서 서식 링크 로드: {args.outline}")
        items = parse_urls_from_outline(args.outline, limit=args.limit)
        target_items.extend(items)
        print(f"[LOAD] 총 {len(items)}개 서식 링크 확보")

    # 2. 명령줄 인자 URLs
    elif args.urls:
        for u in args.urls:
            target_items.append(("URL 서식", u))
        if args.limit:
            target_items = target_items[:args.limit]

    # 3. 검색 수집
    elif args.search:
        print(f"[SEARCH] 키워드: '{args.search}' 검색 시작 (최대 {args.pages}페이지)")
        forms = crawler.collect_free_forms(keyword=args.search, max_pages=args.pages)
        for f in forms:
            target_items.append((f["title"], f["detail_url"]))
        if args.limit:
            target_items = target_items[:args.limit]

    else:
        print("[INFO] 실행 옵션이 없습니다. --help 를 참조하세요.")
        return

    # 타겟 서식별 포맷 파싱 및 다운로드
    print(f"\n=== 서식 처리 시작 (총 {len(target_items)}건) ===")
    summary = {"total": len(target_items), "success": 0, "need_login": 0, "error": 0, "results": []}

    target_fmt = args.format.lower()
    for idx, (title, detail_url) in enumerate(target_items, 1):
        print(f"\n[{idx}/{len(target_items)}] {title}")
        print(f"  URL: {detail_url}")

        fmts = crawler.parse_formats(detail_url)
        available_names = list(fmts.keys())
        print(f"  지원 포맷: {', '.join(available_names) or '없음'}")

        # 원하는 포맷 매칭
        matched_fmt_name = None
        for name in fmts:
            if FORMAT_NAME_TO_TYPE.get(name.lower(), name.lower()) == target_fmt:
                matched_fmt_name = name
                break

        if not matched_fmt_name:
            print(f"  ⚠️ 요청 포맷 '{args.format}' 미지원 (건너뜀)")
            summary["results"].append({
                "title": title,
                "url": detail_url,
                "status": "format_not_supported"
            })
            continue

        dw_url = fmts[matched_fmt_name]
        print(f"  다운로드 엔드포인트: {dw_url}")

        if args.download:
            res = crawler.download_file(dw_url, target_fmt, title)
            st = res.get("status")
            if st == "success":
                summary["success"] += 1
            elif st == "need_login":
                summary["need_login"] += 1
            else:
                summary["error"] += 1
            summary["results"].append({
                "title": title,
                "url": detail_url,
                "download_url": dw_url,
                **res
            })

    print("\n" + "=" * 50)
    print("=== 작업 결과 요약 ===")
    print(f"총 처리: {summary['total']}건")
    if args.download:
        print(f"다운로드 성공: {summary['success']}건")
        print(f"로그인 필요(미인증 차단): {summary['need_login']}건")
        print(f"오류: {summary['error']}건")
    print("=" * 50)


if __name__ == "__main__":
    main()
