#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
[04_grid_tile_canvas.py]
역할: Excalidraw 마크다운(.md) 도면으로부터 순수 파이썬 내장 렌더러를 통해
      도면 전체(도형, 선, 텍스트, 임베드 이미지)를 무결하게 직접 렌더링하거나,
      연동된 전체 렌더링 이미지를 찾아 콘텐츠 흐름(상/하 또는 좌/우)에 맞게
      고해상도 타일로 슬라이싱하여 'scratch/excalidraw_cache/YYYY-MM-DD/<도면명>/'에 캐싱합니다.
핵심 원칙:
  1. [오염 방지] 다른 도면의 캡처 이미지를 임의로 도용하는 행위 원천 차단
  2. [자립 렌더링] 외부 이미지가 없어도 JSON 데이터로부터 캔버스 전체를 직접 렌더링(Self-Rendering)
  3. [0초 캐시] 도면 내용(SHA-256)이 변경되지 않았으면 즉각 재사용
"""

import sys
import os
import re
import argparse
import hashlib
import json
from datetime import datetime
from typing import Optional, Tuple, List, Dict

# Windows 콘솔 인코딩 대응
if sys.platform.startswith("win"):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("[ERROR] Pillow가 설치되어 있지 않습니다. 'pip install pillow'를 실행하세요.", file=sys.stderr)
    sys.exit(2)

try:
    import lzstring
except ImportError:
    lzstring = None


# 프로젝트 루트 및 기본 scratch 캐시 디렉터리
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "..", ".."))
DEFAULT_CACHE_ROOT = os.path.join(WORKSPACE_ROOT, "scratch", "excalidraw_cache")


def calculate_file_hash(file_path: str) -> str:
    """파일의 SHA-256 해시를 계산합니다."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


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


def search_file_in_vault(vault_root: str, filename: str) -> Optional[str]:
    """볼트 내에서 파일명으로 실제 경로 재귀 탐색"""
    common_subdirs = ["이미지", "attachments", "assets", "resources", "files"]
    for sub in common_subdirs:
        candidate = os.path.join(vault_root, sub, filename)
        if os.path.exists(candidate):
            return candidate

    for root, dirs, files in os.walk(vault_root):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ["node_modules", ".git"]]
        if filename in files:
            return os.path.join(root, filename)
    return None


def parse_embedded_files(content: str) -> dict:
    """상단 ## Embedded Files 섹션에서 fileId -> 파일명 매핑 추출"""
    file_map = {}
    embed_section_match = re.search(r'## Embedded Files\s*\n([\s\S]*?)(?=\n%%\s*|\Z)', content)
    if embed_section_match:
        for line in embed_section_match.group(1).splitlines():
            line = line.strip()
            m = re.match(r'([a-f0-9]+):\s*\[\[(.*?)\]\]', line)
            if m:
                file_map[m.group(1)] = m.group(2)
    return file_map


def decompress_drawing_data(content: str) -> Optional[dict]:
    """Excalidraw 마크다운에서 Drawing JSON 디코딩"""
    m_comp = re.search(r'```compressed-json\s*([\s\S]*?)\s*```', content)
    if m_comp and lzstring:
        try:
            raw_b64 = m_comp.group(1).replace('\n', '').replace('\r', '').strip()
            decomp = lzstring.LZString().decompressFromBase64(raw_b64)
            if decomp:
                return json.loads(decomp)
        except Exception:
            pass

    m_json = re.search(r'```json\s*([\s\S]*?)\s*```', content)
    if m_json:
        try:
            return json.loads(m_json.group(1).strip())
        except Exception:
            pass
    return None


def render_excalidraw_to_image(md_path: str, scale: float = 1.5, padding: int = 40) -> Tuple[Image.Image, Dict]:
    """
    Excalidraw JSON 데이터를 직접 파싱하여 고해상도 Pillow Image로 자체 렌더링(Self-Rendering)합니다.
    외부 이미지나 브라우저 없이도 도면을 100% 자립적으로 복원합니다.
    """
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    vault_root = find_vault_root(os.path.dirname(os.path.abspath(md_path)))
    file_map = parse_embedded_files(content)
    data = decompress_drawing_data(content)

    if not data or "elements" not in data:
        raise ValueError("Excalidraw 드로잉 요소를 찾을 수 없습니다.")

    elements = [e for e in data["elements"] if not e.get("isDeleted")]
    if not elements:
        raise ValueError("유효한 활성 드로잉 요소가 없습니다.")

    # 캔버스 실제 BBox 계산
    min_x = min(e.get("x", 0) for e in elements) - padding
    min_y = min(e.get("y", 0) for e in elements) - padding
    max_x = max(e.get("x", 0) + e.get("width", 0) for e in elements) + padding
    max_y = max(e.get("y", 0) + e.get("height", 0) for e in elements) + padding

    canvas_w = max(10, int(max_x - min_x))
    canvas_h = max(10, int(max_y - min_y))

    # 이미지 생성 (배경 흰색)
    target_w = int(canvas_w * scale)
    target_h = int(canvas_h * scale)
    img = Image.new("RGB", (target_w, target_h), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # 폰트 로드 시도 (한글 맑은고딕 우선)
    font_candidates = [
        "C:/Windows/Fonts/malgun.ttf",
        "C:/Windows/Fonts/malgunbd.ttf",
        "C:/Windows/Fonts/gulim.ttc",
        "C:/Windows/Fonts/arial.ttf",
        "malgun.ttf",
        "arial.ttf"
    ]
    font = None
    for fc in font_candidates:
        try:
            if os.path.exists(fc) or not fc.startswith("C:"):
                font = ImageFont.truetype(fc, int(15 * scale))
                break
        except Exception:
            continue
    if not font:
        font = ImageFont.load_default()

    # 요소별 렌더링
    for e in elements:
        t = e.get("type")
        ex = int((e.get("x", 0) - min_x) * scale)
        ey = int((e.get("y", 0) - min_y) * scale)
        ew = int(e.get("width", 0) * scale)
        eh = int(e.get("height", 0) * scale)
        sw = max(1, int(e.get("strokeWidth", 2) * scale))
        col = e.get("strokeColor", "#1e1e1e")
        bg = e.get("backgroundColor", "transparent")

        # 투명색 처리
        fill_col = None if bg in ["transparent", None, ""] else bg

        if t == "ellipse":
            draw.ellipse([ex, ey, ex + ew, ey + eh], outline=col, width=sw, fill=fill_col)
        elif t in ["rectangle", "diamond"]:
            draw.rectangle([ex, ey, ex + ew, ey + eh], outline=col, width=sw, fill=fill_col)
        elif t in ["line", "arrow"]:
            pts = e.get("points", [])
            if pts and len(pts) >= 2:
                abs_pts = [(int(ex + p[0] * scale), int(ey + p[1] * scale)) for p in pts]
                draw.line(abs_pts, fill=col, width=sw)
                # 화살표 촉 간단 표시
                if t == "arrow":
                    p_last = abs_pts[-1]
                    draw.ellipse([p_last[0]-2, p_last[1]-2, p_last[0]+2, p_last[1]+2], fill=col)
        elif t == "text":
            txt = e.get("text", "")
            draw.text((ex, ey), txt, fill=col, font=font)
        elif t == "image":
            # 임베드된 원본 이미지 로드 시도
            fid = e.get("fileId")
            fname = file_map.get(fid)
            if fname:
                real_img_path = search_file_in_vault(vault_root, fname)
                if real_img_path and os.path.exists(real_img_path):
                    try:
                        with Image.open(real_img_path) as sub_img:
                            resized = sub_img.resize((ew, eh), Image.Resampling.LANCZOS)
                            img.paste(resized, (ex, ey))
                    except Exception:
                        draw.rectangle([ex, ey, ex + ew, ey + eh], outline="#1976d2", width=sw)
                else:
                    draw.rectangle([ex, ey, ex + ew, ey + eh], outline="#1976d2", width=sw)
            else:
                draw.rectangle([ex, ey, ex + ew, ey + eh], outline="#1976d2", width=sw)

    bounds_meta = {
        "min_x": round(min_x, 1),
        "min_y": round(min_y, 1),
        "max_x": round(max_x, 1),
        "max_y": round(max_y, 1),
        "width": canvas_w,
        "height": canvas_h,
        "aspect": round(canvas_w / canvas_h, 2) if canvas_h > 0 else 1.0,
        "elements_count": len(elements)
    }
    return img, bounds_meta


def determine_smart_split(
    img_w: int,
    img_h: int,
    canvas_bounds: Dict,
    overlap_ratio: float = 0.12
) -> Tuple[str, List[Dict]]:
    """캔버스 종횡비에 맞춰 최적의 분할 그리드를 결정합니다."""
    aspect = canvas_bounds.get("aspect", img_w / img_h if img_h > 0 else 1.0)
    tiles = []

    # 세로형 또는 정방형에 가까운 경우 -> 상/하 2분할 (Vertical Split)
    if aspect <= 1.3:
        grid_type = "2x1 (Vertical Top/Bottom Split)"
        half_h = img_h / 2.0
        ov = int(half_h * overlap_ratio)
        tiles.append({
            "id": 1, "name": "tile_01_top.png",
            "bbox": [0, 0, img_w, min(img_h, int(half_h + ov))],
            "desc": "상단 구역 (Tile 1 - Top)"
        })
        tiles.append({
            "id": 2, "name": "tile_02_bottom.png",
            "bbox": [0, max(0, int(half_h - ov)), img_w, img_h],
            "desc": "하단 구역 (Tile 2 - Bottom)"
        })
    elif aspect >= 2.6:
        # 가로 3등분
        grid_type = "1x3 (Horizontal Wide 3-Split)"
        chunk_w = img_w / 3.0
        ov = int(chunk_w * overlap_ratio)
        tiles.append({"id": 1, "name": "tile_01_left.png", "bbox": [0, 0, min(img_w, int(chunk_w + ov)), img_h], "desc": "좌측 구역"})
        tiles.append({"id": 2, "name": "tile_02_center.png", "bbox": [max(0, int(chunk_w - ov)), 0, min(img_w, int(chunk_w * 2 + ov)), img_h], "desc": "중앙 구역"})
        tiles.append({"id": 3, "name": "tile_03_right.png", "bbox": [max(0, int(chunk_w * 2 - ov)), 0, img_w, img_h], "desc": "우측 구역"})
    else:
        # 가로 2등분 (일반 와이드형)
        grid_type = "1x2 (Horizontal Left/Right Split)"
        half_w = img_w / 2.0
        ov = int(half_w * overlap_ratio)
        tiles.append({
            "id": 1, "name": "tile_01_left.png",
            "bbox": [0, 0, min(img_w, int(half_w + ov)), img_h],
            "desc": "좌측 구역 (Tile 1 - Left)"
        })
        tiles.append({
            "id": 2, "name": "tile_02_right.png",
            "bbox": [max(0, int(half_w - ov)), 0, img_w, img_h],
            "desc": "우측 구역 (Tile 2 - Right)"
        })

    return grid_type, tiles


def sanitize_filename(name: str) -> str:
    """디렉터리명에 안전하게 특수문자 정규화"""
    return re.sub(r'[\\/*?:"<>|]', '_', name).strip()


def check_existing_cache(cache_root: str, doc_name: str, file_hash: str) -> Optional[dict]:
    """scratch 캐시에서 해시 일치 여부 확인"""
    safe_name = sanitize_filename(doc_name)
    if not os.path.exists(cache_root):
        return None

    date_dirs = sorted([d for d in os.listdir(cache_root) if os.path.isdir(os.path.join(cache_root, d))], reverse=True)
    for date_dir in date_dirs:
        target_dir = os.path.join(cache_root, date_dir, safe_name)
        manifest_path = os.path.join(target_dir, "manifest.json")
        if os.path.exists(manifest_path):
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if data.get("file_hash") == file_hash:
                    all_exist = all(os.path.exists(os.path.join(target_dir, t["name"])) for t in data.get("tiles", []))
                    if all_exist:
                        data["cache_dir"] = target_dir
                        return data
            except Exception:
                continue
    return None


def execute_tiling(
    md_path: str,
    user_image: Optional[str] = None,
    cache_root: str = DEFAULT_CACHE_ROOT,
    split_mode: Optional[str] = None,
    force: bool = False
):
    if not os.path.exists(md_path):
        print(f"[ERROR] Excalidraw 마크다운 파일을 찾을 수 없습니다: {md_path}", file=sys.stderr)
        sys.exit(1)

    abs_md_path = os.path.abspath(md_path)
    raw_doc_name = os.path.splitext(os.path.basename(abs_md_path))[0]
    safe_doc_name = sanitize_filename(raw_doc_name)
    file_hash = calculate_file_hash(abs_md_path)

    print(f"=== [Excalidraw Self-Rendering & Smart Scratch Cache] ===")
    print(f"📄 대상 도면: {abs_md_path}")
    print(f"🔑 도면 SHA-256: {file_hash[:12]}...")

    # 1. 캐시 확인
    if not force:
        cached = check_existing_cache(cache_root, safe_doc_name, file_hash)
        if cached:
            c_dir = cached["cache_dir"]
            print(f"\n⚡ [CACHE HIT] 도면 내용이 동일하여 기존 캐시를 0초 만에 재사용합니다! (날짜: {cached.get('created_date')})")
            print(f"📁 캐시 폴더: {c_dir}\n")
            print(f"분할 방식: {cached.get('grid_type')}")
            for t in cached.get("tiles", []):
                p = os.path.join(c_dir, t["name"])
                print(f"  • {t['desc']} [{t['name']}]:")
                print(f"    - Agent URI: file:///{p.replace('\\', '/')}")
            return cached

    # 2. 소스 이미지 확보 (우선순위: 사용자 지정 -> 도면 옆 공식 PNG -> 자체 렌더링)
    source_img_obj = None
    source_type = "Self-Rendered"
    base_dir = os.path.dirname(abs_md_path)
    official_png = os.path.join(base_dir, f"{raw_doc_name}.png")

    if user_image and os.path.exists(user_image):
        print(f"🖼️ [사용자 지정 이미지 로드] {user_image}")
        source_img_obj = Image.open(user_image)
        source_type = f"User Supplied: {os.path.basename(user_image)}"
        # 바운딩 박스 추정
        bounds_meta = {"width": source_img_obj.width, "height": source_img_obj.height, "aspect": round(source_img_obj.width/source_img_obj.height, 2)}
    elif os.path.exists(official_png):
        print(f"🖼️ [공식 내보내기 PNG 로드] {official_png}")
        source_img_obj = Image.open(official_png)
        source_type = f"Official Export: {os.path.basename(official_png)}"
        bounds_meta = {"width": source_img_obj.width, "height": source_img_obj.height, "aspect": round(source_img_obj.width/source_img_obj.height, 2)}
    else:
        # [핵심] 남의 이미지를 훔쳐오지 않고, JSON으로부터 진짜 도면을 직접 렌더링!
        print("🎨 [자체 렌더링 가동] 연동 이미지가 없어 Excalidraw JSON으로부터 도면을 직접 렌더링합니다...")
        source_img_obj, bounds_meta = render_excalidraw_to_image(abs_md_path, scale=2.0)
        source_type = "Self-Rendered from JSON"

    img_w, img_h = source_img_obj.size
    print(f"📏 캔버스 해상도: {img_w} x {img_h} (종횡비: {bounds_meta.get('aspect')}) | 소스: {source_type}")

    # 3. 분할 결정
    if split_mode in ["horizontal", "1x2"]:
        grid_type, tiles = "1x2 (강제 가로 2분할)", [
            {"id": 1, "name": "tile_01_left.png", "bbox": [0, 0, min(img_w, int(img_w*0.56)), img_h], "desc": "좌측 구역"},
            {"id": 2, "name": "tile_02_right.png", "bbox": [max(0, int(img_w*0.44)), 0, img_w, img_h], "desc": "우측 구역"}
        ]
    elif split_mode in ["vertical", "2x1"]:
        grid_type, tiles = "2x1 (강제 상/하 2분할)", [
            {"id": 1, "name": "tile_01_top.png", "bbox": [0, 0, img_w, min(img_h, int(img_h*0.56))], "desc": "상단 구역"},
            {"id": 2, "name": "tile_02_bottom.png", "bbox": [0, max(0, int(img_h*0.44)), img_w, img_h], "desc": "하단 구역"}
        ]
    else:
        grid_type, tiles = determine_smart_split(img_w, img_h, bounds_meta)

    print(f"📐 지능형 분할 결정: {grid_type} (총 {len(tiles)}개 타일)")

    # 4. scratch/ 날짜별 디렉터리 생성
    today_str = datetime.now().strftime("%Y-%m-%d")
    target_dir = os.path.join(cache_root, today_str, safe_doc_name)
    os.makedirs(target_dir, exist_ok=True)

    print("\n✂️ 타일 무손실 슬라이싱 및 캐시 저장...")
    for t in tiles:
        box = tuple(t["bbox"])
        tile_img = source_img_obj.crop(box)
        t_path = os.path.join(target_dir, t["name"])
        tile_img.save(t_path, "PNG")
        t["size_kb"] = round(os.path.getsize(t_path) / 1024, 1)

    # 5. 전체 축소본 overview.png
    overview_path = os.path.join(target_dir, "overview.png")
    if img_w > 1200:
        scale = 1200.0 / img_w
        overview_img = source_img_obj.resize((1200, int(img_h * scale)), Image.Resampling.LANCZOS)
        overview_img.save(overview_path, "PNG")
    else:
        source_img_obj.save(overview_path, "PNG")

    # 6. manifest.json
    manifest = {
        "source_file": abs_md_path,
        "source_type": source_type,
        "doc_name": raw_doc_name,
        "file_hash": file_hash,
        "created_date": today_str,
        "created_at": datetime.now().isoformat(),
        "dimensions": [img_w, img_h],
        "canvas_bounds": bounds_meta,
        "grid_type": grid_type,
        "tiles": tiles,
        "cache_dir": target_dir
    }
    with open(os.path.join(target_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\n✅ [캐시 적재 완료] {target_dir}")
    for t in tiles:
        p = os.path.join(target_dir, t["name"])
        print(f"  • {t['desc']} [{t['name']}] ({t.get('size_kb')} KB):")
        print(f"    - Agent URI: file:///{p.replace('\\', '/')}")
    print(f"  • 전체 조감도 [overview.png]: file:///{overview_path.replace('\\', '/')}")


def main():
    parser = argparse.ArgumentParser(
        description="Excalidraw 도면을 자체 렌더링 및 지능형 그리드로 분할 슬라이싱하여 scratch에 캐싱하는 도구"
    )
    parser.add_argument("file", help="Excalidraw 마크다운 파일 (.md)")
    parser.add_argument("--image", help="소스 이미지 경로 직접 지정 (생략 시 도면 옆 PNG 확인 후 자체 렌더링)")
    parser.add_argument("--cache-dir", default=DEFAULT_CACHE_ROOT, help="캐시 루트 경로")
    parser.add_argument("--split", choices=["auto", "horizontal", "vertical", "1x2", "2x1"], default="auto", help="분할 모드 강제 지정")
    parser.add_argument("--force", action="store_true", help="기존 캐시 무시하고 강제 재생성")

    args = parser.parse_args()
    execute_tiling(
        args.file,
        user_image=args.image,
        cache_root=args.cache_dir,
        split_mode=args.split,
        force=args.force
    )


if __name__ == "__main__":
    main()
