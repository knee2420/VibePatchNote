/**
 * @file kinds/link/index.ts
 * @description 기본 종류 — 전용 종류가 없는 파일과 웹 주소
 *
 * 이름만 보여 주고, 누르면 호스트가 연다. (옵시디언이 못 여는 파일은 기본 프로그램, 웹 주소는 브라우저)
 */

import { File, Globe } from 'lucide-react';
import type { FileKind } from '../../kind';

export const linkKind: FileKind = {
  id: 'link',
  label: '그 밖의 파일',
  extensions: [],
  Icon: File,
};

export const webKind: FileKind = {
  id: 'web',
  label: '웹 주소',
  extensions: [],
  Icon: Globe,
};
