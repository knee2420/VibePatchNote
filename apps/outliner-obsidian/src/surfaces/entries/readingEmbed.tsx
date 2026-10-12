/**
 * @file readingEmbed.tsx
 * @description 읽기 모드 노트의 ![[...]] 임베드를 아웃라인 화면으로 바꾸는 등록기
 */

import { type App, type MarkdownPostProcessorContext, TFile } from 'obsidian';
import { OutlineInline } from '../inline/OutlineInline';
import { EMBED_MOUNTED_FLAG } from './LivePreviewEmbedWatcher';
import { mountOutline } from './mountOutline';

/**
 * ![[파일.outline]] 또는 ![[파일.outline#nodeId]] 인라인 마크다운 임베드 인터셉터
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
      // 화면 전체를 살피는 감시자(LivePreviewEmbedWatcher)가 같은 자리를 또 그리지 않도록 표시해 둔다.
      if (embedEl.dataset[EMBED_MOUNTED_FLAG] === 'true') return;
      embedEl.dataset[EMBED_MOUNTED_FLAG] = 'true';
      embedEl.empty();
      embedEl.addClass('vibe-outliner-embed-container');
      embedEl.removeClass('mod-generic');
      mountOutline(
        embedEl,
        ctx,
        <OutlineInline
          app={app}
          file={targetFile}
          zoomNodeId={anchor?.trim()}
          maxHeight="500px"
        />
      );
    });
  });
}
