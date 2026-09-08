"""
[02.reconstruct] Tiptap 스캐폴드 HTML 하이드레이터 (ScaffoldHydrator).
data-* 속성만 가진 raw scaffold.html 을 읽어,
Tiptap NodeView 가 동적으로 주입하는 것과 100% 동일한 인라인 스타일(style="...")을
완벽하게 주입하여 순수 브라우저 및 Tiptap 어디서든 완벽한 표와 절대 배치가 렌더링되도록 보장합니다.
"""
from __future__ import annotations

import re

JUSTIFY_MAP = {
    "right": "flex-end",
    "center": "center",
    "left": "flex-start",
}


def hydrate_scaffold_html(html: str) -> str:
    """raw scaffold.html 에 완벽한 Tiptap 스타일 주입."""
    if not html:
        return ""

    # 1. scaffold-page
    def repl_page(m):
        attrs = m.group(1)
        w = _get_attr(attrs, "data-w", "595")
        h = _get_attr(attrs, "data-h", "842")
        style = f"position:relative;width:{w}px;height:{h}px;background:#ffffff;overflow:hidden;margin:0 auto;"
        return f'<div data-type="scaffold-page"{attrs} class="scaffold-page" style="{style}">'

    html = re.sub(r'<div\s+data-type=["\']scaffold-page["\']([^>]*)>', repl_page, html)

    # 2. scaffold-frame (표 컨테이너)
    def repl_frame(m):
        attrs = m.group(1)
        x = _get_attr(attrs, "data-x", "0")
        y = _get_attr(attrs, "data-y", "0")
        w = _get_attr(attrs, "data-w", "500")
        h = _get_attr(attrs, "data-h", "300")
        style = f"position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;box-sizing:border-box;"
        return f'<div data-type="scaffold-frame"{attrs} class="scaffold-frame" style="{style}">'

    html = re.sub(r'<div\s+data-type=["\']scaffold-frame["\']([^>]*)>', repl_frame, html)

    # 3. table
    def repl_table(m):
        attrs = m.group(1)
        style = "width:100%;height:100%;border-collapse:collapse;table-layout:fixed;border:1.5px solid #334155;box-sizing:border-box;"
        return f'<table{attrs} class="scaffold-table" style="{style}">'

    html = re.sub(r'<table([^>]*)>', repl_table, html)

    # 4. tr[data-hpx]
    def repl_tr(m):
        attrs = m.group(1)
        hpx = _get_attr(attrs, "data-hpx")
        style = f"height:{hpx}px;box-sizing:border-box;" if hpx else ""
        return f'<tr{attrs} style="{style}">'

    html = re.sub(r'<tr([^>]*)>', repl_tr, html)

    # 5. th / td
    def repl_cell(m):
        tag = m.group(1)
        attrs = m.group(2)
        wpx = _get_attr(attrs, "data-wpx")
        fs = _get_attr(attrs, "data-fs", "10")
        fill = 'data-fill="true"' in attrs or "data-fill='true'" in attrs

        style_items = [
            "border:1px solid #334155",
            "vertical-align:middle",
            "overflow:hidden",
            "box-sizing:border-box",
        ]
        if wpx:
            style_items.append(f"width:{wpx}px")
        if fs:
            style_items.append(f"font-size:{fs}px")

        if tag == "th":
            style_items.append("text-align:center")
            style_items.append("font-weight:600")
            style_items.append("background:#f8fafc")
            style_items.append("color:#1e293b")
        else:
            style_items.append("color:#334155")

        if fill:
            style_items.append("padding:0")
        else:
            style_items.append("padding:3px 6px")

        style = ";".join(style_items)
        return f'<{tag}{attrs} style="{style}">'

    html = re.sub(r'<(th|td)([^>]*)>', repl_cell, html)

    # 6. scaffold-block
    def repl_block(m):
        attrs = m.group(1)
        x = _get_attr(attrs, "data-x", "0")
        y = _get_attr(attrs, "data-y", "0")
        w = _get_attr(attrs, "data-w", "100")
        h = _get_attr(attrs, "data-h", "20")
        fs = _get_attr(attrs, "data-fs", "10")
        align = _get_attr(attrs, "data-align", "left")
        variant = _get_attr(attrs, "data-variant", "text")
        justify = JUSTIFY_MAP.get(align, "flex-start")

        style_items = [
            "position:absolute",
            f"left:{x}px",
            f"top:{y}px",
            f"width:{w}px",
            f"height:{h}px",
            f"font-size:{fs}px",
            "line-height:1",
            "display:flex",
            "align-items:center",
            f"justify-content:{justify}",
            "white-space:nowrap",
            "overflow:hidden",
            "box-sizing:border-box",
        ]
        if variant == "rule":
            style_items.append("background:#64748b")
            style_items.append("pointer-events:none")
        elif variant == "image":
            style_items.append("border:1px dashed #cbd5e1")
            style_items.append("background:#f8fafc")

        style = ";".join(style_items)
        return f'<div data-type="scaffold-block"{attrs} class="scaffold-block scaffold-block-{variant}" style="{style}">'

    html = re.sub(r'<div\s+data-type=["\']scaffold-block["\']([^>]*)>', repl_block, html)

    return html


def _get_attr(attrs_str: str, key: str, default: str = "") -> str:
    m = re.search(rf'{key}=["\']([^"\']+)["\']', attrs_str)
    return m.group(1) if m else default
