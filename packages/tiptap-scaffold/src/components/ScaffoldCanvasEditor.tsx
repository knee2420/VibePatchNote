import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { ScaffoldEditorExtensions } from '../extensions';
import '../styles/scaffold.css';

export interface SlotHoverInfo {
  id: string;
  number: number;
  label: string;
  box_2d: [number, number, number, number];
}

export interface ScaffoldCanvasEditorProps {
  initialContent?: string;
  onChangeHtml?: (html: string) => void;
  onChangeMarkdown?: (markdown: string) => void;
  onHoverSlot?: (slot: SlotHoverInfo | null) => void;
  activeMappingNumber?: number | null;
  className?: string;
  readOnly?: boolean;
}

function matchSlotToBoundingBox(text: string, placeholder: string): SlotHoverInfo {
  const combined = `${text} ${placeholder}`.toLowerCase();

  // 회의록 양식 슬롯 우선 매칭
  if (combined.includes('일시') || combined.includes('yyyy') || combined.includes('2018')) {
    return { id: 'slot-time', number: 1, label: '일시 (YYYY.MM.DD)', box_2d: [121, 266, 166, 878] };
  }
  if (combined.includes('장소') || combined.includes('6공학관')) {
    return { id: 'slot-place', number: 2, label: '회의 장소', box_2d: [166, 266, 207, 878] };
  }
  if (combined.includes('참석자') || combined.includes('인원') || combined.includes('4명')) {
    return { id: 'slot-attendees', number: 3, label: '참석자 인원 및 명단', box_2d: [207, 266, 265, 878] };
  }
  if (combined.includes('안건') || combined.includes('gps')) {
    return { id: 'slot-agenda', number: 4, label: '회의 주요 안건', box_2d: [265, 266, 313, 878] };
  }
  if (combined.includes('회의내용') || combined.includes('드론') || combined.includes('논의')) {
    return { id: 'slot-content', number: 5, label: '상세 회의 내용', box_2d: [313, 266, 479, 878] };
  }
  if (combined.includes('지출') || combined.includes('40,000') || combined.includes('0,000')) {
    return { id: 'slot-expense', number: 6, label: '총 지출 금액 (원)', box_2d: [479, 266, 520, 878] };
  }
  if (combined.includes('증빙') || combined.includes('영수증') || combined.includes('첨부')) {
    return { id: 'slot-evidence', number: 7, label: '영수증 및 증빙자료 첨부란', box_2d: [520, 121, 854, 878] };
  }

  // 인보이스 양식 슬롯 매칭 (실제 PDF 기하와 100% 일치)
  if (combined.includes('상호') || combined.includes('로고') || combined.includes('logo') || combined.includes('brand')) {
    return { id: 'slot-logo', number: 1, label: '상호 / 로고명 (예: Atticus)', box_2d: [83, 101, 154, 535] };
  }
  if (
    combined.includes('august') ||
    combined.includes('company') ||
    combined.includes('공급자') ||
    combined.includes('tax') ||
    combined.includes('invoice') ||
    combined.includes('2026') ||
    combined.includes('1309')
  ) {
    return { id: 'slot-company', number: 2, label: '공급자 정보 및 일자', box_2d: [35, 355, 160, 535] };
  }
  if (
    combined.includes('billing') ||
    combined.includes('수신자') ||
    combined.includes('담당자') ||
    combined.includes('mingyu') ||
    combined.includes('seoul') ||
    combined.includes('주소')
  ) {
    return { id: 'slot-billing', number: 3, label: '수신자 청구 정보 (Billing info)', box_2d: [182, 60, 245, 121] };
  }
  if (
    combined.includes('total') ||
    combined.includes('usd') ||
    combined.includes('147') ||
    combined.includes('paid') ||
    combined.includes('credit')
  ) {
    return { id: 'slot-total', number: 4, label: '총 결제 금액 (Total USD)', box_2d: [182, 460, 228, 535] };
  }
  if (
    combined.includes('품목') ||
    combined.includes('서비스') ||
    combined.includes('description') ||
    combined.includes('amount') ||
    combined.includes('subtotal') ||
    combined.includes('one-time')
  ) {
    return { id: 'slot-table', number: 5, label: '청구 내역 및 단가표 (Description Table)', box_2d: [290, 60, 395, 535] };
  }
  return { id: 'slot-footer', number: 6, label: '고객 지원 및 결제 정보 (Footer)', box_2d: [580, 160, 638, 435] };
}


export function ScaffoldCanvasEditor({
  initialContent = '',
  onChangeHtml,
  onChangeMarkdown,
  onHoverSlot,
  activeMappingNumber,
  className = '',
  readOnly = false,
}: ScaffoldCanvasEditorProps) {
  const editor = useEditor({
    extensions: ScaffoldEditorExtensions,
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChangeHtml?.(html);

      // tiptap-markdown 저장소에서 순수 마크다운 추출
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown?.getMarkdown?.() || '';
      onChangeMarkdown?.(markdown);
    },
    editorProps: {
      attributes: {
        class: 'scaffold-prose outline-none min-h-[500px] w-full text-slate-900 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: true });
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor && editor.isEditable !== !readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // 외부에서 활성화된 매핑 번호가 있을 때 해당 슬롯 하이라이트 동기화
  useEffect(() => {
    const slots = document.querySelectorAll('.scaffold-editor-root span[data-type="scaffold-slot"], .scaffold-editor-root .scaffold-slot');
    slots.forEach((el) => {
      const numAttr = el.getAttribute('data-mapping-num');
      if (activeMappingNumber && numAttr === String(activeMappingNumber)) {
        el.classList.add('is-sync-hovered');
      } else {
        el.classList.remove('is-sync-hovered');
      }
    });
  }, [activeMappingNumber]);

  if (!editor) {
    return null;
  }

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const slotEl = target?.closest('.scaffold-slot, span[data-type="scaffold-slot"]') as HTMLElement | null;
    if (slotEl) {
      const text = slotEl.innerText || '';
      const placeholder = slotEl.getAttribute('data-placeholder') || '';
      const bboxAttr = slotEl.getAttribute('data-bbox');
      const numAttr = slotEl.getAttribute('data-mapping-num');
      const slotId = slotEl.getAttribute('data-slot-id') || `slot-${numAttr || 'hover'}`;

      let info: SlotHoverInfo;

      if (bboxAttr) {
        try {
          const parsed = JSON.parse(bboxAttr);
          if (Array.isArray(parsed) && parsed.length === 4) {
            info = {
              id: slotId,
              number: numAttr ? parseInt(numAttr, 10) : 1,
              label: placeholder || text || '입력 슬롯',
              box_2d: parsed as [number, number, number, number],
            };
          } else {
            info = matchSlotToBoundingBox(text, placeholder);
          }
        } catch {
          info = matchSlotToBoundingBox(text, placeholder);
        }
      } else {
        info = matchSlotToBoundingBox(text, placeholder);
      }

      slotEl.setAttribute('data-mapping-num', String(info.number));
      onHoverSlot?.(info);
    }
  };


  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const slotEl = target?.closest('.scaffold-slot, span[data-type="scaffold-slot"]') as HTMLElement | null;
    if (slotEl) {
      onHoverSlot?.(null);
    }
  };

  return (
    <div
      className={`scaffold-editor-root w-full bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col ${className}`}
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* 2단 및 3단 그리드를 무조건 강제하는 격리 스타일 */}
      <style>{`
        .scaffold-editor-root div[data-type="column-group"],
        .scaffold-editor-root .column-group {
          display: grid !important;
          grid-template-columns: 1.25fr 1fr !important;
          gap: 1.25rem !important;
          width: 100% !important;
          margin: 1rem 0 !important;
          box-sizing: border-box !important;
        }
        .scaffold-editor-root div[data-type="column-group"][data-cols="3"],
        .scaffold-editor-root .column-group[data-cols="3"] {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        .scaffold-editor-root div[data-type="column"],
        .scaffold-editor-root .column-box {
          display: block !important;
          min-width: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .scaffold-editor-root .text-right {
          text-align: right !important;
        }
      `}</style>

      {/* 에디터 본문 A4 용지 캔버스 영역 */}
      <div
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        className="flex-1 p-8 sm:p-10 overflow-y-auto max-h-[800px]"
        style={{ backgroundColor: '#ffffff' }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
