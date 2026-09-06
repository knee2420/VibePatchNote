import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { mergeAttributes } from '@tiptap/core';

/**
 * 실측 기하를 보존하는 표 확장.
 *
 * 기본 Tiptap 표는 행 높이 개념이 없고, 고정 클래스를 씌우면 셀 폰트/여백 실측값이
 * 덮인다. 그래서 여기서는
 *  1) 표 자체에 절대 배치 좌표를 붙이고
 *  2) 행에 `height` 속성을 추가하고
 *  3) 셀에 열 너비(px)와 폰트 크기를 붙인다.
 * 시각을 고정하는 클래스는 넣지 않는다 — 스타일 출처는 실측값 하나뿐이어야 한다.
 */
const num = (name: string, fallback: number | null) => ({
  default: fallback,
  parseHTML: (element: HTMLElement) => {
    const raw = element.getAttribute(name);
    if (raw === null) return fallback;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  },
  renderHTML: () => ({}),
});

/** 표를 페이지 위 실측 위치에 절대 배치한다. */
export const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      x: num('data-x', null),
      y: num('data-y', null),
      w: num('data-w', null),
      h: num('data-h', null),
    };
  },

  /**
   * tiptap-markdown 직렬화.
   *
   * 기본 tiptap-markdown 에는 표 직렬화기가 없어 표 전체를 HTML 덩어리로 뱉는다.
   * 에이전트/MCP 가 읽을 마크다운이므로 GFM 파이프 테이블로 내보낸다.
   */
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const rows: string[][] = [];
          node.forEach((row: any) => {
            const cells: string[] = [];
            row.forEach((cell: any) => {
              const parts: string[] = [];
              cell.descendants((child: any) => {
                if (child.type.name === 'scaffoldSlot') {
                  parts.push(`[ ${child.attrs.placeholder || '입력'} ]`);
                  return false;
                }
                if (child.isText) parts.push(child.text ?? '');
                return true;
              });
              cells.push(parts.join('').replaceAll('|', String.raw`\|`).replace(/\s+/g, ' ').trim());
            });
            rows.push(cells);
          });
          if (!rows.length) return;

          const width = Math.max(...rows.map((r) => r.length));
          const pad = (r: string[]) => {
            const copy = r.slice();
            while (copy.length < width) copy.push('');
            return copy;
          };
          const line = (cells: string[]) => `| ${pad(cells).join(' | ')} |`;

          state.write(line(rows[0]));
          state.ensureNewLine();
          state.write(`| ${Array(width).fill('---').join(' | ')} |`);
          state.ensureNewLine();
          rows.slice(1).forEach((r) => {
            state.write(line(r));
            state.ensureNewLine();
          });
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const { x, y, w, h } = node.attrs;
    const positioned = x !== null && y !== null;
    const style = positioned
      ? `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;` +
        'border-collapse:collapse;table-layout:fixed;'
      : 'border-collapse:collapse;table-layout:fixed;width:100%;';

    return [
      'table',
      mergeAttributes(HTMLAttributes, {
        ...(positioned
          ? {
              'data-x': String(x),
              'data-y': String(y),
              'data-w': String(w),
              'data-h': String(h),
            }
          : {}),
        class: 'scaffold-table',
        style,
      }),
      ['tbody', 0],
    ];
  },
}).configure({
  // 리사이즈 플러그인이 colgroup 을 자기 방식으로 다시 그려 실측 열 너비를 덮는다.
  resizable: false,
});

/**
 * 원본 행 높이를 실측 px 로 보존한다. 기본 Tiptap 에는 없는 개념.
 *
 * 백분율(`height:6%`)을 쓰면 안 된다 — 표 자체 높이가 `100%` 라 백분율 기준이
 * 끊기고 브라우저가 행을 균등 분배해 버린다. 프레임이 고정 px 상자이므로
 * 절대 px 이 정확하고 합계도 정확히 맞는다.
 */
export const CustomTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      heightPx: num('data-hpx', null),
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const { heightPx } = node.attrs;
    return [
      'tr',
      mergeAttributes(
        HTMLAttributes,
        heightPx !== null
          ? { 'data-hpx': String(heightPx), style: `height:${heightPx}px;` }
          : {}
      ),
      0,
    ];
  },
});

/** 열 너비(px)와 폰트 크기를 셀에 붙여 실측값을 유지한다. */
function cellAttributes(parent: () => Record<string, unknown> | undefined) {
  return {
    ...parent?.(),
    bid: {
      default: null,
      parseHTML: (element: HTMLElement) => element.getAttribute('data-bid'),
      renderHTML: () => ({}),
    },
    widthPx: num('data-wpx', null),
    fontSize: num('data-fs', null),
    fill: {
      default: false,
      parseHTML: (element: HTMLElement) => element.getAttribute('data-fill') === 'true',
      renderHTML: () => ({}),
    },
  };
}

/** 셀 공통 스타일 문자열과 데이터 속성을 만든다. 튜플 조립은 각 확장이 직접 한다. */
function cellStyle(tag: 'td' | 'th', attrs: Record<string, unknown>) {
  const bid = attrs.bid as string | null;
  const widthPx = attrs.widthPx as number | null;
  const fontSize = attrs.fontSize as number | null;
  const fill = attrs.fill as boolean;

  const style = [
    'border:1px solid #333',
    'vertical-align:middle',
    'overflow:hidden',
    fill ? 'padding:0' : 'padding:2px 6px',
    widthPx !== null ? `width:${widthPx}px` : '',
    fontSize !== null ? `font-size:${fontSize}px` : '',
    tag === 'th' ? 'text-align:center;font-weight:600;background:#f7f7f7' : '',
  ]
    .filter(Boolean)
    .join(';');

  return {
    ...(bid ? { 'data-bid': bid } : {}),
    ...(widthPx !== null ? { 'data-wpx': String(widthPx) } : {}),
    ...(fontSize !== null ? { 'data-fs': String(fontSize) } : {}),
    ...(fill ? { 'data-fill': 'true' } : {}),
    style,
  };
}

export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return cellAttributes(this.parent as () => Record<string, unknown> | undefined);
  },
  renderHTML({ HTMLAttributes, node }) {
    return ['td', mergeAttributes(HTMLAttributes, cellStyle('td', node.attrs)), 0];
  },
});

export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return cellAttributes(this.parent as () => Record<string, unknown> | undefined);
  },
  renderHTML({ HTMLAttributes, node }) {
    return ['th', mergeAttributes(HTMLAttributes, cellStyle('th', node.attrs)), 0];
  },
});

export const TableKit = [CustomTable, CustomTableRow, CustomTableHeader, CustomTableCell];
