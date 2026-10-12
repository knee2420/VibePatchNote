/**
 * 빌드 결과(main.js, manifest.json, styles.css)를 보관함의 플러그인 폴더에 복사한다.
 * 보관함 위치는 사용자가 정한다: 인자로 주거나 OUTLINER_OBSIDIAN_VAULT 환경 변수로 준다.
 *   pnpm --filter @vibe/outliner-obsidian install:vault -- "C:/path/to/vault"
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vault = process.argv[2] ?? process.env.OUTLINER_OBSIDIAN_VAULT;
if (!vault) {
  console.error('보관함 폴더를 인자나 OUTLINER_OBSIDIAN_VAULT 로 지정하세요.');
  process.exit(1);
}
if (!existsSync(join(vault, '.obsidian'))) {
  console.error(`옵시디언 보관함이 아닙니다 (.obsidian 폴더 없음): ${vault}`);
  process.exit(1);
}

const { id } = JSON.parse(readFileSync(join(appDir, 'manifest.json'), 'utf8'));
const target = join(vault, '.obsidian', 'plugins', id);
mkdirSync(target, { recursive: true });
for (const name of ['main.js', 'manifest.json', 'styles.css']) {
  copyFileSync(join(appDir, 'dist', name), join(target, name));
}
console.log(`설치했습니다: ${target}`);
