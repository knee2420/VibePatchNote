"""
[DEPRECATED / SUNSET] Antigravity Agent Bridge Server (:8001)

이 서버는 packages/scaffold-engine의 표준 AgyHarness로 일원화되어 공식적으로 은퇴(Sunset)되었습니다.
모든 LLM 추론 및 구조화 통신은 AntigravityAgent -> AgyHarness를 통해 인프로세스로 직접 안전하게 수행됩니다.
더 이상 별도의 터미널에서 `pnpm dev:agent`를 실행할 필요가 없습니다.
"""
import json
import logging
import os
import subprocess
import sys
import time
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn

# Windows 프로세스 창 깜빡임 방지 플래그 (CREATE_NO_WINDOW = 0x08000000)
CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0

DEFAULT_MODEL = os.getenv("AGENT_CLI_MODEL", "gemini-3.8-flash-low")
DEFAULT_BIN = os.getenv("AGENT_CLI_BIN", "agy")

app = FastAPI(
    title="Antigravity Agent Bridge Server [DEPRECATED]",
    description="[DEPRECATED] packages/scaffold-engine/harness/AgyHarness 로 통합되었습니다.",
    version="1.0.0-deprecated",
)

# 콘솔 ANSI 컬러 팔레트
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


class AgentPromptRequest(BaseModel):
    prompt: str = Field(..., description="LLM 에 전달할 프롬프트")
    model: Optional[str] = Field(None, description="사용할 모델명 (미지정 시 기본 고속 모델)")
    effort: Optional[str] = Field("low", description="추론 강도 (low|medium|high)")
    timeout_seconds: Optional[int] = Field(90, description="타임아웃(초)")


class AgentPromptResponse(BaseModel):
    output: str
    elapsed_seconds: float
    model: str


class AgentJsonResponse(BaseModel):
    data: Optional[Dict[str, Any]]
    elapsed_seconds: float
    model: str


def _extract_json(raw_output: str) -> Optional[Dict[str, Any]]:
    """CLI 원문 응답에서 JSON 객체를 관대하게 추출합니다."""
    if not raw_output:
        return None

    try:
        parsed = json.loads(raw_output)
        if isinstance(parsed, dict) and "response" in parsed:
            inner = parsed.get("response")
            if isinstance(inner, str):
                try:
                    unwrapped = json.loads(inner)
                    if isinstance(unwrapped, dict):
                        return unwrapped
                except Exception:
                    pass
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # 마크다운 코드블록이나 주변 텍스트 사이에서 최외곽 중괄호 분리
    start_idx = raw_output.find("{")
    end_idx = raw_output.rfind("}")
    if start_idx != -1 and end_idx > start_idx:
        try:
            candidate = json.loads(raw_output[start_idx : end_idx + 1])
            if isinstance(candidate, dict):
                return candidate
        except Exception:
            pass

    return None


@app.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "antigravity-agent-server",
        "port": 8001,
        "default_model": DEFAULT_MODEL,
        "executable": DEFAULT_BIN,
    }


@app.post("/agent/run", response_model=AgentPromptResponse)
def run_prompt(req: AgentPromptRequest) -> AgentPromptResponse:
    start_time = time.time()
    model = req.model or DEFAULT_MODEL
    prompt_len = len(req.prompt)

    print(f"\n{CYAN}{BOLD}[📥 Prompt Received]{RESET} Length: {prompt_len:,} chars | Model: {model} | Effort: {req.effort}")

    cmd = [
        DEFAULT_BIN,
        "-p",
        req.prompt,
        "--model",
        model,
        "--dangerously-skip-permissions",
        "--disable-slash-commands",
    ]
    if req.effort:
        cmd.extend(["--effort", req.effort])

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=req.timeout_seconds,
            check=False,
            creationflags=CREATE_NO_WINDOW,
        )
    except FileNotFoundError:
        print(f"{RED}[❌ Error] agy 실행 파일을 찾을 수 없습니다: {DEFAULT_BIN}{RESET}")
        raise HTTPException(status_code=500, detail=f"Agent CLI executable not found: {DEFAULT_BIN}")
    except subprocess.TimeoutExpired:
        elapsed = round(time.time() - start_time, 2)
        print(f"{RED}[⏱️ Timeout] {req.timeout_seconds}초 초과로 CLI 실행 중단 ({elapsed}s){RESET}")
        raise HTTPException(status_code=504, detail=f"Agent CLI timed out after {req.timeout_seconds}s")
    except Exception as exc:
        print(f"{RED}[❌ Error] CLI 실행 오류: {exc}{RESET}")
        raise HTTPException(status_code=500, detail=str(exc))

    elapsed = round(time.time() - start_time, 2)
    output = (result.stdout or "").strip()

    if result.returncode != 0:
        print(f"{YELLOW}[⚠️ CLI Warning] returncode={result.returncode} | stderr: {result.stderr[:200]}{RESET}")

    print(f"{GREEN}{BOLD}[✅ Completed]{RESET} Response: {len(output):,} chars | Elapsed: {elapsed}s")

    return AgentPromptResponse(output=output, elapsed_seconds=elapsed, model=model)


@app.post("/agent/run-json", response_model=AgentJsonResponse)
def run_prompt_json(req: AgentPromptRequest) -> AgentJsonResponse:
    res = run_prompt(req)
    parsed = _extract_json(res.output)
    if parsed is None:
        print(f"{YELLOW}[⚠️ Parse Note] JSON 파싱 실패 또는 미포함 응답 (원문 길이: {len(res.output)}){RESET}")
    return AgentJsonResponse(data=parsed, elapsed_seconds=res.elapsed_seconds, model=res.model)


def main() -> None:
    print(f"\n{BOLD}{YELLOW}==============================================================={RESET}")
    print(f"{BOLD}{YELLOW}  ⚠️  Antigravity Agent Bridge Server (:8001) [SUNSET/DEPRECATED]{RESET}")
    print(f"  • 이 서버는 packages/scaffold-engine 의 AgyHarness 로 공식 일원화되었습니다.")
    print(f"  • apps/api 가 직접 CLI 를 인프로세스로 안전하게 호출하므로 이 서버는 더 이상 필요하지 않습니다.")
    print(f"  • Press {RED}Ctrl+C{RESET} to stop.")
    print(f"{BOLD}{YELLOW}==============================================================={RESET}\n")

    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")


if __name__ == "__main__":
    main()
