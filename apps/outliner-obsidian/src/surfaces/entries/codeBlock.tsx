/**
 * @file codeBlock.tsx
 * @description ```vibe-outline``` 코드 블록을 아웃라인 화면으로 그리는 등록기
 */

import { type App, type MarkdownPostProcessorContext, TFile } from 'obsidian';
import type { ViewMode } from '@vibe/outliner/core';
import { OutlineInline } from '../inline/OutlineInline';
import { mountOutline } from './mountOutline';

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
 * ```vibe-outline``` 코드 블록 프로세서 등록
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
    mountOutline(
      el,
      ctx,
      <OutlineInline
        app={app}
        file={targetFile}
        zoomNodeId={config.zoom}
        viewMode={config.view}
        maxHeight={config.height ?? '500px'}
      />
    );
  });
}
