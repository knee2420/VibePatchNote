import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { ColumnGroup } from './ColumnGroup';
import { Column } from './Column';
import { ScaffoldBlock } from './ScaffoldBlock';
import { ScaffoldFrame } from './ScaffoldFrame';
import { ScaffoldPage } from './ScaffoldPage';
import { ScaffoldSlot } from './ScaffoldSlot';
import { TableKit } from './TableKit';

export { ColumnGroup } from './ColumnGroup';
export { Column } from './Column';
export { ScaffoldBlock } from './ScaffoldBlock';
export { ScaffoldFrame } from './ScaffoldFrame';
export { ScaffoldPage } from './ScaffoldPage';
export { ScaffoldSlot } from './ScaffoldSlot';
export { TableKit } from './TableKit';

export const ScaffoldEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Markdown.configure({
    html: true,
    transformPastedText: true,
    transformCopiedText: true,
  }),
  ...TableKit,
  ColumnGroup,
  Column,
  ScaffoldPage,
  ScaffoldFrame,
  ScaffoldBlock,
  ScaffoldSlot,
];
