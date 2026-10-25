#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
01_capture_hub_page.py
서식 수급처(허브) 페이지를 실제 브라우저(Edge/Chrome 헤드리스)로 찍고,
그 출처를 이미지 폴더의 capture_manifest.json 에 남기는 CLI 도구.

이미지가 "그린 그림"이 아니라 "그 주소를 실제로 찍은 화면"이라는 증거를 남기는 것이 목적이다.
02_verify_hub_card.py 는 manifest 에 기록이 없는 이미지를 FAIL 로 처리한다.

  capture   주소를 헤드리스 브라우저로 찍는다 (위아래 크롭만 허용)
  register  봇 차단 등으로 헤드리스가 막힌 페이지를, 사람이 보는 브라우저 화면으로 저장한 파일을 등록한다
"""

import argparse
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile

# Windows 콘솔 cp949 인코딩 충돌 방지
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

MANIFEST_NAME = "capture_manifest.json"
BROWSER_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]


def find_browser() -> str:
    for path in BROWSER_CANDIDATES:
        if os.path.exists(path):
            return path
    for name in ("msedge", "chrome", "google-chrome", "chromium"):
        found = shutil.which(name)
        if found:
            return found
    print("[ERROR] Edge/Chrome 실행 파일을 찾을 수 없습니다.", file=sys.stderr)
    sys.exit(1)


def sha256_of(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_manifest(image_dir: str) -> dict:
    path = os.path.join(image_dir, MANIFEST_NAME)
    if not os.path.exists(path):
        return {"version": 1, "captures": {}}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_manifest(image_dir: str, manifest: dict) -> None:
    path = os.path.join(image_dir, MANIFEST_NAME)
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


def looks_blank(png_path: str) -> bool:
    """거의 한 색으로 찬 화면이면 True — 봇 차단 화면·로딩 실패일 수 있다."""
    try:
        from PIL import Image
    except ImportError:
        return False
    with Image.open(png_path) as im:
        small = im.convert("RGB").resize((64, 64))
        colors = small.getcolors(64 * 64) or []
        top = max(count for count, _ in colors) if colors else 0
        return top / (64 * 64) > 0.85


def crop_png(src: str, dst: str, top: int, bottom) -> tuple:
    from PIL import Image

    with Image.open(src) as im:
        im = im.convert("RGB")
        box = (0, top, im.width, bottom if bottom else im.height)
        out = im.crop(box)
        out.save(dst, optimize=True)
        return out.size


def record(image_dir: str, file_name: str, entry: dict, no_manifest: bool) -> None:
    if no_manifest:
        return
    manifest = load_manifest(image_dir)
    manifest["captures"][file_name] = entry
    save_manifest(image_dir, manifest)


def cmd_capture(args) -> int:
    out_path = os.path.abspath(args.out)
    image_dir = os.path.dirname(out_path)
    os.makedirs(image_dir, exist_ok=True)
    browser = find_browser()

    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, "raw.png")
        cmd = [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--lang={args.lang}",
            f"--window-size={args.width},{args.height}",
            f"--virtual-time-budget={args.wait}",
            f"--screenshot={raw}",
            args.url,
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
        except subprocess.TimeoutExpired:
            print(f"[ERROR] 캡처 시간 초과: {args.url}", file=sys.stderr)
            return 1
        if not os.path.exists(raw):
            print(f"[ERROR] 브라우저가 화면을 저장하지 못했습니다: {args.url}", file=sys.stderr)
            return 1
        size = crop_png(raw, out_path, args.crop_top, args.crop_bottom)

    entry = {
        "url": args.url,
        "source": "headless-browser",
        "browser": os.path.basename(browser),
        "captured_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "viewport": [args.width, args.height],
        "crop": [args.crop_top, args.crop_bottom],
        "size": list(size),
        "sha256": sha256_of(out_path),
    }
    record(image_dir, os.path.basename(out_path), entry, args.no_manifest)
    print(f"[OK] {os.path.basename(out_path)} {size[0]}x{size[1]} ← {args.url}")
    if looks_blank(out_path):
        print("[WARN] 화면이 거의 한 색입니다. 봇 차단 화면이나 로딩 실패일 수 있으니 이미지를 직접 열어 보세요.")
    return 0


def cmd_register(args) -> int:
    path = os.path.abspath(args.file)
    if not os.path.exists(path):
        print(f"[ERROR] 파일이 없습니다: {path}", file=sys.stderr)
        return 1
    if not args.reason.strip():
        print("[ERROR] --reason 에 헤드리스로 못 찍은 까닭을 적어야 합니다.", file=sys.stderr)
        return 1
    entry = {
        "url": args.url,
        "source": "visible-browser",
        "captured_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "reason": args.reason.strip(),
        "sha256": sha256_of(path),
    }
    record(os.path.dirname(path), os.path.basename(path), entry, False)
    print(f"[OK] 등록: {os.path.basename(path)} ← {args.url} (visible-browser — 리뷰어가 눈으로 확인합니다)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="허브 페이지 실제 캡처 + 출처 기록")
    sub = parser.add_subparsers(dest="command", required=True)

    cap = sub.add_parser("capture", help="헤드리스 브라우저로 주소를 찍는다")
    cap.add_argument("--url", required=True)
    cap.add_argument("--out", required=True, help="저장할 PNG 경로 (보통 카드 옆 이미지/ 폴더)")
    cap.add_argument("--width", type=int, default=1280)
    cap.add_argument("--height", type=int, default=1800, help="찍을 높이. 넉넉히 찍고 --crop-* 로 자른다")
    cap.add_argument("--wait", type=int, default=10000, help="자바스크립트 로딩을 기다리는 시간(ms)")
    cap.add_argument("--crop-top", type=int, default=0)
    cap.add_argument("--crop-bottom", type=int, default=None, help="이 y 좌표 아래를 버린다 (광고·쿠키 배너 제거)")
    cap.add_argument("--lang", default="ko-KR")
    cap.add_argument("--no-manifest", action="store_true", help="기록 없이 찍기만 (리뷰어의 대조용 재촬영)")
    cap.set_defaults(func=cmd_capture)

    reg = sub.add_parser("register", help="사람이 보는 브라우저로 저장한 화면을 등록한다")
    reg.add_argument("--file", required=True)
    reg.add_argument("--url", required=True)
    reg.add_argument("--reason", required=True, help="예: Cloudflare 가 헤드리스를 막음")
    reg.set_defaults(func=cmd_register)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
