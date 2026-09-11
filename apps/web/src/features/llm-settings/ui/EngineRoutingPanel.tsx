import { AlertCircle, Check, CheckCircle2, Cpu, Key, RefreshCw, Save, Zap } from 'lucide-react';

import { Button } from '@/shared/ui';

import { useEngineRoutingSettings } from '../model/useEngineRoutingSettings';

interface EngineRoutingPanelProps {
  onNavigateToGoogleTab?: () => void;
}

export function EngineRoutingPanel({ onNavigateToGoogleTab }: EngineRoutingPanelProps) {
  const {
    runtime,
    form,
    isLoading,
    isSaving,
    error,
    message,
    googleConfigured,
    cliAvailable,
    reload,
    selectPrimaryEngine,
    updatePrimaryModel,
    updatePrimaryTimeout,
    toggleFallbackEnabled,
    updateFallbackModel,
    updateFallbackTimeout,
    savePolicy,
  } = useEngineRoutingSettings();

  // 사용 가능한 모델 목록 필터링
  const googleModels = runtime?.models.filter((m) => m.provider === 'google_api' || m.provider === 'google-api') ?? [];
  const cliModels = runtime?.models.filter((m) => m.provider === 'agy_cli' || m.provider === 'agy-cli') ?? [];

  const primaryModelChoices = form.primaryProvider === 'google-api' ? googleModels : cliModels;
  const fallbackModelChoices = form.fallbackProvider === 'google-api' ? googleModels : cliModels;

  return (
    <div className="mt-6 space-y-6">
      {/* 안내 및 오류 메시지 */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">{message}</div>
        </div>
      )}

      {/* 1. 기본 실행 엔진 선택 (카드형 선택 인터페이스) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              1. 기본 실행 엔진 (Primary Engine)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              문서 스캐폴딩 및 아웃라인 분석 시 가장 먼저 호출할 1순위 인터페이스를 지정합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            disabled={isLoading}
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {/* 옵션 A: Google Direct API */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => selectPrimaryEngine('google-api')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectPrimaryEngine('google-api'); }}
            className={`relative flex cursor-pointer flex-col justify-between rounded-xl border-2 p-4 transition-all ${
              form.primaryProvider === 'google-api'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/30'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Google Direct API</h4>
                  <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    초고속 · 권장
                  </span>
                </div>
              </div>
              <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                form.primaryProvider === 'google-api'
                  ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {form.primaryProvider === 'google-api' && <Check className="size-3" />}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              CLI 서브프로세스 기동 없이 Google REST API로 즉각 연결됩니다. PDF/이미지 시각 비전 inlineData를 직접 처리합니다.
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
              <span>인증 상태:</span>
              {googleConfigured ? (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">API 키 등록 완료</span>
              ) : (
                <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <Key className="size-3" /> 키 등록 필요
                </span>
              )}
            </div>
          </div>

          {/* 옵션 B: Antigravity CLI */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => selectPrimaryEngine('agy-cli')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectPrimaryEngine('agy-cli'); }}
            className={`relative flex cursor-pointer flex-col justify-between rounded-xl border-2 p-4 transition-all ${
              form.primaryProvider === 'agy-cli'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/30'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Cpu className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Antigravity CLI</h4>
                  <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    로컬 에이전트
                  </span>
                </div>
              </div>
              <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                form.primaryProvider === 'agy-cli'
                  ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {form.primaryProvider === 'agy-cli' && <Check className="size-3" />}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              로컬에 설치된 <code>agy</code> CLI 서브프로세스를 통해 에이전트 런타임 및 계정 쿼터를 사용합니다.
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
              <span>실행 파일:</span>
              <span className={`font-medium ${cliAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {cliAvailable ? '감지됨 (정상)' : 'CLI 미발견'}
              </span>
            </div>
          </div>
        </div>

        {/* API 키 미등록 경고 알림 및 빠른 이동 */}
        {form.primaryProvider === 'google-api' && !googleConfigured && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <span>Google Direct API를 사용하려면 API 키가 필요합니다.</span>
            {onNavigateToGoogleTab && (
              <button
                type="button"
                onClick={onNavigateToGoogleTab}
                className="font-semibold text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400"
              >
                키 등록 탭으로 이동 →
              </button>
            )}
          </div>
        )}
      </section>

      {/* 2. 메인 실행 모델 및 타임아웃 */}
      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4.5 dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          2. {form.primaryProvider === 'google-api' ? 'Google API' : 'CLI'} 기본 모델 및 타임아웃
        </h3>

        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="primary-model-select" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              분석 모델
            </label>
            <select
              id="primary-model-select"
              value={form.primaryModel}
              onChange={(e) => updatePrimaryModel(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {primaryModelChoices.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.id})
                </option>
              ))}
              {!primaryModelChoices.some((m) => m.id === form.primaryModel) && (
                <option value={form.primaryModel}>{form.primaryModel}</option>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="primary-timeout-input" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              최대 타임아웃 (초)
            </label>
            <input
              id="primary-timeout-input"
              type="number"
              min={15}
              max={600}
              value={form.primaryTimeoutSeconds}
              onChange={(e) => updatePrimaryTimeout(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </section>

      {/* 3. 보조 Fallback 엔진 자동 전환 정책 */}
      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4.5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              3. 장애 및 할당량 소진 시 자동 전환 (Failover / Fallback)
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              주 엔진이 쿼터 초과나 일시 장애로 실패했을 때 자동으로 보조 엔진으로 우회합니다.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={form.fallbackEnabled}
              onChange={(e) => toggleFallbackEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-700"></div>
          </label>
        </div>

        {form.fallbackEnabled && (
          <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-800">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="fallback-model-select" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  보조 엔진 ({form.fallbackProvider === 'google-api' ? 'Google API' : 'CLI'}) 모델
                </label>
                <select
                  id="fallback-model-select"
                  value={form.fallbackModel}
                  onChange={(e) => updateFallbackModel(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {fallbackModelChoices.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.id})
                    </option>
                  ))}
                  {!fallbackModelChoices.some((m) => m.id === form.fallbackModel) && (
                    <option value={form.fallbackModel}>{form.fallbackModel}</option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="fallback-timeout-input" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  보조 타임아웃 (초)
                </label>
                <input
                  id="fallback-timeout-input"
                  type="number"
                  min={15}
                  max={600}
                  value={form.fallbackTimeoutSeconds}
                  onChange={(e) => updateFallbackTimeout(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 저장 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          onClick={() => void savePolicy()}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          정책 저장 및 즉시 적용
        </Button>
      </div>
    </div>
  );
}
