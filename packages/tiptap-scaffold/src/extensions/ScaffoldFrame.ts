import { Node, mergeAttributes } from '@tiptap/core';

/**
 * ScaffoldFrame — 블록 콘텐츠를 페이지 위 실측 위치에 고정하는 컨테이너.
 *
 * 표 전용으로 쓴다. Tiptap 의 Table 은 `resizable: false` 여도 자체 NodeView
 * (`TableView`)로 DOM 을 다시 그리기 때문에, 표 노드에 직접 준 절대 배치 스타일이
 * 무시되고 `.tableWrapper` 로 감싸진다. 그래서 표와 싸우는 대신 **바깥에 좌표를
 * 가진 상자를 두고** 표가 그 안을 100% 채우게 한다.
 *
 * `ScaffoldBlock` 은 `inline*` 만 담아 표를 넣을 수 없으므로 이 노드가 따로 필요하다.
 */
const num = (name: string, fallback: number) => ({
  default: fallback,
  parseHTML: (element: HTMLElement) => {
    const raw = element.getAttribute(name);
    if (raw === null) return fallback;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  },
  renderHTML: () => ({}),
});

export const ScaffoldFrame = Node.create({
  name: 'scaffoldFrame',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      x: num('data-x', 0),
      y: num('data-y', 0),
      w: num('data-w', 0),
      h: num('data-h', 0),
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
    return [{ tag: 'div[data-type="scaffold-frame"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { x, y, w, h } = node.attrs;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'scaffold-frame',
        'data-x': String(x),
        'data-y': String(y),
        'data-w': String(w),
        'data-h': String(h),
        class: 'scaffold-frame',
        style:
          `position:absolute;left:${x}px;top:${y}px;` +
          `width:${w}px;height:${h}px;`,
      }),
      0,
    ];
  },
});
