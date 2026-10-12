/**
 * @file mountOutline.tsx
 * @description 노트 안의 한 자리에 아웃라인 화면을 올리는 공용 절차 (읽기 모드 임베드와 코드 블록이 함께 쓴다)
 */

import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { type MarkdownPostProcessorContext, MarkdownRenderChild } from 'obsidian';

/** 아웃라인 화면을 올리고, 그 자리가 노트에서 사라질 때(노트를 닫거나 다시 그릴 때) 함께 내린다. */
export function mountOutline(el: HTMLElement, ctx: MarkdownPostProcessorContext, node: ReactNode) {
  const root = createRoot(el);
  root.render(node);

  const child = new MarkdownRenderChild(el);
  child.register(() => root.unmount());
  ctx.addChild(child);
}
