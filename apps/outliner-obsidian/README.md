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

```text
src/
├── main.ts        등록만 한다
├── styles.css     Tailwind 묶음. 빌드할 때 모든 선택자가 .vibe-outliner 안으로 가둬짐
├── commands/      옵시디언에만 있는 진입점 (명령, 리본, 폴더 메뉴, obsidian://vibe-outline 주소)
├── surfaces/      아웃라인이 보이는 자리
│   ├── tab/       .outline 을 탭으로 열었을 때. 탭마다 내용과 편집 상태를 따로 가짐
│   ├── inline/    노트·캔버스 안에 들어가는 화면 (공용)
│   └── entries/   inline 화면을 올리는 방식 (읽기 모드 임베드, 실시간 미리보기, 코드 블록, 캔버스 카드)
├── host/          편집 화면이 옵시디언에 부탁하는 일. 탭 화면과 inline 화면이 함께 씀
│   ├── dialogs/   확인 창
│   └── links/     불릿 안의 [[ 자동완성
├── document/      파일 글자 ↔ 스캐폴드, 파일 만들기·이름 바꾸기, 경로·주소 규칙
└── vault/         아웃라인 밖의 옵시디언에 아웃라인을 알리는 일 (그래프·백링크 색인, 노트에서 [[아웃라인# 자동완성)
```

의존은 한 방향으로만 흐른다: `main → commands · surfaces → host → document`. `vault` 는 `document` 쪽만 본다.
(예외 하나: 탭 화면이 파일을 읽을 때 색인을 맞추려고 `vault` 의 색인기를 부른다)

파일 이름은 그 파일이 내보내는 대표 이름을 따른다. 클래스·컴포넌트는 대문자로(`OutlineFileView.tsx`),
함수·훅 묶음은 소문자로(`outlineFiles.ts`) 시작한다. 폴더는 전부 소문자다.

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

설치한 묶음이 최신 빌드와 같은지, 시험용 노트가 갖춰졌는지는 아래로 확인합니다.
(파일이 제자리에 있는지만 봅니다. 화면 동작은 옵시디언에서 직접 확인해야 합니다)

```bash
node apps/outliner-obsidian/scripts/verify-checklist.mjs "C:/path/to/vault"
```

## 쓰는 법

- 새 파일: 명령 "새 아웃라인 만들기", 왼쪽 띠의 버튼, 폴더 우클릭의 "새 아웃라인"
- 제목: 화면의 제목 칸을 고치면 파일 이름이 바뀝니다. (파일 이름이 곧 제목)
- 보기 전환: 탭 머리의 버튼 또는 명령 "불릿 / 보드 전환"
- 불릿 주소: 불릿 메뉴의 "내부 링크 복사" → `obsidian://vibe-outline?vault=…&file=…&node=…`
- Markdown: 명령 "Markdown 노트로 내보내기" 는 같은 폴더에 `.md` 노트를 만듭니다.
- 링크와 태그: 불릿에 `[[노트 이름]]` 이나 `#태그` 를 쓰면, 그 불릿을 편집하지 않을 때 칩으로 보입니다.
  링크를 누르면 그 문서가 열리고, 올려 두면 미리보기가 뜨고, 태그를 누르면 검색이 열립니다.
  `[[` 를 치면 파일 후보가 뜹니다.
- 노트에 넣기: 노트에 `![[파일.outline]]` 을 쓰면 그 자리에서 바로 편집할 수 있습니다.
  `![[파일.outline#불릿 id]]` 는 그 불릿 아래만 보여줍니다. 코드 블록으로도 넣을 수 있습니다.

  ````text
  ```vibe-outline
  file: 파일.outline
  view: board
  zoom: 불릿 id
  height: 400px
  ```
  ````

- 캔버스: `.outline` 파일을 캔버스에 놓으면 카드 안에서 바로 편집할 수 있습니다.

## 알아 둘 것

- 데스크톱 전용입니다.
- 불릿 안의 `[[링크]]` 와 `#태그` 는 그래프와 백링크에 잡힙니다. 그 밖의 글자는 옵시디언 검색에 잡히지 않습니다.
- 그래프·백링크 색인, 캔버스 카드, 실시간 미리보기 임베드, 태그 검색은 옵시디언의 공개 API 밖의 기능에 기대고 있어,
  옵시디언이 바뀌면 동작하지 않을 수 있습니다.
- 읽을 수 없는 파일(깨진 JSON, 다른 규격, 모르는 버전)은 안내만 보여주고 내용을 바꾸지 않습니다.
