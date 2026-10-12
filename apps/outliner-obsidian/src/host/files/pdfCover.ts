/**
 * @file pdfCover.ts
 * @description PDF 의 첫 쪽을 표지 그림으로 그린다 (옵시디언이 가진 PDF 읽기 도구 사용)
 *
 * 그리는 데 품이 들어서 한 번 그린 것은 기억해 둔다. 파일이 바뀌면(수정 시각이 달라지면) 다시 그린다.
 */

import { type App, type TFile, loadPdfJs } from 'obsidian';

/** 기억해 두는 표지의 수. 넘으면 처음부터 다시 모은다. */
const MAX_COVERS = 200;
/** 선명도. 화면 배율을 따르되 지나치게 큰 그림은 만들지 않는다. */
const MAX_PIXEL_RATIO = 2;

const covers = new Map<string, Promise<string | null>>();

async function render(app: App, file: TFile, width: number): Promise<string | null> {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await app.vault.readBinary(file) }).promise;
  try {
    const page = await pdf.getPage(1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const scale = (width * pixelRatio) / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) return null;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  } finally {
    void pdf.destroy();
  }
}

/** 표지 그림의 주소(data URL). 그리지 못하면 null */
export function renderPdfCover(app: App, file: TFile, width: number): Promise<string | null> {
  const key = `${file.path}|${file.stat.mtime}|${width}`;
  let cover = covers.get(key);
  if (!cover) {
    if (covers.size >= MAX_COVERS) covers.clear();
    cover = render(app, file, width).catch((err) => {
      console.error('[VibeOutliner] PDF 표지 그리기 실패:', err);
      return null;
    });
    covers.set(key, cover);
  }
  return cover;
}
