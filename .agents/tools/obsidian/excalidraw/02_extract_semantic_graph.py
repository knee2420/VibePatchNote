#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
[02_extract_semantic_graph.py]
역할: Excalidraw의 Drawing JSON(압축/비압축)을 해독하여,
      스타일/좌표/버전 등 수만 토큰의 렌더링 노이즈를 100% 제거하고
      노드(도형/텍스트/이미지)와 화살표(Arrow) 연결 관계만 추출하여
      초경량 Mermaid 다이어그램 및 시맨틱 위상 구조(Topology)로 압축 변환합니다.
목적: 50,000+ 토큰의 드로잉을 300~500 토큰의 간결한 구조도로 압축하여 LLM에 주입
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

try:
    import lzstring
except ImportError:
    lzstring = None


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


def decompress_drawing_json(content: str) -> dict:
    """## Drawing 섹션에서 compressed-json 또는 json을 파싱"""
    m_comp = re.search(r'```compressed-json\s*([\s\S]*?)\s*```', content)
    if m_comp:
        if not lzstring:
            raise RuntimeError("lzstring library is required to decompress compressed-json. Run: pip install lzstring")
        raw_b64 = m_comp.group(1).replace('\n', '').replace('\r', '').strip()
        lz = lzstring.LZString()
        decomp = lz.decompressFromBase64(raw_b64)
        if not decomp:
            raise ValueError("Failed to decompress compressed-json.")
        return json.loads(decomp), len(raw_b64), len(decomp)

    m_json = re.search(r'```json\s*([\s\S]*?)\s*```', content)
    if m_json:
        raw_json = m_json.group(1).strip()
        return json.loads(raw_json), len(raw_json), len(raw_json)

    raise ValueError("No valid ```compressed-json``` or ```json``` block found in Excalidraw markdown.")


def clean_label(text: str, max_len: int = 40) -> str:
    """Mermaid 노드 라벨 정제 (특수문자 이스케이프 및 개행 축약)"""
    if not text:
        return ""
    text = text.replace('"', "'").replace("\r", "")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    joined = "<br/>".join(lines)
    if len(joined) > max_len:
        joined = joined[:max_len] + "..."
    return joined


def build_semantic_graph(file_path: str, format_type: str = "mermaid", max_text_len: int = 50):
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    file_map = parse_embedded_files(content)
    drawing_data, raw_size, decomp_size = decompress_drawing_json(content)

    elements = drawing_data.get("elements", [])
    id_map = {e["id"]: e for e in elements if not e.get("isDeleted")}

    # 1. 컨테이너/도형과 텍스트 바인딩 매핑
    container_to_text = {}
    for e in elements:
        if e.get("isDeleted"):
            continue
        if e.get("type") == "text":
            cid = e.get("containerId")
            if cid:
                container_to_text[cid] = e.get("text", "")

    # 도형의 boundElements에 연결된 텍스트 확인
    for e in elements:
        if e.get("isDeleted"):
            continue
        eid = e.get("id")
        if eid not in container_to_text and e.get("type") in ["rectangle", "ellipse", "diamond"]:
            for b in e.get("boundElements", []) or []:
                bid = b.get("id")
                if bid in id_map and id_map[bid].get("type") == "text":
                    container_to_text[eid] = id_map[bid].get("text", "")
                    break

    # 2. 노드 정의 (도형, 독립 텍스트, 이미지)
    nodes = {}
    arrows = []

    for e in elements:
        if e.get("isDeleted"):
            continue
        eid = e.get("id")
        etype = e.get("type")

        if etype == "arrow":
            arrows.append(e)
            continue

        # 텍스트가 다른 컨테이너에 종속되어 있다면 독립 노드로 취급하지 않음
        if etype == "text" and (e.get("containerId") or any(e.get("id") in str(c.get("boundElements", [])) for c in elements)):
            continue

        label = ""
        node_kind = etype

        if etype == "image":
            fid = e.get("fileId", "")
            fname = file_map.get(fid, f"Image_{fid[:8]}")
            label = f"📷 [[{fname}]]"
            node_kind = "image"
        elif eid in container_to_text:
            label = container_to_text[eid]
        elif etype == "text":
            label = e.get("text", "")
        else:
            # 텍스트 없는 도형 (포인터 마커 또는 단순 박스)
            if etype == "ellipse" and e.get("width", 0) < 30 and e.get("strokeColor") == "#e03131":
                label = "🔴 UI 포인터 마커"
                node_kind = "pointer"
            else:
                label = f"[{etype.capitalize()}]"

        nodes[eid] = {
            "id": eid,
            "type": node_kind,
            "raw_text": label,
            "label": clean_label(label, max_len=max_text_len),
            "x": round(e.get("x", 0), 1),
            "y": round(e.get("y", 0), 1)
        }

    # 3. 엣지 연결 (Arrow의 startBinding -> endBinding)
    edges = []
    unconnected_arrows = 0

    for a in arrows:
        aid = a.get("id")
        sb = a.get("startBinding")
        eb = a.get("endBinding")

        sid = sb.get("elementId") if sb else None
        eid = eb.get("elementId") if eb else None

        # 바인딩 ID가 종속 텍스트 ID라면 부모 컨테이너 ID로 리매핑
        for cid, elem in id_map.items():
            if elem.get("type") in ["rectangle", "ellipse", "diamond"]:
                bound_ids = [b.get("id") for b in elem.get("boundElements", []) or []]
                if sid in bound_ids:
                    sid = cid
                if eid in bound_ids:
                    eid = cid

        if sid and eid:
            # 화살표에 텍스트가 바인딩되어 있는지 확인
            arrow_text = container_to_text.get(aid, "")
            edges.append({
                "from": sid,
                "to": eid,
                "label": clean_label(arrow_text, max_len=20) if arrow_text else ""
            })
        else:
            unconnected_arrows += 1

    # 4. 결과 출력 포맷팅
    mermaid_lines = ["```mermaid", "graph TD"]
    
    # 노드 ID 알파벳 정규화 (Mermaid 안전 ID)
    def safe_id(nid: str) -> str:
        return "N_" + re.sub(r'[^a-zA-Z0-9_]', '_', nid)

    # 연결에 참여하거나 라벨이 의미 있는 노드만 선언
    active_node_ids = set()
    for edge in edges:
        active_node_ids.add(edge["from"])
        active_node_ids.add(edge["to"])

    for nid, node in nodes.items():
        if nid in active_node_ids or (node["raw_text"] and not node["raw_text"].startswith("[")):
            sid = safe_id(nid)
            lbl = node["label"]
            if node["type"] == "image":
                mermaid_lines.append(f'    {sid}["{lbl}"]:::imageClass')
            elif node["type"] == "pointer":
                mermaid_lines.append(f'    {sid}(("{lbl}")):::pointerClass')
            elif node["type"] in ["rectangle", "text"]:
                mermaid_lines.append(f'    {sid}["{lbl}"]')
            else:
                mermaid_lines.append(f'    {sid}("{lbl}")')

    for edge in edges:
        from_sid = safe_id(edge["from"])
        to_sid = safe_id(edge["to"])
        if edge["label"]:
            mermaid_lines.append(f'    {from_sid} -- "{edge["label"]}" --> {to_sid}')
        else:
            mermaid_lines.append(f'    {from_sid} --> {to_sid}')

    # 클래스 스타일
    mermaid_lines.append("    classDef imageClass fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;")
    mermaid_lines.append("    classDef pointerClass fill:#ffebee,stroke:#d32f2f,stroke-width:2px;")
    mermaid_lines.append("```")

    mermaid_output = "\n".join(mermaid_lines)
    approx_tokens_original = int(decomp_size / 3.5)
    approx_tokens_compressed = int(len(mermaid_output) / 3.5)
    savings = (1 - (len(mermaid_output) / decomp_size)) * 100 if decomp_size else 0

    print(f"=== [Excalidraw Semantic Graph: {os.path.basename(file_path)}] ===")
    print(f"- 원본 드로잉 크기: {decomp_size:,} bytes (약 {approx_tokens_original:,} 토큰)")
    print(f"- 압축 그래프 크기: {len(mermaid_output):,} bytes (약 {approx_tokens_compressed:,} 토큰)")
    print(f"- 토큰 절감율: {savings:.1f}% 절감 | 활성 노드: {len(active_node_ids)}개 | 연결 엣지: {len(edges)}개\n")

    print(mermaid_output)


def main():
    parser = argparse.ArgumentParser(
        description="Excalidraw 드로잉에서 화살표 연결 관계와 핵심 노드만 추출하여 Mermaid 다이어그램으로 압축하는 도구"
    )
    parser.add_argument("file", help="Excalidraw 마크다운 파일 (.md)")
    parser.add_argument("--max-len", type=int, default=40, help="노드 라벨 최대 문자 수 (기본 40자)")

    args = parser.parse_args()
    build_semantic_graph(args.file, max_text_len=args.max_len)


if __name__ == "__main__":
    main()
