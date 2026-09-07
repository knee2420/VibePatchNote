"""[07.debug] agy CLI 실행 트레이스 및 Vision 인지 여부 정밀 검증기.

이 스크립트는 agy CLI를 실행하고, 내부에서 모델이:
1. 실제로 PDF 파일을 view_file 도구로 열어보았는지 (도구 호출 여부 확인)
2. 시각적 레이아웃(헤더/표/밑줄/서명란)을 어떻게 인지했는지
3. 실제 토큰 소모량과 소요 시간은 어떠한지
를 CLI 세션 트레이스(transcript.jsonl)에서 투명하게 역추적하여 리포팅합니다.
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

# 윈도우 콘솔 cp949 인코딩 에러 방지 (규칙: 50-develop/agy-cli/01_scripting_guide)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 저장소 루트 동적 탐색
curr = Path(__file__).resolve()
REPO_ROOT = next(p for p in curr.parents if (p / "apps").exists())
DEFAULT_DATASET = REPO_ROOT / "workbench" / "05.llm_tuning" / "01.outline_extraction" / "01.dataset" / "raw"

# Windows CREATE_NO_WINDOW
CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0


def find_pdf_path(doc_name: str, pdf_arg: str = None) -> Path:
    if pdf_arg:
        p = Path(pdf_arg).resolve()
        if p.exists():
            return p
    # 기본 데이터셋에서 탐색
    p = DEFAULT_DATASET / f"{doc_name}.pdf"
    if p.exists():
        return p
    # 앱 업로드 스토리지에서 탐색
    p = REPO_ROOT / "apps" / "api" / "storage" / "documents" / doc_name / f"{doc_name}.pdf"
    if p.exists():
        return p
    raise FileNotFoundError(f"PDF 문서를 찾을 수 없습니다: {doc_name}")


def run_and_inspect_cli(pdf_path: Path, model: str = "gemini-3.8-flash-low"):
    resolved_path = str(pdf_path.resolve())
    filename = pdf_path.name

    print("\n" + "=" * 76)
    print(f"  [07.debug] agy CLI Vision 인지 및 실행 트레이스 검증")
    print(f"  - 대상 문서: {filename}")
    print(f"  - 절대 경로: {resolved_path}")
    print(f"  - 사용 모델: {model}")
    print("=" * 76)

    prompt = f"""당신은 고정밀 문서 분석 전문가입니다.
[분석 대상 원본 문서]
- 파일명: {filename}
- 원본 파일 경로: {resolved_path}

지침:
1. 반드시 위 원본 파일 경로('{resolved_path}')의 문서를 직접 열람/검토(view/inspect)하여, 실제 시각적 레이아웃(헤더/표/목록의 배치, 폰트 위계, 밑줄 여부, 테두리 등)을 확인하세요.
2. 확인한 시각적 특징(Visual Layout)과 주요 제목 및 구획 구조를 요약하여 설명하세요.
"""

    cmd = [
        "agy",
        "-p",
        prompt,
        "--model",
        model,
        "--dangerously-skip-permissions",
        "--output-format",
        "json",
        "--effort",
        "low",
    ]

    print("[*] agy CLI 실행 중 (--output-format json)...")
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        creationflags=CREATE_NO_WINDOW,
    )

    if result.returncode != 0:
        print(f"[!] CLI 실행 실패 (반환 코드: {result.returncode})")
        print(result.stderr)
        return None

    try:
        cli_meta = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("[!] CLI 응답을 JSON으로 파싱하지 못했습니다. Raw output:")
        print(result.stdout[:500])
        return None

    conv_id = cli_meta.get("conversation_id")
    status = cli_meta.get("status")
    duration = cli_meta.get("duration_seconds", 0)
    usage = cli_meta.get("usage", {})
    response_text = cli_meta.get("response", "")

    print(f"\n[+] CLI 세션 실행 완료:")
    print(f"    - Conversation ID : {conv_id}")
    print(f"    - 실행 상태 (Status): {status}")
    print(f"    - 소요 시간        : {duration:.2f}s")
    print(f"    - 사용 토큰        : Input={usage.get('input_tokens')}, Output={usage.get('output_tokens')}, Total={usage.get('total_tokens')}")

    # 로컬 transcript.jsonl 탐색
    user_home = Path(os.environ.get("USERPROFILE") or os.path.expanduser("~"))
    transcript_path = user_home / ".gemini" / "antigravity-cli" / "brain" / conv_id / ".system_generated" / "logs" / "transcript.jsonl"

    trace_summary = {
        "document": filename,
        "pdf_path": resolved_path,
        "conversation_id": conv_id,
        "duration_seconds": duration,
        "usage": usage,
        "tool_calls": [],
        "viewed_pdf_directly": False,
        "model_response": response_text,
    }

    if transcript_path.exists():
        print(f"\n[+] 트레이스 로그 발견: {transcript_path}")
        print("-" * 76)
        print("  [Step별 실행 내역 (Tool Execution Trace)]")

        with open(transcript_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                step_data = json.loads(line)
                idx = step_data.get("step_index")
                stype = step_data.get("type")
                source = step_data.get("source")
                tool_calls = step_data.get("tool_calls", [])

                if tool_calls:
                    for tc in tool_calls:
                        name = tc.get("name")
                        args = tc.get("args", {})
                        print(f"  * Step {idx} [{source}]: 도구 호출 -> {name}({args})")
                        trace_summary["tool_calls"].append({"step": idx, "tool": name, "args": args})
                        if name in ("view_file", "read_file") and (resolved_path.lower() in str(args).lower() or filename.lower() in str(args).lower()):
                            trace_summary["viewed_pdf_directly"] = True
                else:
                    print(f"  * Step {idx} [{source}/{stype}]")
        print("-" * 76)
    else:
        print(f"[!] 로컬 transcript 파일을 찾지 못함: {transcript_path}")

    # 검증 판정
    print("\n" + "=" * 76)
    print("  [최종 검증 판정 (Verification Verdict)]")
    if trace_summary["viewed_pdf_directly"]:
        print("  >>> [확인 완료] 모델이 도구(view_file)를 통해 PDF 원본을 직접 열람하여 분석했습니다! (Vision 반영 확인)")
    else:
        print("  >>> [직접 뷰어 호출 없음] 도구 호출 없이 컨텍스트/프롬프트 내 지식만으로 답변을 생성했습니다.")
    print("=" * 76)

    # 모델이 인지한 내용 출력
    print("\n[+] 모델이 인지/분석한 시각적 내용 (Model Perception Summary):")
    print("-" * 76)
    print(response_text.strip())
    print("-" * 76)

    # 디버그 결과 저장
    out_file = curr.parent / f"debug_result_{pdf_path.stem}.json"
    out_file.write_text(json.dumps(trace_summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[*] 디버깅 트레이스 저장 완료: {out_file.name}")
    return trace_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="07.debug agy CLI Execution Inspector")
    parser.add_argument("--doc", default="11월_디딤돌_회의록", help="문서명 (확장자 제외)")
    parser.add_argument("--pdf", default=None, help="임의의 PDF 파일 절대 경로")
    parser.add_argument("--model", default="gemini-3.8-flash-low", help="사용할 모델명")
    args = parser.parse_args()

    pdf_file = find_pdf_path(args.doc, args.pdf)
    run_and_inspect_cli(pdf_file, model=args.model)
