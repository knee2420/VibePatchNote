import { Node, mergeAttributes } from '@tiptap/core';

/**
 * ScaffoldBlock — 원본에서 실측한 위치·크기를 가진 텍스트/이미지 블록.
 *
 * 표에 속하지 않는 모든 요소(제목, 꼬리말, 자유배치 문서의 각 줄, 로고 칸)를
 * `ScaffoldPage` 안에 절대 배치한다. 좌표는 전부 엔진 실측값이며 이 노드는
 * 그것을 **스키마 속성으로 붙들어** Tiptap 파싱에서 살아남게 하는 역할만 한다.
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

const JUSTIFY: Record<string, string> = {
  right: 'flex-end',
  center: 'center',
  left: 'flex-start',
};

export const ScaffoldBlock = Node.create({
  name: 'scaffoldBlock',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      bid: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-bid'),
        renderHTML: () => ({}),
      },
      x: num('data-x', 0),
      y: num('data-y', 0),
      w: num('data-w', 0),
      h: num('data-h', 0),
      fontSize: num('data-fs', 10),
      /** 0~1 사이면 텍스트를 가로로 축소해 실측 폭에 맞춘다(폰트 대체 보정). */
      scaleX: num('data-sx', 1),
      align: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-align') || 'left',
        renderHTML: () => ({}),
      },
      /** text = 글자 블록, rule = 구분선, image = 이미지/로고 자리 */
      variant: {
        default: 'text',
        parseHTML: (element) => element.getAttribute('data-variant') || 'text',
        renderHTML: () => ({}),
      },
    };
  },

  /** tiptap-markdown 직렬화. 없으면 커스텀 노드에서 마크다운이 비거나 깨진다. */
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.renderInline(node);
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="scaffold-block"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { bid, x, y, w, h, fontSize, align, scaleX, variant } = node.attrs;
    const style = [
      'position:absolute',
      `left:${x}px`,
      `top:${y}px`,
      w ? `width:${w}px` : '',
      h ? `height:${h}px` : '',
      `font-size:${fontSize}px`,
      'line-height:1',
      'display:flex',
      'align-items:center',
      `justify-content:${JUSTIFY[align] ?? 'flex-start'}`,
      'white-space:nowrap',
      'overflow:hidden',
      variant === 'image' ? 'border:1px dashed #cbd5e1' : '',
      variant === 'rule' ? 'background:#dcdcdc' : '',
    ]
      .filter(Boolean)
      .join(';');

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'scaffold-block',
        ...(bid ? { 'data-bid': bid } : {}),
        'data-x': String(x),
        'data-y': String(y),
        'data-w': String(w),
        'data-h': String(h),
        'data-fs': String(fontSize),
        'data-align': align,
        'data-sx': String(scaleX),
        'data-variant': variant,
        class: `scaffold-block scaffold-block-${variant}`,
        style,
      }),
      0,
    ];
  },
});
