import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';

export const CustomTable = Table.configure({
  resizable: true,
  HTMLAttributes: {
    class: 'scaffold-table border-collapse w-full my-4 border border-slate-300 rounded-md overflow-hidden text-sm shadow-xs',
  },
});

export const CustomTableRow = TableRow.configure({
  HTMLAttributes: {
    class: 'border-b border-slate-200 transition-colors hover:bg-slate-50/50',
  },
});

export const CustomTableHeader = TableHeader.configure({
  HTMLAttributes: {
    class: 'bg-slate-100 text-slate-800 font-bold p-2.5 text-left border-r border-slate-200 last:border-r-0',
  },
});

export const CustomTableCell = TableCell.configure({
  HTMLAttributes: {
    class: 'p-2.5 border-r border-slate-200 last:border-r-0 align-top min-w-[80px]',
  },
});

export const TableKit = [
  CustomTable,
  CustomTableRow,
  CustomTableHeader,
  CustomTableCell,
];
