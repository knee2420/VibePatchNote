import { memo, useState } from 'react';
import { Cpu, ChevronDown, Sliders } from 'lucide-react';
import type { ModelConfigBadgeProps } from './types';

const DEFAULT_MODELS = [
  'Gemini-3.8-flash',
  'Gemini-3.1-pro',
  'Gemini-3.5-flash-lite',
  'Gemma4 31b',
];

/**
 * ModelConfigBadge (모델 선택기 및 런타임 설정 뱃지)
 *
 * 작업 특성에 맞춘 주력 모델(Gemini-3.8-flash, Gemini-3.1-pro 등) 선택 및 온도 파라미터 조절.
 */
export const ModelConfigBadge = memo(function ModelConfigBadge({
  config,
  availableModels = DEFAULT_MODELS,
  onChangeModel,
  onChangeTemperature,
  className = '',
}: ModelConfigBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 transition-colors cursor-pointer select-none shadow-2xs"
        title="AI 모델 및 추론 파라미터 변경"
      >
        <Cpu className="w-3 h-3 text-indigo-600 shrink-0" />
        <span className="font-semibold text-slate-800">{config.modelName}</span>
        {typeof config.temperature === 'number' && (
          <span className="text-[10px] text-slate-400 font-mono">T:{config.temperature}</span>
        )}
        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 bottom-full mb-1 w-56 rounded-xl bg-white border border-slate-200 shadow-xl z-50 p-2 space-y-2 text-slate-800">
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-1 mb-1">
                Model Harness
              </div>
              <div className="space-y-0.5">
                {availableModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onChangeModel?.(m);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left font-mono transition-colors cursor-pointer
                      ${
                        config.modelName === m
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span>{m}</span>
                    {config.modelName === m && <span className="text-[10px] text-indigo-600 font-sans">선택됨</span>}
                  </button>
                ))}
              </div>
            </div>

            {onChangeTemperature && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 mb-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Sliders className="w-2.5 h-2.5 text-indigo-600" />
                    Temperature
                  </span>
                  <span className="font-mono text-slate-800 font-semibold">{config.temperature ?? 0.7}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature ?? 0.7}
                  onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
