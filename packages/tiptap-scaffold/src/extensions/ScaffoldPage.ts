import { Node, mergeAttributes } from '@tiptap/core';

/**
 * ScaffoldPage — 원본 문서 한 페이지에 대응하는 고정 크기 캔버스.
 *
 * 원본 PDF 포인트와 1:1 px 로 크기를 잡고 `position: relative` 를 준다.
 * 자식 `ScaffoldBlock` 과 표는 이 상자를 기준으로 절대 배치된다.
 *
 * **이 노드가 스키마에 없으면 Tiptap 이 파싱 단계에서 래퍼 div 를 통째로 버린다.**
 * 그러면 모든 자식이 문서 순서대로 흘러내려 레이아웃이 무너진다.
 */
export interface ScaffoldPageOptions {
  HTMLAttributes: Record<string, unknown>;
}

const numAttr = (name: string, fallback: number) => ({
  default: fallback,
  parseHTML: (element: HTMLElement) => {
    const raw = element.getAttribute(name);
    if (raw === null) return fallback;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  },
  renderHTML: () => ({}), // style 로만 반영하고 개별 속성은 renderHTML 에서 직접 쓴다
});

export const ScaffoldPage = Node.create<ScaffoldPageOptions>({
  name: 'scaffoldPage',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      width: numAttr('data-w', 595),
      height: numAttr('data-h', 842),
      pageNumber: numAttr('data-page', 1),
    };
  },

  /** tiptap-markdown 직렬화. 컨테이너는 자식만 흘려보낸다. */
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.renderContent(node);
        },
        parse: {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="scaffold-page"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { width, height, pageNumber } = node.attrs;
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'scaffold-page',
        'data-w': String(width),
        'data-h': String(height),
        'data-page': String(pageNumber),
        class: 'scaffold-page',
        style: `position:relative;width:${width}px;height:${height}px;`,
      }),
      0,
    ];
  },
});
