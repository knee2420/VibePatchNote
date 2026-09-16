import { useState } from 'react';
import { TableProperties, FileText, CheckCircle2 } from 'lucide-react';
import type { OutlinerProps, OutlinerRow } from './types';

const defaultStatusOptions = ['초안', '작성중', '검토대기', '완료'];

/**
 * 스크리브너 스타일의 아웃라이너(Outliner) 테이블 뷰 컴포넌트.
 * 각 섹션의 번호, 제목, 요약, 글자수, 상태를 스프레드시트 형태로 일괄 조회하고 편집할 수 있습니다.
 */
export function OutlinerTable<T = Record<string, unknown>>({
  rows,
  selectedId,
  onSelect,
  onChangeRow,
  statusOptions = defaultStatusOptions,
  emptyText = '표시할 아웃라이너 행이 없습니다.',
  className = '',
}: OutlinerProps<T>) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'title' | 'synopsis' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const totalWords = rows.reduce((acc, r) => acc + (r.wordCount || 0), 0);

  if (!rows || rows.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-8 select-none bg-slate-100/70">
        <TableProperties className="w-8 h-8 stroke-[1.5] opacity-40 text-slate-400" />
        <p className="text-xs font-medium text-slate-500">{emptyText}</p>
      </div>
    );
  }

  const handleStartEdit = (row: OutlinerRow<T>, field: 'title' | 'synopsis') => {
    setEditingCell({ id: row.id, field });
    setEditValue(field === 'title' ? row.title : row.synopsis || '');
  };

  const handleFinishEdit = (row: OutlinerRow<T>) => {
    if (!editingCell) return;
    if (editingCell.field === 'title' && editValue !== row.title) {
      onChangeRow?.({ ...row, title: editValue });
    } else if (editingCell.field === 'synopsis' && editValue !== row.synopsis) {
      onChangeRow?.({ ...row, synopsis: editValue });
    }
    setEditingCell(null);
  };

  return (
    <div className={`w-full h-full flex flex-col bg-white overflow-hidden select-none ${className}`}>
      {/* 1. 테이블 헤더 & 스크롤 본문 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs text-slate-700">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center font-mono">#</th>
              <th className="py-2.5 px-4 min-w-[180px]">섹션 제목</th>
              <th className="py-2.5 px-4 min-w-[240px]">시놉시스 / 요약</th>
              <th className="py-2.5 px-4 w-24 text-right">분량</th>
              <th className="py-2.5 px-4 w-28">진행 상태</th>
              <th className="py-2.5 px-4 w-24">라벨</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => {
              const isSelected = row.id === selectedId;
              const isEditingTitle = editingCell?.id === row.id && editingCell?.field === 'title';
              const isEditingSynopsis = editingCell?.id === row.id && editingCell?.field === 'synopsis';

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelect?.(row)}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 text-slate-900 font-medium'
                      : 'hover:bg-slate-50/80 text-slate-700'
                  }`}
                >
                  {/* 번호 */}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                    {row.number ?? index + 1}
                  </td>

                  {/* 제목 */}
                  <td
                    onDoubleClick={() => handleStartEdit(row, 'title')}
                    className="py-2.5 px-4 text-slate-800 font-medium"
                  >
                    {isEditingTitle ? (
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleFinishEdit(row)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit(row)}
                        className="w-full bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-slate-900 outline-none shadow-2xs"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{row.title}</span>
                      </div>
                    )}
                  </td>

                  {/* 시놉시스 */}
                  <td
                    onDoubleClick={() => handleStartEdit(row, 'synopsis')}
                    className="py-2.5 px-4 text-slate-500 text-[11px]"
                  >
                    {isEditingSynopsis ? (
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleFinishEdit(row)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit(row)}
                        className="w-full bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-slate-900 outline-none shadow-2xs"
                      />
                    ) : (
                      <span className="truncate block max-w-md text-slate-500">
                        {row.synopsis || <em className="text-slate-400 not-italic">요약 없음</em>}
                      </span>
                    )}
                  </td>

                  {/* 분량 */}
                  <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-500">
                    {row.wordCount !== undefined ? (
                      `${row.wordCount.toLocaleString()}자`
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* 상태 드롭다운 */}
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={row.status || statusOptions[0]}
                      onChange={(e) =>
                        onChangeRow?.({ ...row, status: e.target.value })
                      }
                      className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      {statusOptions.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* 라벨 */}
                  <td className="py-2.5 px-4">
                    {row.label ? (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-mono font-medium">
                        {row.label}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. 하단 아웃라이너 통계 푸터 */}
      <div className="h-9 px-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>총 <strong>{rows.length}</strong>개 섹션</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <span>합계 분량: <strong className="text-slate-700 font-semibold">{totalWords.toLocaleString()}</strong>자</span>
        </div>
      </div>
    </div>
  );
}
