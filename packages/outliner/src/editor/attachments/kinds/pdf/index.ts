/**
 * @file kinds/pdf/index.ts
 * @description PDF 종류
 *
 * 종류만의 옵션: `page` (열 때 펼칠 쪽 번호). 호스트의 "열기"에 그대로 넘어간다.
 */

import { FileText } from 'lucide-react';
import type { FileKind } from '../../kind';
import { PdfBlock } from './PdfBlock';

export const pdfKind: FileKind = {
  id: 'pdf',
  label: 'PDF',
  extensions: ['pdf'],
  Icon: FileText,
  Block: PdfBlock,
};
