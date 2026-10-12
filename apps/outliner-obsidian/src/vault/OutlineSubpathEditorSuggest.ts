/**
 * @file OutlineSubpathEditorSuggest.ts
 * @description 옵시디언 마크다운 에디터에서 [[아웃라인# 또는 ![[아웃라인# 입력 시
 * 해당 .outline 파일의 불릿 텍스트를 검색하여 특정 불릿 서브 앵커(#nodeId)로 자동완성하는 제안기
 */

import {
  type App,
  type Editor,
  type EditorPosition,
  type EditorSuggestContext,
  type EditorSuggestTriggerInfo,
  EditorSuggest,
  TFile,
} from 'obsidian';
import type { OutlineNode } from '@vibe/outliner-core';
import { parseProjectFile } from '@vibe/outliner-dto';

export interface OutlineBulletSuggestion {
  nodeId: string;
  text: string;
  depth: number;
  fileName: string;
}

const SUBPATH_PATTERN = /(?:!\[\[|\[\[)([^\]#|]+)#([^\]]*)$/;

export class OutlineSubpathEditorSuggest extends EditorSuggest<OutlineBulletSuggestion> {
  constructor(app: App) {
    super(app);
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile | null
  ): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line);
    const sub = line.slice(0, cursor.ch);

    const match = sub.match(SUBPATH_PATTERN);
    if (!match) return null;

    const linkText = match[1]?.trim();
    if (!linkText) return null;

    // 대상 파일이 .outline 파일인지 확인
    const targetFile = this.resolveOutlineFile(linkText, file?.path);
    if (!targetFile) return null;

    return {
      start: { line: cursor.line, ch: cursor.ch - match[2].length },
      end: cursor,
      query: match[2],
    };
  }

  async getSuggestions(context: EditorSuggestContext): Promise<OutlineBulletSuggestion[]> {
    const line = context.editor.getLine(context.start.line);
    const sub = line.slice(0, context.start.ch);

    const match = sub.match(SUBPATH_PATTERN);
    if (!match) return [];

    const linkText = match[1]?.trim();
    if (!linkText) return [];

    const targetFile = this.resolveOutlineFile(linkText, context.file?.path);
    if (!targetFile) return [];

    try {
      const content = await this.app.vault.read(targetFile);
      const parsed = parseProjectFile(content);
      if (!parsed.success) return [];

      const list: OutlineBulletSuggestion[] = [];
      const query = context.query.toLowerCase().trim();

      const collect = (nodes: OutlineNode[], depth: number) => {
        for (const node of nodes) {
          const rawText = node.text?.trim() || '(내용 없는 불릿)';
          if (!query || rawText.toLowerCase().includes(query)) {
            list.push({
              nodeId: node.id,
              text: rawText,
              depth,
              fileName: targetFile.basename,
            });
          }
          if (node.children && node.children.length > 0) {
            collect(node.children, depth + 1);
          }
        }
      };

      collect(parsed.project.rootNodes, 0);
      return list.slice(0, 30);
    } catch (err) {
      console.error('아웃라인 불릿 제안 목록 읽기 실패:', err);
      return [];
    }
  }

  renderSuggestion(suggestion: OutlineBulletSuggestion, el: HTMLElement): void {
    el.addClass('mod-complex');
    const content = el.createDiv({ cls: 'suggestion-content' });
    const title = content.createDiv({ cls: 'suggestion-title flex items-center' });

    if (suggestion.depth > 0) {
      title.createSpan({
        text: '· '.repeat(suggestion.depth),
        cls: 'opacity-40 mr-1.5 select-none font-mono text-xs',
      });
    }

    title.createSpan({ text: suggestion.text });

    const note = content.createDiv({ cls: 'suggestion-note text-xs text-muted flex items-center gap-1.5' });
    note.createSpan({ text: suggestion.fileName, cls: 'opacity-70' });
    note.createSpan({ text: `#${suggestion.nodeId}`, cls: 'font-mono opacity-50' });
  }

  selectSuggestion(suggestion: OutlineBulletSuggestion, _evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) return;
    const { editor, start, end } = this.context;
    const line = editor.getLine(start.line);
    const afterEnd = line.slice(end.ch);

    // 뒤에 이미 ]] 가 닫혀있는지 확인
    const hasClosingBracket = afterEnd.startsWith(']]');
    const replacement = hasClosingBracket ? suggestion.nodeId : `${suggestion.nodeId}]]`;

    editor.replaceRange(replacement, start, end);

    const nextCh = start.ch + suggestion.nodeId.length + (hasClosingBracket ? 0 : 2);
    editor.setCursor({ line: start.line, ch: nextCh });
  }

  private resolveOutlineFile(linkText: string, sourcePath?: string): TFile | null {
    // 1. 메타데이터 캐시 링크 경로로 먼저 해석
    const dest = this.app.metadataCache.getFirstLinkpathDest(linkText, sourcePath ?? '');
    if (dest && dest.extension === 'outline') return dest;

    // 2. 확장자가 생략된 경우 볼트에서 basename 매칭
    const cleanName = linkText.replace(/\.outline$/, '').toLowerCase();
    const files = this.app.vault.getFiles();
    return (
      files.find(
        (f) => f.extension === 'outline' && f.basename.toLowerCase() === cleanName
      ) ?? null
    );
  }
}
