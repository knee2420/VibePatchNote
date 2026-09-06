import { Node, mergeAttributes } from '@tiptap/core';

/**
 * ScaffoldSlot — 서식에서 '매번 새로 채우는 자리'를 나타내는 인라인 노드.
 *
 * `slotId` / `mappingNum` 은 원본 문서의 실측 좌표(`SlotMappingItem.box_2d`)를 찾는
 * 열쇠다. 여기에 선언하지 않으면 Tiptap 이 파싱 단계에서 속성을 버려 원본 매핑이
 * 끊기므로, parseHTML/renderHTML 왕복에서 반드시 보존되어야 한다.
 */
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
        renderHTML: (attributes) => ({ 'data-placeholder': attributes.placeholder }),
      },
      slotId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-slot-id'),
        renderHTML: (attributes) =>
          attributes.slotId ? { 'data-slot-id': attributes.slotId } : {},
      },
      mappingNum: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-mapping-num');
          if (raw === null) return null;
          const parsed = Number.parseInt(raw, 10);
          return Number.isNaN(parsed) ? null : parsed;
        },
        renderHTML: (attributes) =>
          attributes.mappingNum === null ? {} : { 'data-mapping-num': String(attributes.mappingNum) },
      },
      /** 블록 전체가 슬롯인 경우(부분 슬롯이 아닌 경우) 칸을 꽉 채운다. */
      fill: {
        default: false,
        parseHTML: (element) => element.classList.contains('scaffold-slot-fill'),
        renderHTML: (attributes) => (attributes.fill ? { 'data-fill': 'true' } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="scaffold-slot"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const fill = node.attrs.fill ? ' scaffold-slot-fill' : '';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'scaffold-slot',
        class: `scaffold-slot${fill}`,
      }),
      0,
    ];
  },
});
