import { useState } from 'react';
import { Download, CheckSquare, Square, X, Sliders, FileSpreadsheet, Loader2 } from 'lucide-react';
import type { CompilerOptions, DocumentCompilerProps } from './types';

/**
 * 스크리브너 스타일의 복합 문서 조립/합성(Compile) 다이얼로그 모달 컴포넌트.
 * 바인더 노드 중 원하는 섹션만 선택하고 넘버링 규칙과 서식을 지정하여 단일 산출물로 빌드합니다.
 */
export function DocumentCompilerModal({
  sections,
  onToggleSection,
  onToggleAll,
  onCompile,
  onClose,
  isCompiling = false,
  className = '',
}: DocumentCompilerProps) {
  const [options, setOptions] = useState<CompilerOptions>({
    includeTitle: true,
    numberingStyle: 'decimal',
    pageBreaksBetweenSections: true,
    format: 'markdown',
  });

  const selectedSections = sections.filter((s) => s.selected);
  const isAllSelected = sections.length > 0 && selectedSections.length === sections.length;

  const handleCompile = () => {
    onCompile(
      options,
      selectedSections.map((s) => s.id)
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div
        className={`w-full max-w-3xl bg-white border border-slate-200/80 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        {/* 1. 모달 헤더 */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">문서 합성 및 컴파일러</h3>
              <p className="text-[11px] text-slate-500">
                바인더의 여러 조각 노드를 선택하여 완성된 단일 문서로 출력합니다.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. 본문 2단 구성 (좌: 섹션 선택 / 우: 컴파일 옵션) */}
        <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[380px] max-h-[520px] overflow-hidden">
          {/* [좌측] 섹션 선택 리스트 */}
          <div className="flex-1 p-5 flex flex-col overflow-hidden bg-slate-50/50">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                포함할 섹션 ({selectedSections.length}/{sections.length})
              </span>
              <button
                type="button"
                onClick={() => onToggleAll(!isAllSelected)}
                className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer font-medium"
              >
                {isAllSelected ? '모두 해제' : '전체 선택'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {sections.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  컴파일 가능한 섹션이 없습니다.
                </p>
              ) : (
                sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => onToggleSection(section.id, !section.selected)}
                    style={{ paddingLeft: `${(section.depth || 0) * 16 + 10}px` }}
                    className={`flex items-center gap-2.5 py-1.5 pr-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      section.selected
                        ? 'bg-white text-slate-900 font-medium shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:bg-slate-100/70'
                    }`}
                  >
                    {section.selected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate flex-1">{section.title}</span>
                    {section.contentLength !== undefined && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {section.contentLength.toLocaleString()}자
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* [우측] 서식 및 출력 옵션 */}
          <div className="w-full md:w-80 p-5 flex flex-col gap-4 bg-white overflow-y-auto">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                출력 서식 옵션
              </span>
            </div>

            {/* 출력 포맷 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">내보내기 포맷</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['markdown', 'html', 'text'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setOptions({ ...options, format: fmt })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer uppercase ${
                      options.format === fmt
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* 넘버링 스타일 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">섹션 넘버링 규칙</label>
              <select
                value={options.numberingStyle}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    numberingStyle: e.target.value as CompilerOptions['numberingStyle'],
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              >
                <option value="none">넘버링 없음 (제목만 표시)</option>
                <option value="decimal">1. / 1.1 / 1.1.1 (아라비아 숫자)</option>
                <option value="roman">I. / II. / III. (로마 숫자)</option>
              </select>
            </div>

            {/* 체크박스 옵션들 */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTitle}
                  onChange={(e) => setOptions({ ...options, includeTitle: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                />
                <span>각 섹션 헤더 제목 포함</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.pageBreaksBetweenSections}
                  onChange={(e) =>
                    setOptions({ ...options, pageBreaksBetweenSections: e.target.checked })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                />
                <span>섹션 간 페이지 구분선 삽입</span>
              </label>
            </div>
          </div>
        </div>

        {/* 3. 하단 액션 푸터 */}
        <div className="h-14 px-6 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            총 <strong className="text-indigo-600 font-semibold">{selectedSections.length}</strong>개 섹션 합성 대기
          </span>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                취소
              </button>
            )}
            <button
              type="button"
              disabled={isCompiling || selectedSections.length === 0}
              onClick={handleCompile}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isCompiling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>문서 컴파일 실행</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
