/**
 * @file PdfBlock.tsx
 * @description 불릿 아래에 표지(첫 쪽)로 보이는 PDF (작게 · 크게)
 *
 * 표지는 호스트가 만들어 준다. 만드는 데 품이 들므로 화면에 들어왔을 때에만 부탁한다.
 * 호스트가 표지를 못 만들면 아이콘 카드로 보인다.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import type { FileBlockProps, FileBlockSize } from '../../kind';

const WIDTH: Record<FileBlockSize, number> = { small: 120, large: 320 };

export const PdfBlock: React.FC<FileBlockProps> = ({ file, size, name, files }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState<string | null>(null);
  const width = WIDTH[size];
  const { thumbnail } = files;
  const { target } = file;

  useEffect(() => {
    const el = ref.current;
    if (!el || !thumbnail) return;

    let isStale = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void thumbnail(target, width).then((src) => {
        if (!isStale) setCover(src);
      });
    });
    observer.observe(el);

    return () => {
      isStale = true;
      observer.disconnect();
    };
  }, [thumbnail, target, width]);

  return (
    <div ref={ref} className="flex flex-col gap-1" style={{ width }} title={name}>
      {cover ? (
        <img
          src={cover}
          alt={name}
          draggable={false}
          className="block w-full rounded border border-(--background-modifier-border) bg-white"
        />
      ) : (
        <div className="aspect-[3/4] w-full flex items-center justify-center rounded border border-(--background-modifier-border) bg-(--background-secondary)">
          <FileText className="w-6 h-6 text-(--text-faint)" />
        </div>
      )}
      <span className="truncate text-[11px] text-(--text-muted)">{name}</span>
    </div>
  );
};
