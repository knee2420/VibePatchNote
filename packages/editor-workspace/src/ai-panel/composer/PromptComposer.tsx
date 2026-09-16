import { memo, useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { ContextTagBar } from './ContextTagBar';
import { ModelConfigBadge } from './ModelConfigBadge';
import type { PromptComposerProps, ModelConfig } from './types';

const DEFAULT_CONFIG: ModelConfig = {
  modelName: 'Gemini-3.8-flash',
  temperature: 0.7,
};

/**
 * PromptComposer (컨텍스트 하네스 & 프롬프트 컴포저)
 *
 * 프롬프트 작성, 컨텍스트 주입 태그 바, 모델 선택기, 레시피 프리셋을 한 곳에 통합한 헤드리스 컴포저.
 */
export const PromptComposer = memo(function PromptComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  contextTags = [],
  onRemoveContextTag,
  onAddContextTag,
  modelConfig = DEFAULT_CONFIG,
  onChangeModelConfig,
  availableModels,
  recipes = [],
  onSelectRecipe,
  placeholder = '에이전트에게 지시할 작업 내용을 입력하세요 (Ctrl + Enter로 전송)...',
  className = '',
}: PromptComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트에어리어 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit(value.trim(), modelConfig, contextTags);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && value.trim()) {
      onSubmit(value.trim(), modelConfig, contextTags);
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={`flex flex-col gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md ${className}`}
    >
      {/* 1. 컨텍스트 태그 바 */}
      {contextTags.length > 0 && (
        <div className="pb-1 border-b border-slate-800/80">
          <ContextTagBar
            tags={contextTags}
            onRemoveTag={onRemoveContextTag}
            onAddTagClick={onAddContextTag}
          />
        </div>
      )}

      {/* 2. 프롬프트 텍스트 영역 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={isLoading}
          className="w-full resize-none text-xs text-slate-100 placeholder-slate-500 bg-transparent focus:outline-none leading-relaxed font-sans"
        />
      </div>

      {/* 3. 하단 툴바 (레시피 프리셋 + 모델 선택기 + 전송 버튼) */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* 레시피 프리셋 선택 */}
          {recipes.length > 0 && (
            <div className="relative shrink-0">
              <select
                onChange={(e) => {
                  const found = recipes.find((r) => r.id === e.target.value);
                  if (found) {
                    onSelectRecipe?.(found);
                    onChange(found.promptTemplate);
                  }
                }}
                defaultValue=""
                className="text-[11px] px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  ⚡ 레시피 템플릿...
                </option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 컨텍스트 추가 버튼 (태그가 없을 때 컴팩트하게 노출) */}
          {contextTags.length === 0 && onAddContextTag && (
            <button
              type="button"
              onClick={onAddContextTag}
              className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded border border-dashed border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              <span>컨텍스트 연결</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 모델 설정 뱃지 */}
          <ModelConfigBadge
            config={modelConfig}
            availableModels={availableModels}
            onChangeModel={(modelName) =>
              onChangeModelConfig?.({ ...modelConfig, modelName })
            }
            onChangeTemperature={(temperature) =>
              onChangeModelConfig?.({ ...modelConfig, temperature })
            }
          />

          {/* 전송 또는 중지 버튼 */}
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-xs"
              title="에이전트 실행 중단"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>중단</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors cursor-pointer shadow-xs"
              title="실행 (Ctrl + Enter)"
            >
              <Send className="w-3 h-3" />
              <span>실행</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
});
