import { useState } from 'react';
import { Target, Tag, FileText, Plus, X } from 'lucide-react';
import type { MetadataInspectorProps } from './types';

const defaultStatusOptions = ['초안', '작성중', '검토대기', '완료'];
const defaultLabelOptions = ['기본', '중요', '수정필요', '참조'];

/**
 * 스크리브너/IDE 스타일의 문서 메타데이터 & 목표 분량 달성률 인스펙터 컴포넌트.
 */
export function MetadataInspector({
  metadata,
  onChange,
  statusOptions = defaultStatusOptions,
  labelOptions = defaultLabelOptions,
  className = '',
}: MetadataInspectorProps) {
  const [tagInput, setTagInput] = useState('');

  const currentCount = metadata.currentWordCount || 0;
  const targetCount = metadata.targetWordCount || 2000;
  const progressPercent = Math.min(100, Math.round((currentCount / (targetCount || 1)) * 100));

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    const currentTags = metadata.tags || [];
    if (!currentTags.includes(trimmed)) {
      onChange?.({
        ...metadata,
        tags: [...currentTags, trimmed],
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange?.({
      ...metadata,
      tags: (metadata.tags || []).filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className={`w-full h-full p-3.5 flex flex-col gap-3.5 overflow-y-auto select-none text-xs bg-white text-slate-800 ${className}`}>
      {/* 1. 목표 분량 및 달성률 프로그레스 바 */}
      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>목표 분량 진행도</span>
          </div>
          <span className="font-mono text-slate-800 font-bold text-xs">{progressPercent}%</span>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>현재: <strong className="text-slate-800 font-semibold">{currentCount.toLocaleString()}</strong>자</span>
          <div className="flex items-center gap-1">
            <span>목표:</span>
            <input
              type="number"
              value={targetCount}
              onChange={(e) =>
                onChange?.({
                  ...metadata,
                  targetWordCount: Math.max(100, Number(e.target.value) || 0),
                })
              }
              className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs shadow-2xs"
            />
            <span>자</span>
          </div>
        </div>
      </div>

      {/* 2. 상태 & 라벨 드롭다운 */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-600 uppercase">진행 상태</label>
          <select
            value={metadata.status || statusOptions[0]}
            onChange={(e) => onChange?.({ ...metadata, status: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          >
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-600 uppercase">라벨 구분</label>
          <select
            value={metadata.label || labelOptions[0]}
            onChange={(e) => onChange?.({ ...metadata, label: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          >
            {labelOptions.map((lb) => (
              <option key={lb} value={lb}>
                {lb}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. 태그 / 키워드 관리 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 uppercase">
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          <span>키워드 & 태그</span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="새 태그 입력 후 Enter..."
            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400 shadow-2xs"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {(metadata.tags || []).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-medium"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-600 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 4. 저작 노트 / 메모 */}
      <div className="flex-1 flex flex-col gap-1.5 min-h-[120px]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 uppercase">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>섹션 메모 & 체크리스트</span>
        </div>
        <textarea
          value={metadata.notes || ''}
          onChange={(e) => onChange?.({ ...metadata, notes: e.target.value })}
          placeholder="이 섹션의 구성 의도나 작성 체크리스트 메모를 기록하세요..."
          className="w-full flex-1 min-h-[100px] bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-sans shadow-2xs transition-all"
        />
      </div>
    </div>
  );
}
