import { FloatingReferenceWindow as PackageFloatingReferenceWindow } from '@vibe/editor-workspace';
import type { ResourceItem } from '../model/types';
import { A4DocumentViewer } from './A4DocumentViewer';

export interface FloatingReferenceWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onDockToPanel: () => void;
  referenceDocuments: ResourceItem[];
  currentDoc: ResourceItem | null;
  onSelectDoc: (doc: ResourceItem) => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

export function FloatingReferenceWindow({
  isOpen,
  onClose,
  onDockToPanel,
  referenceDocuments,
  currentDoc,
  onSelectDoc,
  initialPosition,
  initialSize,
}: FloatingReferenceWindowProps) {
  const activeDoc = currentDoc || referenceDocuments[0] || null;

  return (
    <PackageFloatingReferenceWindow<ResourceItem>
      isOpen={isOpen}
      onClose={onClose}
      onDockToPanel={onDockToPanel}
      documents={referenceDocuments}
      currentDoc={activeDoc}
      onSelectDoc={onSelectDoc}
      initialPosition={initialPosition}
      initialSize={initialSize}
    >
      {activeDoc ? (
        <A4DocumentViewer resource={activeDoc} />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs gap-2">
          <p>표시할 레퍼런스 문서가 없습니다.</p>
        </div>
      )}
    </PackageFloatingReferenceWindow>
  );
}
