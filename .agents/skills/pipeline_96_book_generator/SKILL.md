---
name: "pipeline_96_book_generator"
description: "사용자가 새로운 책, 문서, 혹은 방대한 도서 자료를 'workbench/96.data_pipeline'에 추가하고 체계적으로 구조화(카드화)해달라고 요청할 때 발동합니다."
---

# Pipeline 96: Book Generator

## 1. 목적

`workbench/99.archive`나 `workbench/97.reference`의 원문(Raw)을 **원문을 다시 열 필요가 없는 메타 인덱스**로 재조립하여 **`workbench/96.data_pipeline/[도서_주제명]/`** 에 구축한다.
산출물은 세 층이다 — 카드(Card) · 로컬 인덱스(Section Index) · 루트 인덱스(Root Index).

판단 기준은 하나다. **에이전트가 이 파이프라인만 읽고 "어느 파일 어느 element에 무엇이 있다"를
말할 수 있는가.** 말하지 못하면 밀도가 부족한 것이다.

## 2. 절대 규칙 (위반 시 산출물 폐기)

1. **원문 문장을 복사하지 않는다.** summary는 원문의 결론을 압축한 새 문장이어야 한다.
2. **존재하지 않는 파일을 링크하지 않는다.** 링크는 쓰기 전에 실제 경로를 확인한다. (§6 검증 스크립트 필수 실행)
3. **elements를 1~2개로 때우지 않는다.** 밀도 기준은 §3.
4. **모든 index.md는 프론트매터 5필드**(`type, title, description, resource, timestamp`)를 가진다. 2필드 인덱스는 구버전이며 금지.
5. **분석을 쓴다.** "~을 담고 있습니다" 같은 목록 나열이 아니라, **분량이 어디에 쏠렸는지 · 무엇이 중복인지 · 무엇이 비어 있는지**를 적는다. 인덱스의 값어치는 목록이 아니라 판단에 있다.
6. **장식용 이모지를 쓰지 않는다.** 예외는 `⚠️`(결손·주의 표시) 하나뿐이다.

## 3. elements 밀도 기준 — 원문 분량 비례

카드의 elements 개수는 **원문 파일 크기에 비례**한다. 균일하게 맞추지 않는다.

| 원문 크기 | elements | 비고 |
|---|---|---|
| ~3KB | 2~3 | 서문·목차 등 짧은 길잡이 |
| 3~7KB | 4~6 | 일반 본문 절 |
| 7~15KB | 6~10 | 표·코드가 붙은 본문 |
| 15~25KB | 12~17 | 장 전체를 담은 파일 |
| 25KB~ | 17+ | 분할을 먼저 검토 |

**한 element = 원문에서 독립적으로 인용·재사용될 수 있는 최소 단위.**
표 1개, 코드블록 1개, 명명된 원칙 1세트, 사례 1건이 각각 하나다.
`anchor`에는 그 element가 실제로 있는 원문 헤딩을 적는다 — 추정 금지.

`kind`는 다음 중에서 고른다: `개념 · 원칙 · 규칙 · 구조 · 아키텍처 · 템플릿 · 코드 · 표 · 절차 · 사례 · 지표 · 비교 · 안티패턴 · 도구 · 인용 · 참조`

## 4. 산출물 템플릿

### 산출물 1: 지식 카드

- **파일명:** `C-XX-XX_핵심키워드.md`

```markdown
---
type: card
title: 카드 제목
description: 이 카드에 무엇이 들어있는지 한 줄. 주제 소개가 아니라 내용물 목록에 가깝게.
resource: "../../../99.archive/[원본 상대 경로]"
timestamp: YYYY-MM-DD
---

# summary
[원문의 결론과 핵심 맥락을 2~4줄로 압축. 굵게 표시는 이 카드에서 가장 값나가는 것 하나에만.]

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 개념 | [요소 이름] | [1~2줄 핵심 설명. 표·코드면 그 사실을 명시] | `## [원문 헤딩]` |
| E2 | 템플릿 | [요소 이름] | [복붙 가능한 산출물이면 그렇다고 쓴다] | `### [원문 헤딩]` |
| … | | | | |

# 밖으로
- [E1] 요소는 `[C-XX-XX 카드명](상대경로)`의 EN과 **같은 내용을 다른 해상도로** 서술한다. 인용은 [둘 중 어느 쪽]이 낫다
- [E2]의 전제가 `[C-XX-XX 카드명](상대경로)` EN에 있다 — 먼저 읽어야 이해됨
- ⚠️ [흩어진 것 · 대응하지 않는 것 · 원문이 연결해주지 않는 것이 있으면 여기 경고로 남긴다]

# 원문
[아카이브 원본](상대 경로) · [외부 출처 URL이 있으면 함께]
```

`# 밖으로`는 **폴더 밖 카드와의 관계**를 쓰는 자리다. 같은 폴더 안 카드끼리의 순서 안내는 로컬 인덱스가 맡는다.
관계 유형은 세 가지로 충분하다 — **① 같은 내용의 해상도 차이 ② 전제/후속 ③ 원문이 연결해주지 않는 흩어짐(⚠️).**

### 산출물 2: 로컬 인덱스 (각 하위 디렉토리의 `index.md`)

```markdown
---
type: index
title: NN_폴더명
description: 이 폴더가 무엇을 다루는지 + 이 폴더의 특이점 한 줄
resource: "../../../99.archive/[해당 구간 원본 경로]"
timestamp: YYYY-MM-DD
---

# 이 폴더는

[이 구간의 성격을 2~4문단. 반드시 다음 중 최소 하나를 포함한다]
- 분량이 어디에 쏠려 있는지
- 카드들의 성격이 서로 다르면 어떻게 다른지
- 이 폴더를 여는 실제 용도(개념 인용용인지, 코드 복사용인지)

# 카드

| 카드 | 핵심 | elements |
|---|---|---|
| [C-XX-01 제목](C-XX-01_제목.md) | [그 카드에서 가장 값나가는 것] | N |
| [C-XX-02 제목](C-XX-02_제목.md) | [설명이 아니라 내용물] | N |

# 이 폴더 밖

- [앞 폴더와의 전제 관계 — 무엇을 먼저 읽어야 하는지]
- [뒤 폴더로 이어지는 것 — 어떤 요소가 어디서 전개되는지]
- ⚠️ [흩어짐·불일치·빈자리가 있으면 여기]
```

### 산출물 3: 루트 인덱스 (책 최상위 `index.md`)

```markdown
---
type: index
title: 책 제목
description: 이 책의 주장 한 줄
resource: "../../99.archive/[책 원본 폴더]/"
timestamp: YYYY-MM-DD
---

원문 출처: [URL] · [총 용량] / [파일 수] / 카드 N장 [· 결손이 있으면 표시]

# 이 책은

[이 책의 중심 주장 1문단]
[무엇에 기대고 있는지 — 원전·출처·저자 고유 주장이 어디에 몰려 있는지 1문단]
[편집상의 특징, 다른 책과의 관계, 미집필 구간 1문단]

# 지도

```
책_폴더명/
├── 00_섹션/     [한 줄 성격]        카드 N   (NNKB)
├── 01_섹션/     [한 줄 성격]        카드 N   (NNKB)
└── 02_섹션/     [한 줄 성격]        카드 N   (NNKB)   ← [특이점이 있으면 화살표로]

원문: ../../99.archive/[경로]/
[폴더 구조를 그렇게 나눈 근거 / 미집필 구간]
```

# 전체 카드

## NN_섹션명
- [C-NN-01 제목](NN_섹션명/C-NN-01_제목.md) — [내용물. 값나가는 것은 굵게]
- [C-NN-02 제목](NN_섹션명/C-NN-02_제목.md) — [내용물]

# 가로축 — 장을 관통하는 것

한 카드만 읽고 끝내면 놓치는 것들.

1. **[줄기 이름]**
   [C-XX-XX](경로) EN → [C-YY-YY](경로) EN → [C-ZZ-ZZ](경로) EN
   → [이 줄기가 왜 중요한지, 어느 카드를 인용해야 하는지 판단]

[최소 4개, 권장 6~8개. 이 절이 국소적 조회를 막는 장치다.]

# ⚠️ 결손 현황

[원문 유실·미수집이 있을 때만 작성. 복원 우선순위를 번호로 매기고, 미수집 목록은 표로.]

# 어디로 갈지

| 필요한 것 | 가는 곳 |
|---|---|
| [실무자가 실제로 가질 목적] | [카드 링크] |
```

## 5. 작업 순서

- [ ] **Phase 1 — 구조 설계**
  - [ ] 아카이브 원문의 파일 목록과 **각 파일 크기**를 뽑았는가 (`ls -la`)
  - [ ] 책이 스스로 선언한 구성(목차 파일)이 있는가? 있으면 그것을 폴더 구조로 삼는다
  - [ ] 원문 파일 → `C-XX-XX` 매핑 테이블을 만들었는가
  - [ ] 각 파일 크기에 따라 **목표 elements 개수**를 미리 배정했는가 (§3)
- [ ] **Phase 2 — 카드 추출**
  - [ ] 원문을 **끝까지 읽었는가** (헤딩만 보고 쓰지 않았는가)
  - [ ] 표·코드블록·명명된 원칙 세트를 **빠짐없이** element로 올렸는가
  - [ ] 목표 개수에 도달했는가. 미달이면 원문을 다시 읽는다
  - [ ] `anchor`가 원문에 실재하는 헤딩인가
  - [ ] 원문에 유실된 표가 있으면 `⚠️표 유실`로 표시했는가
- [ ] **Phase 3 — 로컬 인덱스**
  - [ ] 모든 하위 폴더에 `index.md`가 있는가
  - [ ] 프론트매터 5필드인가
  - [ ] 카드 표의 `elements` 숫자가 **실제 카드의 행 수와 일치**하는가
  - [ ] "이 폴더는"에 나열이 아니라 **판단**이 들어갔는가
- [ ] **Phase 4 — 루트 인덱스**
  - [ ] 지도의 카드 수·용량이 실제와 맞는가
  - [ ] 가로축이 4개 이상인가, 각 줄기가 **실제 카드 링크로 추적 가능**한가
  - [ ] 결손이 있으면 우선순위를 매겼는가
- [ ] **Phase 5 — 검증 (§6 실행. 생략 금지)**
  - [ ] 깨진 링크 0개
  - [ ] 프론트매터 필드 누락 0개
  - [ ] elements 평균이 §3 기준을 만족하는가

## 6. 검증 스크립트

작업 종료 전 반드시 실행한다. 하나라도 걸리면 미완성이다.

```bash
cd "workbench/96.data_pipeline" && python - <<'EOF'
import os,re,urllib.parse
for book in sorted(d for d in os.listdir('.') if os.path.isdir(d)):
    bad=[];fm=[];ec=[];n=0;tot=0
    for dp,_,fns in os.walk(book):
        for fn in sorted(fns):
            if not fn.endswith('.md'): continue
            p=os.path.join(dp,fn); txt=open(p,encoding='utf-8').read()
            # 링크 검사
            for m in re.finditer(r'\]\(([^)]+)\)',txt):
                t=m.group(1).strip()
                if t.startswith('http'): continue
                t=urllib.parse.unquote(t.split('#')[0])
                if not os.path.exists(os.path.normpath(os.path.join(dp,t))): bad.append((p,t))
            # 프론트매터 5필드 검사
            head=txt.split('---')[1] if txt.startswith('---') else ''
            need=['type','title','description','resource','timestamp']
            miss=[k for k in need if not re.search(rf'^{k}:',head,re.M)]
            if miss: fm.append((p,miss))
            # elements 밀도
            if fn.startswith('C-') and '# elements' in txt:
                rows=[l for l in txt.split('# elements')[1].split('# 밖으로')[0].strip().split('\n') if l.strip().startswith('|')][2:]
                n+=1; tot+=len(rows)
                if len(rows)<3: ec.append((p,len(rows)))
    print(f"### {book}  카드 {n} · elements 평균 {tot/n if n else 0:.1f}")
    for p,t in bad: print("  [링크]",p,"->",t)
    for p,m in fm: print("  [FM]",p,"누락:",m)
    for p,c in ec: print("  [밀도]",p,f"elements {c}개")
EOF
```

## 7. 모범 사례

이 스킬의 `examples/` 폴더에 완벽한 루트 인덱스의 모범 답안 2개가 첨부되어 있다.
새 파이프라인을 작성하거나 인덱스를 생성하기 전에 **반드시 아래 예시들을 직접 열어보고** 그 밀도와 구조를 똑같이 구현해야 한다.

| 볼 것 | 파일 |
|---|---|
| 루트 인덱스 (마스터 정본) | `examples/example_index_harness.md` |
| 루트 인덱스 (오케스트레이션 적용본) | `examples/example_index_vibecoding.md` |
| 로컬 인덱스 (성격이 다른 카드 묶기) | `examples/example_local_index_harness.md` |
| 로컬 인덱스 (오케스트레이션 적용본) | `examples/example_local_index_vibecoding.md` |
| 지식 카드 (고밀도: elements 17) | `examples/example_card_high_density.md` |
| 지식 카드 (표준 밀도: elements 6) | `examples/example_card_standard.md` |

**흉내만 낸 결과물의 징후** — 아래에 하나라도 해당하면 다시 만든다.

- 인덱스 프론트매터가 `type`·`title` 2필드뿐
- `# [이 폴더는]` 처럼 제목에 대괄호가 붙어 있음
- 카드 리스트가 표가 아니라 단순 불릿이고 elements 수가 없음
- 루트 인덱스에 `지도`·`가로축`이 없고 라우팅 질문만 있음
- elements가 카드마다 2개씩 균일함 (원문을 끝까지 읽지 않은 신호)
- `# 밖으로` 링크가 실재하지 않는 파일을 가리킴
