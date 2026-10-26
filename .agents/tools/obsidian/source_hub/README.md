# 🗂️ Source Hub Card Tools (`.agents/tools/obsidian/source_hub`)

외부 볼트(`What-s-in-my-head`)의 **서식 수급처 카드**(`3.📦(Resource) 자료/📑 문서_서식_수집_파이프라인/1.collection/` 의 Top 10 카드 34장)를
만들고 검사하는 **독립 실행형 CLI 도구 묶음**입니다.

작업 에이전트의 "확인했습니다" 라는 말을 믿지 않고, **제3자가 다시 확인할 수 있는 증거**를 남기고 검사하는 것이 목적입니다.
(2026-10-25 — Antigravity 가 브라우저가 막히자 PIL 로 "검증 캡처" 10장을 그려 넣고, 짐작한 URL 3개가 404 였는데도 "전수 검증 완료" 라고 보고한 일이 계기입니다)

쓰는 스킬: `external_pm_05_source_hub_card_generator` (작업자) · `external_pm_06_source_hub_card_reviewer` (리뷰어)

---

## 📂 도구 목록

| 도구 스크립트 | 누가 | 역할 |
| :--- | :--- | :--- |
| **`01_capture_hub_page.py`** | 작업자 · 리뷰어 | Edge/Chrome 헤드리스로 주소를 실제로 찍고, 위아래만 크롭해서, 이미지 폴더의 `capture_manifest.json` 에 주소 · 시각 · sha256 을 남김. 봇 차단 페이지는 `register` 로 사람 브라우저 화면을 등록 |
| **`02_verify_hub_card.py`** | 작업자(자가 검사) · 리뷰어(게이트) | 카드 한 장의 기계 검사. FAIL 이 있으면 종료 코드 1 |
| **`03_append_hub_to_outline.py`** | 작업자 | 신규 실측 허브를 마스터 아웃라인 5번 노드에 안전하게 누적 등록하고, 도메인 중복 차단 및 38개 정규 어휘 뱃지 규격 강제 |
| **`04_generate_hub_reference_card.py`** | 작업자 | 검증 완료된 허브를 '1.collection' 밖 상위 디렉터리에 독립 레퍼런스 카드('(web)<허브명>.md')로 자동 생성 및 캡처 이미지 paste |

## 🔍 `02_verify_hub_card.py` 검사 규칙

| 규칙 ID | 수준 | 걸리는 것 |
| :--- | :--- | :--- |
| `H-LINK-001` | FAIL | `링크` 주소가 4xx/5xx, 또는 200 인데 제목이 오류 페이지 (`오류페이지` · `Not Found` · `페이지 변경 안내`) |
| `H-LINK-002` | FAIL | 로그인 화면으로 넘어감 (공개 허브가 아님) |
| `H-LINK-003` | WARN | Cloudflare 등 봇 차단 화면 — 사람이 보는 브라우저로 확인 |
| `H-LINK-004` | WARN | 다른 사이트로 리다이렉트 (예: `create.microsoft.com` → `m365.cloud.microsoft`) |
| `H-LINK-005` | FAIL | `링크` 속성이 비어 있음 |
| `H-IMG-001` | FAIL | 본문에 끼운 이미지 파일이 없음 |
| `H-IMG-002` | FAIL | **manifest 에 기록이 없는 이미지** (= 01 로 찍지 않은 것, 그린 그림일 수 있음) 또는 sha256 불일치 (찍은 뒤 손댐) |
| `H-IMG-003` | WARN | `register` 로 등록한 사람 브라우저 화면 — 리뷰어가 눈으로 확인 |
| `H-IMG-004` | FAIL | 캡처한 주소가 `링크` 에 없음 (엉뚱한 페이지를 찍음) |
| `H-IMG-005` | WARN | 캡처가 없는 링크 |
| `H-IMG-006` | WARN | 링크 수와 이미지 수가 다름 |
| `H-IMG-007` | FAIL | 캡처가 한 장도 없음 |
| `H-BODY-001` | FAIL | `링크` 에는 있는데 본문에 없는 주소 |
| `H-BODY-002` | WARN | 자기 인증 문구 (`전수 검증` · `검증 완료` · `100%` · `완벽` · `검증된 공식`) |
| `H-BODY-003` · `004` | FAIL | `요약` · `작성자` 가 비어 있음 |
| `H-OBS-001` | FAIL | 볼트 공통 린터 `../validator/validate_obsidian_note.py` 의 위반 (속성 · LF · 단일 분류 등) |

## 💻 빠른 실행 예시

```bash
# 1. 허브 페이지 찍기 (넉넉히 찍고 광고·쿠키 배너 아래를 자른다)
python .agents/tools/obsidian/source_hub/01_capture_hub_page.py capture \
  --url "https://www.klac.or.kr/legalinfo/legalFrm.do" \
  --out "<카드폴더>/이미지/무료 서식 허브 01 - 대한법률구조공단 법률서식.png" \
  --crop-top 370 --crop-bottom 1620

# 2. 헤드리스가 막힌 페이지 — 사람 브라우저로 저장한 화면을 등록 (까닭 필수)
python .agents/tools/obsidian/source_hub/01_capture_hub_page.py register \
  --file "<카드폴더>/이미지/무료 서식 허브 10 - SCORE 템플릿.png" \
  --url "https://www.score.org/templates/" --reason "Cloudflare 가 헤드리스 브라우저를 막음"

# 3. 리뷰어의 대조용 재촬영 (manifest 에 안 남김)
python .agents/tools/obsidian/source_hub/01_capture_hub_page.py capture --url "<주소>" --out "<임시폴더>/recheck.png" --no-manifest

# 4. 카드 검사 (리뷰어는 --json 으로 결과 파일도 남긴다)
python .agents/tools/obsidian/source_hub/02_verify_hub_card.py "<카드.md>"
python .agents/tools/obsidian/source_hub/02_verify_hub_card.py "<카드.md>" --json "<임시폴더>/report.json"

# 5. 독립 레퍼런스 카드('(web)<허브명>.md') 자동 생성 (최종 단계)
python .agents/tools/obsidian/source_hub/04_generate_hub_reference_card.py --card "<카드.md>"
python .agents/tools/obsidian/source_hub/04_generate_hub_reference_card.py --all-outline
```

## ⚠️ 알려진 한계

- `02` 의 링크 검사는 HTTP 요청이라 **자바스크립트로 그리는 목록은 못 봅니다.** "목록이 실제로 뜨는가" 는 캡처와 리뷰어 눈으로 확인합니다.
- manifest 도 손으로 지어낼 수는 있습니다. 그래서 리뷰어는 표본 링크를 `--no-manifest` 로 **다시 찍어 나란히 비교**합니다 (`external_pm_06` Step 2).
- 헤드리스 화면은 사람 화면과 언어가 다를 수 있습니다 (예: 노션이 영어 UI). 카드의 문구는 **캡처에 보이는 글자**와 맞춥니다.
- 필요한 것: Python 3.10+, `PyYAML`, `Pillow`, Edge 또는 Chrome.
