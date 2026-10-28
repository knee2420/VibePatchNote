import { Node, mergeAttributes } from '@tiptap/core';

export interface ColumnGroupOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const ColumnGroup = Node.create<ColumnGroupOptions>({
  name: 'columnGroup',
  group: 'block',
  content: 'column+',
  defining: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: (element) => Number(element.getAttribute('data-cols')) || 2,
        renderHTML: (attributes) => ({
          'data-cols': attributes.cols,
        }),
      },
      layout: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-layout'),
        renderHTML: (attributes) => (attributes.layout ? { 'data-layout': attributes.layout } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column-group"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const cols = node.attrs.cols || 2;
    const layout = node.attrs.layout;

    let gridTemplate = `repeat(${cols}, minmax(0, 1fr))`;
    if (layout === 'header-asym') {
      gridTemplate = '1.25fr 1fr';
    }

    const inlineStyle = `display: grid !important; grid-template-columns: ${gridTemplate} !important; gap: 1.25rem !important; width: 100% !important; margin: 0.75rem 0 !important; box-sizing: border-box !important;`;

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'column-group',
        'data-cols': cols,
        style: inlineStyle,
        class: 'column-group',
      }),
      0,
    ];
  },
});
