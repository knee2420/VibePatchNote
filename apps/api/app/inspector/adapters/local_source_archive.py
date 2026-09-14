"""`SourceArchivePort` 의 구현. 저장소 안의 소스 코드를 읽는다.

**탐색하지 않는다.** `module` 은 `importlib` 이 정확히 한 파일로 해석하고,
`file_path` 는 저장소 루트 기준 정확 경로로만 받는다.

예전에는 파일명(basename)으로 `apps/**` 와 `packages/**` 를 전수 glob 한 뒤
**파일 크기 내림차순**으로 골랐다. 그래서

    요청: packages/scaffold-engine/.../outline/schema.py   (존재하지 않는 경로)
    반환: apps/api/venv/Lib/site-packages/pydantic/v1/schema.py  (47KB 라서 1등)

이 되었고, 이 노드는 모든 run 의 검증 스팬에 있었다. 실측 비용도 요청당
1.4초였다 — node_modules 와 venv 를 매번 훑었기 때문이다.

저장소 루트는 컨테이너가 주입한다. 어댑터가 `settings` 를 열어 경로를 지어내면
"경로를 아는 곳"이 다시 늘어난다.
"""
from __future__ import annotations

import ast
import importlib.util
import logging
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

#: 확장자 → 표시 언어.
_LANGUAGES = {
    ".py": "python",
    ".md": "markdown",
    ".json": "json",
    ".toml": "toml",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
}

#: 저장소 안이라도 여기 있는 파일은 우리 코드가 아니다.
_EXCLUDED_PARTS = frozenset({"venv", "node_modules", ".venv", "site-packages", "dist", ".turbo"})


class LocalSourceArchive:
    """저장소 루트 아래의 우리 코드만 읽어 준다."""

    def __init__(self, repo_root: Path) -> None:
        self._repo_root = repo_root.resolve()

    def read(
        self,
        *,
        file_path: Optional[str] = None,
        symbol: Optional[str] = None,
        module: Optional[str] = None,
    ) -> Optional[dict[str, Any]]:
        target = self._resolve_module(module) if module else self._resolve_path(file_path)
        if target is None:
            return None

        try:
            raw_text = target.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            logger.warning("[Inspector] 소스를 읽지 못했습니다 (%s): %s", target, exc)
            return None

        lines = raw_text.splitlines()
        start_line, end_line, content = 1, len(lines), raw_text
        if symbol and target.suffix.lower() == ".py":
            extracted = self._extract_symbol(raw_text, symbol)
            if extracted is None:
                # 심볼을 못 찾으면 파일 전체를 준다. 다만 조용히 넘어가지 않는다 —
                # 심볼 이름이 바뀌었다는 신호이기 때문이다.
                logger.info(
                    "[Inspector] 심볼을 찾지 못해 파일 전체를 반환합니다: %s::%s", target.name, symbol
                )
            else:
                start_line, end_line, content = extracted

        return {
            "file_path": target.relative_to(self._repo_root).as_posix(),
            "symbol": symbol,
            "content": content,
            "start_line": start_line,
            "end_line": end_line,
            "total_lines": len(lines),
            "language": _LANGUAGES.get(target.suffix.lower(), "text"),
        }

    # --- 해석 ----------------------------------------------------------

    def _resolve_module(self, module: str) -> Optional[Path]:
        """import 가능한 이름을 파일 하나로 해석한다. 추측하지 않는다."""
        if not module or not all(part.isidentifier() for part in module.split(".")):
            return None
        try:
            spec = importlib.util.find_spec(module)
        except (ImportError, ValueError, AttributeError) as exc:
            logger.info("[Inspector] 모듈을 찾지 못했습니다 (%s): %s", module, exc)
            return None
        if spec is None or not spec.origin:
            return None
        return self._accept(Path(spec.origin))

    def _resolve_path(self, file_path: Optional[str]) -> Optional[Path]:
        """저장소 루트 기준 **정확 경로**만 받는다."""
        if not file_path:
            return None
        clean = file_path.strip().replace("\\", "/").lstrip("/")
        if not clean:
            return None
        return self._accept(self._repo_root / clean)

    def _accept(self, candidate: Path) -> Optional[Path]:
        """저장소 안의 우리 코드일 때만 통과시킨다."""
        try:
            resolved = candidate.resolve()
        except OSError:
            return None

        if not resolved.is_relative_to(self._repo_root):
            # 경로 탈출이거나 site-packages 다. 어느 쪽이든 보여줄 것이 아니다.
            return None
        if _EXCLUDED_PARTS & set(resolved.relative_to(self._repo_root).parts):
            return None
        if not resolved.is_file():
            return None
        return resolved

    @staticmethod
    def _extract_symbol(raw_text: str, symbol: str) -> Optional[tuple[int, int, str]]:
        """`Class.method` 또는 `name` 을 AST 로 정확히 잘라낸다."""
        parts = [p for p in symbol.strip().split(".") if p]
        if not parts:
            return None
        try:
            tree = ast.parse(raw_text)
        except SyntaxError:
            return None

        definitions = (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
        node: Optional[ast.AST] = None

        if len(parts) == 1:
            for candidate in ast.walk(tree):
                if isinstance(candidate, definitions) and candidate.name == parts[0]:
                    node = candidate
                    break
        else:
            cls_name, member = parts[0], parts[1]
            for candidate in ast.walk(tree):
                if isinstance(candidate, ast.ClassDef) and candidate.name == cls_name:
                    node = candidate  # 멤버를 못 찾으면 클래스 전체가 답이다.
                    for child in candidate.body:
                        if isinstance(child, definitions) and child.name == member:
                            node = child
                            break
                    break

        if node is None:
            return None

        start = getattr(node, "lineno", 1)
        end = getattr(node, "end_lineno", None) or len(raw_text.splitlines())
        body = "\n".join(raw_text.splitlines()[start - 1:end])
        return start, end, body
