"""두 번째 프롬프트 튜닝 실험 실행기 (8001 에이전트 상주 서버 경유)."""
import json
import sys
from pathlib import Path

# apps/api 경로 추가
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))

from app.core.antigravity import AntigravityAgent

def main():
    doc_name = "11월_디딤돌_회의록"
    task_dir = REPO_ROOT / "workbench" / "05.llm_tuning" / "01.outline_extraction"
    
    # 1. 문서 컨텍스트 로드
    base_md = task_dir / "03.baselines_raw_llm" / "gemini-3.5-flash" / doc_name / "outline.md"
    doc_text = base_md.read_text(encoding="utf-8") if base_md.exists() else ""

    # 2. 두 번째 실험 프롬프트: Outline 계층 세분화 + Elements 동시 추출 유도
    prompt = f"""당신은 고정밀 비즈니스 문서 구조화 AI 전문가입니다.
제공된 문서 '{doc_name}'의 회의록 내용을 분석하여, 목차(Outline Tree)와 각 섹션에 속한 데이터 요소(Elements)를 완전한 계층 트리로 추출하세요.

[핵심 추출 지침]
1. 문서의 대단락(Level 1)뿐만 아니라, 표와 본문의 세부 필드(일 시, 장 소, 참석자, 안 건, 회의내용, 지출금액, 증빙자료 등)를 반드시 하위 목차(Level 2)로 세분화하여 계층적으로 추출하세요.
2. 각 아웃라인 노드에는 반드시 해당 항목의 실제 데이터가 담긴 'elements' 리스트를 포함하세요.
   - key_value: 일시, 장소, 참석자, 안건, 지출금액 등 단일 값
   - list: 회의내용의 세부 항목 목록
   - media: 영수증, 사진 등 증빙자료
3. 영수증 지출금액에만 매몰되지 말고 회의 안건 및 기술 논의 내용을 빠짐없이 보존하세요.

[참조 문서 텍스트]
{doc_text[:4000]}

반드시 아래 JSON 스키마 규격으로만 응답하세요:
{{
  "document_title": "{doc_name}.pdf",
  "total_pages": 2,
  "outlines": [
    {{
      "id": "out-p1",
      "level": 1,
      "title": "1차 회의 (2018.11.08) - 회의비 사용 내역",
      "page": 1,
      "purpose": "1차 회의 기본 정보 및 회의비 집행 내역",
      "elements": [],
      "children": [
        {{
          "id": "out-p1-1",
          "level": 2,
          "title": "일 시",
          "page": 1,
          "purpose": "회의 일시",
          "elements": [
            {{
              "id": "elem-p1-1",
              "outline_id": "out-p1-1",
              "type": "key_value",
              "label": "일 시",
              "value": "2018.11.08",
              "page": 1
            }}
          ],
          "children": []
        }}
      ]
    }}
  ]
}}
"""

    print(f"[*] Starting Experiment 2 for {doc_name} via :8001 agent...")
    agent = AntigravityAgent(model="gemini-3.8-flash-low", timeout_seconds=90)
    result = agent.run_json(prompt)

    if not result:
        print("[!] Experiment 2 failed: No JSON returned from model.")
        sys.exit(1)

    out_dir = task_dir / "04.experiments" / doc_name
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "result_exp2_gemini-3.8-flash-low.json"
    out_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[*] Experiment 2 Result saved to: {out_file.name}")
    print(f"[*] Outlines: {len(result.get('outlines', []))} root nodes")

if __name__ == "__main__":
    main()
