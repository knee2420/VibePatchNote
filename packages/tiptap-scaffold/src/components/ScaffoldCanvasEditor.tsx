import { useEditor, EditorContent } from '@tiptap/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { ScaffoldEditorExtensions } from '../extensions';
import type { SlotMappingItem } from '../types';
import '../styles/scaffold.css';

export interface ScaffoldCanvasEditorProps {
  initialContent?: string;
  /** 원본 문서 실측 좌표 목록. 슬롯 호버 시 이 값으로 원본 위치를 되짚는다. */
  slots?: SlotMappingItem[];
  onChangeHtml?: (html: string) => void;
  onChangeMarkdown?: (markdown: string) => void;
  onHoverSlot?: (slot: SlotMappingItem | null) => void;
  activeMappingNumber?: number | null;
  className?: string;
  readOnly?: boolean;
}

const SLOT_SELECTOR = 'span[data-type="scaffold-slot"]';
const ACTIVE_CLASS = 'is-sync-hovered';

/**
 * ScaffoldCanvasEditor
 *
 * 서식 와이어프레임 편집기. 슬롯 좌표는 **이 컴포넌트가 추론하지 않는다** —
 * 백엔드가 원본 PDF 에서 실측한 `slots` 를 `data-slot-id`/`data-mapping-num` 으로
 * 되짚기만 한다. 좌표를 알 수 없으면 매핑을 보고하지 않는다(틀린 위치를 띄우지 않음).
 */
export function ScaffoldCanvasEditor({
  initialContent = '',
  slots,
  onChangeHtml,
  onChangeMarkdown,
  onHoverSlot,
  activeMappingNumber,
  className = '',
  readOnly = false,
}: ScaffoldCanvasEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const slotById = useMemo(() => {
    const byId = new Map<string, SlotMappingItem>();
    const byNumber = new Map<number, SlotMappingItem>();
    (slots ?? []).forEach((slot) => {
      byId.set(slot.id, slot);
      byNumber.set(slot.number, slot);
    });
    return { byId, byNumber };
  }, [slots]);

  const editor = useEditor({
    extensions: ScaffoldEditorExtensions,
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor: instance }) => {
      onChangeHtml?.(instance.getHTML());
      const storage = instance.storage as { markdown?: { getMarkdown?: () => string } };
      onChangeMarkdown?.(storage.markdown?.getMarkdown?.() ?? '');
    },
    editorProps: {
      attributes: {
        class: 'scaffold-prose outline-none text-slate-900 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor && editor.isEditable !== !readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // 활성 매핑 하이라이트. 이 에디터 인스턴스의 DOM 으로만 범위를 한정한다.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const elements = root.querySelectorAll<HTMLElement>(SLOT_SELECTOR);
    elements.forEach((element) => {
      const raw = element.getAttribute('data-mapping-num');
      const isActive = activeMappingNumber != null && raw === String(activeMappingNumber);
      element.classList.toggle(ACTIVE_CLASS, isActive);
    });
  }, [activeMappingNumber, initialContent]);

  const resolveSlot = useCallback(
    (element: HTMLElement): SlotMappingItem | null => {
      const id = element.getAttribute('data-slot-id');
      if (id) {
        const found = slotById.byId.get(id);
        if (found) return found;
      }
      const raw = element.getAttribute('data-mapping-num');
      if (raw) {
        const parsed = Number.parseInt(raw, 10);
        if (!Number.isNaN(parsed)) return slotById.byNumber.get(parsed) ?? null;
      }
      return null;
    },
    [slotById]
  );

  const handlePointerOver = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(SLOT_SELECTOR);
      if (!target) return;
      // 좌표를 모르면 아무것도 보고하지 않는다. 틀린 위치를 띄우는 것보다 낫다.
      onHoverSlot?.(resolveSlot(target));
    },
    [onHoverSlot, resolveSlot]
  );

  const handlePointerOut = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(SLOT_SELECTOR);
      if (target) onHoverSlot?.(null);
    },
    [onHoverSlot]
  );

  if (!editor) return null;

  return (
    <div
      ref={rootRef}
      className={`scaffold-editor-root bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-auto ${className}`}
    >
      <div onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
