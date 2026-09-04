import { Node, mergeAttributes } from '@tiptap/core';

export const ScaffoldSlot = Node.create({
  name: 'scaffoldSlot',
  group: 'inline',
  inline: true,
  content: 'text*',
  defining: true,

  addAttributes() {
    return {
      placeholder: {
        default: '내용을 입력하세요',
        parseHTML: (element) => element.getAttribute('data-placeholder') || '내용을 입력하세요',
        renderHTML: (attributes) => ({
          'data-placeholder': attributes.placeholder,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="scaffold-slot"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'scaffold-slot',
        class: 'scaffold-slot inline-block px-2 py-0.5 mx-0.5 rounded-sm border border-dashed border-purple-400 bg-purple-50/70 text-purple-900 font-medium text-sm empty:before:content-[attr(data-placeholder)] empty:before:text-purple-400 empty:before:italic',
      }),
      0,
    ];
  },
});
