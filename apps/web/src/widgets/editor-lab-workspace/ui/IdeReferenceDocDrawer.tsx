import type { MouseEvent } from 'react';
import { IdeReferenceDocDrawer as PackageIdeReferenceDocDrawer } from '@vibe/editor-workspace';
import type { ResourceItem } from '../model/types';
import { A4DocumentViewer } from './A4DocumentViewer';

export interface IdeReferenceDocDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPopoutToFloating: () => void;
  referenceDocuments: ResourceItem[];
  currentDoc: ResourceItem | null;
  onSelectDoc: (doc: ResourceItem) => void;
  width?: number;
  leftOffset?: number;
  onMouseDownResizer?: (e: MouseEvent<HTMLDivElement>) => void;
}

export function IdeReferenceDocDrawer({
  isOpen,
  onClose,
  onPopoutToFloating,
  referenceDocuments,
  currentDoc,
  onSelectDoc,
  width = 580,
  leftOffset = 308,
  onMouseDownResizer,
}: IdeReferenceDocDrawerProps) {
  const activeDoc = currentDoc || referenceDocuments[0] || null;

  return (
    <PackageIdeReferenceDocDrawer<ResourceItem>
      isOpen={isOpen}
      onClose={onClose}
      onPopoutToFloating={onPopoutToFloating}
      documents={referenceDocuments}
      currentDoc={activeDoc}
      onSelectDoc={onSelectDoc}
      width={width}
      leftOffset={leftOffset}
      onMouseDownResizer={onMouseDownResizer}
    >
      {activeDoc ? (
        <A4DocumentViewer resource={activeDoc} />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs gap-2">
          <p>표시할 레퍼런스 문서가 없습니다.</p>
        </div>
      )}
    </PackageIdeReferenceDocDrawer>
  );
}
