# Scaffold Engine (Python)

호스트 비의존 문서 스캐폴딩 엔진. 임의의 PDF 에서 **내용(인스턴스 값)은 비우고
뼈대와 슬롯만 남긴 Tiptap 서식**과, 원본 문서에서의 **슬롯 실측 좌표**를 만든다.

---

## 설계 원칙 — 좌표는 AI 가 만들지 않는다

이 엔진의 핵심 불변식은 하나다.

> **좌표·행 높이·열 너비는 측정 단계에서만 생성된다.**
> 에이전트의 출력 스키마에는 좌표 필드 자체가 존재하지 않는다.

LLM 은 정밀 측정을 못 한다(환각한다). 그래서 "이 셀의 좌표가 얼마인가" 를 묻지 않고
**"이 글자는 새 문서를 쓸 때 지우고 다시 쓰는가"** 하나만 묻는다. 좌표는 PyMuPDF 가
실측한 값을 그대로 쓴다. 문서 종류가 바뀌어도 매핑이 어긋나지 않는 이유다.

---

## 파이프라인

```text
A 측정(결정적)  ->  B 판정(에이전트)  ->  C 조립(결정적)  ->  D 채점
extract/           classify/            assemble/          score/
```

| 단계 | 모듈 | 하는 일 | AI |
| --- | --- | --- | --- |
| A | `extract/geometry.py` | 표 경계·셀·행 높이·열 너비·텍스트 라인·이미지·구분선 실측 | ✗ |
| B | `classify/` | 블록별 역할 판정 (`title`/`label`/`value`/`mixed`/`decoration`) | ✓ |
| C | `assemble/html.py` | 실측 좌표로 HTML·Markdown·슬롯 조립 | ✗ |
| D | `score/fidelity.py` | 원본 기하 대비 IoU 채점 | ✗ |

`mixed` 는 한 줄에 고정 라벨과 데이터가 섞인 경우(`Invoice 000081709`)를 위한 역할이다.
에이전트는 비울 문자열만 지목하고, 그 부분의 좌표는 코드가 원문 검색으로 확정한다.

---

## 확장 지점

부품은 전부 `core/interfaces.py` 의 프로토콜에만 의존한다. 파이프라인 코드를 고치지
않고 갈아끼울 수 있다.

```python
from scaffold_engine import ScaffoldPipeline
from scaffold_engine.core.interfaces import LlmHarness

class MyHarness:                      # LlmHarness 프로토콜 구현
    name = "my-vendor"
    def run_json(self, prompt, schema=None, retries=2, retry_hint=""):
        ...

pipeline = ScaffoldPipeline(harness=MyHarness())
```

기본 하네스는 `harness/agy_client.py` (Antigravity CLI) 다.
`harness/parsing.py` 가 CLI 래퍼·코드펜스·배열 반환 등 형식 이탈을 흡수하고,
형식을 못 지키면 힌트를 덧붙여 재시도한다.

---

## 설치

`apps/api/requirements.txt` 가 이 패키지를 편집 가능 모드로 함께 설치한다.

```bash
pip install -r apps/api/requirements.txt
```

단독 설치:

```bash
pip install -e packages/scaffold-engine
```

`agy` CLI 가 PATH 에 있어야 판정 단계가 동작한다. 없으면 판정이 비고 모든 블록이
고정 텍스트로 렌더된다(기하는 그대로 정확하다).

---

## 사용법

```bash
python -m scaffold_engine.cli extract "path/to/document.pdf" --page 1
```

```python
from scaffold_engine import ScaffoldPipeline

result = ScaffoldPipeline().run("path/to/document.pdf")
print(result.html_content)      # Tiptap 렌더용
print(result.markdown_content)  # 에이전트/MCP 용
for slot in result.slots:
    print(slot.number, slot.label, slot.box_2d)  # 원본 실측 좌표
```

`slots[].box_2d` 는 `[ymin, xmin, ymax, xmax]` 이며 **해당 페이지 기준** 0~1000
정규화 값이다. 프런트에서 그릴 때는 반드시 페이지 요소 안에서 렌더해야 한다
(뷰어 컨테이너 기준으로 그리면 패딩·페이지 간격·스크롤만큼 어긋난다).

---

## 한계

- **스캔 PDF 미지원.** 텍스트 레이어가 없으면 `ScannedDocumentError` 를 던진다.
  OCR 또는 비전 경로가 필요하다 (`vision/pdf_renderer.py` 는 이를 위한 렌더러이며
  현재 파이프라인에서는 사용하지 않는다).
- 한 번에 한 페이지를 처리한다 (`run(pdf, page_number=...)`).
