/**
 * @file kinds/image/index.ts
 * @description 이미지 종류
 */

import { Image } from 'lucide-react';
import type { FileKind } from '../../kind';
import { ImageBlock } from './ImageBlock';

export const imageKind: FileKind = {
  id: 'image',
  label: '이미지',
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'],
  Icon: Image,
  Block: ImageBlock,
};
