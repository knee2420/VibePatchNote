"""
[02.reconstruct_v2] Tiptap 스캐폴드 HTML 하이드레이터.
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

    return html


def _get_attr(attrs_str: str, key: str, default: str = "") -> str:
    m = re.search(rf'{key}=["\']([^"\']+)["\']', attrs_str)
    return m.group(1) if m else default
