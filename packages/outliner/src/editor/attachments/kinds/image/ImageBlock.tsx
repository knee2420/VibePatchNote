/**
 * @file ImageBlock.tsx
 * @description 불릿 아래에 그림으로 보이는 이미지 (작게 · 크게)
 */

import React from 'react';
import type { FileBlockProps, FileBlockSize } from '../../kind';

const SIZE_CLASS: Record<FileBlockSize, string> = {
  small: 'max-h-24 max-w-[160px]',
  large: 'max-h-[420px] max-w-full',
};

export const ImageBlock: React.FC<FileBlockProps> = ({ file, size, name, files }) => {
  const url = files.resolveUrl(file.target);
  if (!url) return null;

  return (
    <img
      src={url}
      alt={name}
      title={name}
      loading="lazy"
      draggable={false}
      className={`block rounded border border-(--background-modifier-border) object-contain ${SIZE_CLASS[size]}`}
    />
  );
};
