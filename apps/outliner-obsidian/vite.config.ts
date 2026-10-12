import { copyFileSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import postcss, { type AtRule, type Rule } from 'postcss';
import { type Plugin, defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 우리 화면의 뿌리와, 메뉴·대화상자를 붙이는 자리에 붙는 클래스 */
const SCOPE = '.vibe-outliner';

/**
 * 옵시디언은 플러그인의 CSS 를 앱 전체에 적용한다. Tailwind 의 초기화 규칙과 유틸리티가
 * 옵시디언 화면을 건드리지 않도록, 모든 선택자를 우리 영역(.vibe-outliner) 안으로 가둔다.
 */
function scopeSelector(selector: string): string {
  const trimmed = selector.trim();
  if (trimmed.startsWith(SCOPE)) return trimmed;
  // 문서 뿌리를 가리키던 선택자는 우리 영역의 뿌리를 가리키게 한다.
  if (/^(:root|:host|html|body)$/.test(trimmed)) return SCOPE;
  return `${SCOPE} ${trimmed}`;
}

function isInsideKeyframes(rule: Rule): boolean {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'atrule' && /keyframes$/.test((parent as AtRule).name)) return true;
    parent = parent.parent as typeof parent;
  }
  return false;
}

/** 빌드 결과를 옵시디언 플러그인 묶음(main.js, styles.css, manifest.json)으로 맞춘다. */
function obsidianBundle(): Plugin {
  const outDir = path.resolve(__dirname, 'dist');
  return {
    name: 'obsidian-bundle',
    closeBundle() {
      const scoped: string[] = [];
      for (const fileName of readdirSync(outDir)) {
        if (!fileName.endsWith('.css') || fileName === 'styles.css') continue;

        const root = postcss.parse(readFileSync(path.join(outDir, fileName), 'utf8'));
        root.walkRules((rule) => {
          if (isInsideKeyframes(rule)) return;
          rule.selectors = rule.selectors.map(scopeSelector);
        });
        scoped.push(root.toString());
        rmSync(path.join(outDir, fileName));
      }
      writeFileSync(path.join(outDir, 'styles.css'), scoped.join('\n'));
      copyFileSync(path.resolve(__dirname, 'manifest.json'), path.join(outDir, 'manifest.json'));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), obsidianBundle()],
  // 라이브러리 빌드는 이 값을 바꿔 주지 않는다. React 가 배포용으로 묶이도록 직접 정한다.
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      // 옵시디언이 실행 중에 제공하는 모듈은 묶지 않는다.
      external: ['obsidian', 'electron', /^@codemirror\//, /^@lezer\//],
      output: { exports: 'default' },
    },
  },
});
