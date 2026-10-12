# @vibe/outliner-obsidian

`.outline` 파일을 옵시디언에서 불릿 아웃라인과 보드로 여는 플러그인입니다.

옵시디언에서는 파일 그 자체가 관리 단위입니다. 만들기·이름 바꾸기·삭제·이동은 옵시디언의 파일 탐색기가 하고,
이 플러그인은 `.outline` 파일을 여는 화면과 새 파일을 만드는 진입점만 더합니다.

## 구성

```text
packages/outliner-core      편집 규칙
packages/outliner-dto       파일 규격 (.outline 의 내용은 독립 앱의 .json 과 같은 JSON)
packages/outliner-editor    편집 화면 (독립 앱과 함께 씀)
apps/outliner-obsidian      이 플러그인: 파일 화면, 명령, 옵시디언 연결
```

- `src/main.ts` 확장자 등록, 명령, 폴더 메뉴, `obsidian://vibe-outline` 주소
- `src/OutlineFileView.tsx` 파일 하나를 여는 화면. 탭마다 내용과 편집 상태를 따로 가짐
- `src/outlineDocument.ts` 파일 글자 ↔ 스캐폴드
- `src/styles.css` Tailwind 묶음. 빌드할 때 모든 선택자가 `.vibe-outliner` 안으로 가둬짐

## 빌드와 설치

```bash
pnpm --filter @vibe/outliner-obsidian build
```

`dist/` 에 `main.js`, `manifest.json`, `styles.css` 가 만들어집니다. 보관함에 넣으려면:

```bash
pnpm --filter @vibe/outliner-obsidian install:vault -- "C:/path/to/vault"
```

보관함의 `.obsidian/plugins/vibe-outliner/` 에 세 파일이 복사됩니다.
옵시디언 설정의 커뮤니티 플러그인에서 Vibe Outliner 를 켜고, 다시 빌드한 뒤에는 플러그인을 껐다 켭니다.

## 쓰는 법

- 새 파일: 명령 "새 아웃라인 만들기", 왼쪽 띠의 버튼, 폴더 우클릭의 "새 아웃라인"
- 제목: 화면의 제목 칸을 고치면 파일 이름이 바뀝니다. (파일 이름이 곧 제목)
- 보기 전환: 탭 머리의 버튼 또는 명령 "불릿 / 보드 전환"
- 불릿 주소: 불릿 메뉴의 "내부 링크 복사" → `obsidian://vibe-outline?vault=…&file=…&node=…`
- Markdown: 명령 "Markdown 노트로 내보내기" 는 같은 폴더에 `.md` 노트를 만듭니다.

## 알아 둘 것

- 데스크톱 전용입니다.
- `.outline` 안의 글자는 옵시디언의 검색·백링크·그래프에 잡히지 않습니다.
- 읽을 수 없는 파일(깨진 JSON, 다른 규격, 모르는 버전)은 안내만 보여주고 내용을 바꾸지 않습니다.
