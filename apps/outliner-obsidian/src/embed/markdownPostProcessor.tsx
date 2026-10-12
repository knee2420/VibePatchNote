/**
 * @file markdownPostProcessor.ts
 * @description 마크다운 문서 내 ![[...]] 임베드 및 ```vibe-outline``` 코드 블록 렌더링 등록기
 */

import { createRoot } from 'react-dom/client';
import { type App, type MarkdownPostProcessorContext, TFile } from 'obsidian';
import type { ViewMode } from '@vibe/outliner-core';
import { OutlineMarkdownEmbed } from './OutlineMarkdownEmbed';

/**
 * 1. ![[파일.outline]] 또는 ![[파일.outline#nodeId]] 인라인 마크다운 임베드 인터셉터
 */
export function registerOutlineMarkdownEmbedProcessor(app: App, registerProcessor: (proc: (el: HTMLElement, ctx: MarkdownPostProcessorContext) => void) => void) {
  registerProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    // 옵시디언 마크다운이 생성한 .internal-embed 찾기
    const embeds = el.querySelectorAll<HTMLElement>('.internal-embed');
    embeds.forEach((embedEl) => {
      const src = embedEl.getAttribute('src');
      if (!src) return;

      // 파일 경로와 서브 앵커(#nodeId) 분리
      let decoded = src;
      try {
        decoded = decodeURIComponent(src);
      } catch {}
      const [linkpath, anchor] = decoded.split('#');
      const cleanPath = linkpath?.trim();
      if (!cleanPath) return;

      // 옵시디언 공식 Resolver 및 폴백을 통해 TFile 조회 (경로 이동 무관)
      let targetFile = app.metadataCache.getFirstLinkpathDest(cleanPath, ctx.sourcePath);
      if (!targetFile && !cleanPath.endsWith('.outline')) {
        targetFile = app.metadataCache.getFirstLinkpathDest(`${cleanPath}.outline`, ctx.sourcePath);
      }
      if (!targetFile) {
        targetFile = app.metadataCache.getFirstLinkpathDest(cleanPath, '');
      }
      if (!targetFile) {
        const allFiles = app.vault.getFiles();
        const baseOrName = cleanPath.split('/').pop() ?? cleanPath;
        targetFile =
          allFiles.find(
            (f) =>
              f.extension === 'outline' &&
              (f.name === baseOrName ||
                f.basename === baseOrName ||
                f.path.endsWith(cleanPath) ||
                f.path.endsWith(`${cleanPath}.outline`))
          ) ?? null;
      }

      if (!(targetFile instanceof TFile) || targetFile.extension !== 'outline') {
        return;
      }

      // 기존 회색 링크 UI 비우고 아웃라인 임베드 렌더링
      embedEl.empty();
      embedEl.addClass('vibe-outliner-embed-container');
      embedEl.removeClass('mod-generic');
      const root = createRoot(embedEl);
      root.render(
        <OutlineMarkdownEmbed
          app={app}
          file={targetFile}
          zoomNodeId={anchor?.trim()}
          maxHeight="500px"
        />
      );
    });
  });
}

interface CodeBlockConfig {
  file?: string;
  view?: ViewMode;
  zoom?: string;
  height?: string;
}

function parseCodeBlockYaml(source: string): CodeBlockConfig {
  const config: CodeBlockConfig = {};
  const lines = source.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key === 'file') config.file = val;
    else if (key === 'view' && (val === 'board' || val === 'bullets')) config.view = val;
    else if (key === 'zoom') config.zoom = val;
    else if (key === 'height') config.height = val;
  }
  return config;
}

/**
 * 2. ```vibe-outline``` 코드 블록 프로세서 등록
 */
export function registerOutlineCodeBlockProcessor(
  app: App,
  registerCodeBlock: (lang: string, handler: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void) => void
) {
  registerCodeBlock('vibe-outline', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const config = parseCodeBlockYaml(source);
    if (!config.file) {
      el.createDiv({
        cls: 'text-xs text-amber-400 p-2 border border-amber-900/50 rounded',
        text: 'vibe-outline: "file" 속성을 지정해주세요. 예: file: "내문서.outline"',
      });
      return;
    }

    const targetFile = app.metadataCache.getFirstLinkpathDest(config.file, ctx.sourcePath);
    if (!(targetFile instanceof TFile)) {
      el.createDiv({
        cls: 'text-xs text-rose-400 p-2 border border-rose-900/50 rounded',
        text: `vibe-outline: 파일을 찾을 수 없습니다: ${config.file}`,
      });
      return;
    }

    el.empty();
    const root = createRoot(el);
    root.render(
      <OutlineMarkdownEmbed
        app={app}
        file={targetFile}
        zoomNodeId={config.zoom}
        viewMode={config.view}
        maxHeight={config.height ?? '500px'}
      />
    );
  });
}
