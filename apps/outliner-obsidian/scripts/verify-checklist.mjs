/**
 * @file verify-checklist.mjs
 * @description 옵시디언 연동 기능 전체 테스트 체크리스트 검증기
 *
 * 설치한 묶음이 최신 빌드와 같은지, 묶음에 기능이 실렸는지, 시험용 노트가 갖춰졌는지를 본다.
 * 화면 동작까지 확인하지는 않는다.
 * 보관함 위치는 사용자가 정한다: 인자로 주거나 OUTLINER_OBSIDIAN_VAULT 환경 변수로 준다.
 *   node apps/outliner-obsidian/scripts/verify-checklist.mjs "C:/path/to/vault"
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VAULT_PATH = process.argv[2] ?? process.env.OUTLINER_OBSIDIAN_VAULT;
if (!VAULT_PATH) {
  console.error('보관함 폴더를 인자나 OUTLINER_OBSIDIAN_VAULT 로 지정하세요.');
  process.exit(1);
}
if (!existsSync(join(VAULT_PATH, '.obsidian'))) {
  console.error(`옵시디언 보관함이 아닙니다 (.obsidian 폴더 없음): ${VAULT_PATH}`);
  process.exit(1);
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

console.log('====================================================');
console.log('🚀 옵시디언 네이티브 파츠 연동 전체 테스트 체크리스트');
console.log('====================================================\n');

// 1. 빌드 및 배포 산출물 동기화 검증
console.log('1. [배포 및 번들 무결성 검증]');
const distMain = join(APP_PATH, 'dist/main.js');
const vaultPluginDir = join(VAULT_PATH, '.obsidian/plugins/vibe-outliner');
const vaultMain = join(vaultPluginDir, 'main.js');

assert(existsSync(distMain), '빌드 결과물 dist/main.js 가 존재해야 함');
assert(existsSync(vaultMain), '볼트 플러그인 폴더에 main.js 가 설치되어 있어야 함');

const distMainContent = readFileSync(distMain, 'utf8');
const vaultMainContent = readFileSync(vaultMain, 'utf8');
assert(distMainContent === vaultMainContent, '볼트에 설치된 main.js가 최신 빌드와 바이트 단위로 100% 일치해야 함');

// 2. 신규 API 및 인터셉터가 번들에 포함되었는지 정적 검증
console.log('\n2. [플러그인 핵심 아키텍처 번들 탑재 검증]');
assert(vaultMainContent.includes('registerMarkdownPostProcessor'), '마크다운 인라인 임베드 등록기가 main.js에 포함되어 있어야 함');
assert(vaultMainContent.includes('registerMarkdownCodeBlockProcessor'), '코드 블록(vibe-outline) 프로세서가 main.js에 포함되어 있어야 함');
assert(vaultMainContent.includes('LivePreviewEmbedWatcher') || vaultMainContent.includes('livePreviewWatcher'), 'Live Preview & 호버 팝오버 임베드 감시자가 main.js에 포함되어 있어야 함');
assert(vaultMainContent.includes('vibe-outliner-canvas-node-content'), '캔버스(Canvas) 파일 노드 인터셉터가 main.js에 포함되어 있어야 함');
assert(vaultMainContent.includes('getFirstLinkpathDest'), '옵시디언 공식 Resolver API가 main.js에 포함되어 있어야 함');
assert(vaultMainContent.includes('syncOutlineMetadata'), '메타데이터 캐시 & 그래프 뷰 색인기가 main.js에 포함되어 있어야 함');
assert(vaultMainContent.includes('subpath'), '서브 앵커(subpath) 네비게이션 처리가 main.js에 포함되어 있어야 함');
assert(vaultMainContent.includes('openLink'), '호스트 openLink 바인딩이 main.js에 포함되어 있어야 함');

// 3. 메타데이터 색인기 정규식 및 추출 로직 단위 검증
console.log('\n3. [위키링크 및 태그 색인기 파서 검증]');
const outlineSample = readFileSync(join(VAULT_PATH, 'outline-test/04_지식그래프_백링크_연동.outline'), 'utf8');

const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const TAG_REGEX = /(?:^|\s)(#[a-zA-Z0-9_\uAC00-\uD7A3/-]+)/g;

const extractedLinks = [];
let match;
while ((match = WIKI_LINK_REGEX.exec(outlineSample)) !== null) {
  extractedLinks.push(match[1]);
}

const extractedTags = [];
while ((match = TAG_REGEX.exec(outlineSample)) !== null) {
  extractedTags.push(match[1]);
}

assert(extractedLinks.includes('01_마크다운_인라인_임베드_테스트'), '불릿 내 [[01_마크다운_인라인_임베드_테스트]] 링크가 추출되어야 함');
assert(extractedLinks.includes('02_코드블록_위젯_테스트'), '불릿 내 [[02_코드블록_위젯_테스트]] 링크가 추출되어야 함');
assert(extractedTags.includes('#옵시디언연동'), '#옵시디언연동 태그가 추출되어야 함');
assert(extractedTags.includes('#아웃라이너'), '#아웃라이너 태그가 추출되어야 함');
assert(extractedTags.includes('#일급시민'), '#일급시민 태그가 추출되어야 함');

// 4. 캔버스 연동 파일 검증
console.log('\n4. [캔버스(Canvas) 연동 파일 구조 검증]');
const canvasPath = join(VAULT_PATH, '실험실/experiments/테스트용.canvas');
assert(existsSync(canvasPath), '사용자의 테스트용.canvas 파일이 존재해야 함');
const canvasData = JSON.parse(readFileSync(canvasPath, 'utf8'));
const outlineNode = canvasData.nodes.find((n) => n.type === 'file' && n.file?.endsWith('.outline'));
assert(Boolean(outlineNode), '캔버스 안에 .outline 파일 노드가 포함되어 있어야 함');
assert(outlineNode.file === 'outline-test/실험 아웃라인.outline', '캔버스 파일 노드가 정확한 대상을 가리키고 있어야 함');

// 5. 마크다운 테스트 파일 세트 존재 검증
console.log('\n5. [테스트 마크다운 노트 세트 검증]');
assert(existsSync(join(VAULT_PATH, 'outline-test/01_마크다운_인라인_임베드_테스트.md')), '01_마크다운_인라인_임베드_테스트.md 생성 완료');
assert(existsSync(join(VAULT_PATH, 'outline-test/02_코드블록_위젯_테스트.md')), '02_코드블록_위젯_테스트.md 생성 완료');
assert(existsSync(join(VAULT_PATH, 'outline-test/03_호버_미리보기_및_링크_테스트.md')), '03_호버_미리보기_및_링크_테스트.md 생성 완료');
assert(existsSync(join(VAULT_PATH, 'outline-test/04_지식그래프_백링크_연동.outline')), '04_지식그래프_백링크_연동.outline 생성 완료');

console.log('\n====================================================');
console.log(`📊 테스트 결과: 총 ${passCount + failCount}개 항목 중 ${passCount}개 통과, ${failCount}개 실패`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}
