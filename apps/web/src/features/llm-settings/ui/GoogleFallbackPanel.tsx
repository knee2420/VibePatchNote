import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import type { GoogleModelCategory, GoogleProjectUsage } from '@/entities/llm-configuration';
import { Button, Input, ProviderExecutionBadge, providerExecutionMessage } from '@/shared/ui';

import { type GoogleFallbackSettings, useGoogleFallbackSettings } from '../model/useGoogleFallbackSettings';

const COLLAPSED_ROW_COUNT = 8;

const CATEGORY_LABEL: Record<GoogleModelCategory, string> = {
  text: '텍스트 출력 모델',
  agent: '에이전트',
  image: '이미지 생성',
  speech: '음성 출력',
  live: '라이브·오디오',
  music: '음악 생성',
  transcription: '음성 인식',
};

const TIER_LABEL: Record<GoogleProjectUsage['tier'], string> = {
  free: '무료 tier 기준',
  paid_tier_1: '유료 tier 1 기준',
};

function formatLimit(limit: number): string {
  if (limit < 0) return '무제한';
  return new Intl.NumberFormat('en', {
    notation: limit >= 1_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(limit);
}

/**
 * AI Studio 한도 표의 "사용 / 한도" 칸.
 * 사용량을 알 수 없으면 0 으로 그리지 않습니다 — 막대를 비우고 "—" 로 둡니다.
 */
function LimitCell({ limit }: { limit: number | null }) {
  if (limit === null) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="h-1.5 w-14 rounded-full bg-slate-100 dark:bg-slate-800" />
      <span className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">— / {formatLimit(limit)}</span>
    </div>
  );
}

function usageNotice(usage: GoogleProjectUsage): string {
  if (usage.billingEnabled === false) {
    return 'Google은 결제가 연결된 프로젝트에만 실시간 사용량을 제공합니다. 이 프로젝트는 무료 tier라 한도만 표시합니다.';
  }
  if (usage.billingEnabled === null) {
    return 'Google Cloud Monitoring에서 사용량을 읽지 못해 한도만 표시합니다.';
  }
  return '실시간 사용량 표시는 아직 지원하지 않아 한도만 표시합니다.';
}

function emptyUsageMessage(hasKey: boolean, usage: GoogleProjectUsage | undefined, isLoading: boolean): string | null {
  if (!hasKey) return 'API 키를 저장하면 그 키로 쓸 수 있는 모델의 한도를 보여 드립니다.';
  if (!usage) return isLoading ? '한도를 불러오는 중입니다…' : '새로고침을 눌러 한도를 불러오세요.';
  if (usage.models.length === 0) return '이 API 키로 쓸 수 있는 모델 중 현재 tier에서 제공 중인 모델이 없습니다.';
  return null;
}

/** 보조 API(Google) 설정 탭. 키 · 보조 모델 · 프로젝트 한도를 한 화면에서 다룹니다. */
export function GoogleFallbackPanel() {
  const settings = useGoogleFallbackSettings();
  const { runtime, google, catalog, usage, error } = settings;
  const [apiKey, setApiKey] = useState('');

  const saveKey = async () => {
    if (await settings.saveApiKey(apiKey)) setApiKey('');
  };

  const fallbackModel = runtime?.policy.fallbackModel ?? '';
  // 보조 경로는 문서 분석(구조화 텍스트 출력)을 대신하므로, 한도를 알면 텍스트 모델만 고르게 합니다.
  const choices = usage
    ? usage.models.filter((model) => model.category === 'text').map(({ id, label }) => ({ id, label }))
    : catalog.map(({ id, label }) => ({ id, label }));
  const options =
    !fallbackModel || choices.some((model) => model.id === fallbackModel)
      ? choices
      : [{ id: fallbackModel, label: fallbackModel }, ...choices];

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
          {error}
        </p>
      )}

      <section className={`rounded-xl border p-4 ${google?.configured ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <p className="font-semibold text-slate-900">
          {runtime?.policy.primaryProvider === 'google-api' || runtime?.policy.primaryProvider === 'google_api'
            ? 'Google Direct API (기본 실행 엔진)'
            : 'Google API (보조 Fallback 엔진)'}
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {google?.configured
            ? (runtime?.policy.primaryProvider === 'google-api' || runtime?.policy.primaryProvider === 'google_api'
                ? '설정됨 — 모든 문서 분석 작업이 Google Direct API를 1순위로 즉각 호출합니다.'
                : '설정됨 — AGY 한도가 소진되거나 CLI가 실패하면 이 경로로 분석을 이어갑니다.')
            : '미설정 — Google API 키가 등록되지 않았습니다.'}
        </p>
        {runtime?.nextExecution && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-current/10 pt-3">
            <span className="text-xs font-medium text-slate-600">다음 AI 작업 예상 경로</span>
            <ProviderExecutionBadge
              execution={{ ...runtime.nextExecution, phase: 'running' }}
            />
            <span className="text-xs text-slate-600">
              {providerExecutionMessage({ ...runtime.nextExecution, phase: 'running' })}
            </span>
          </div>
        )}
      </section>

      <section>
        <label className="text-sm font-semibold" htmlFor="google-api-key">Google API key</label>
        <p className="mt-1 text-xs text-slate-500">키 원문은 Windows 자격 증명 저장소에만 보관됩니다.</p>
        <div className="mt-2 flex gap-2">
          <Input
            autoComplete="off"
            className="h-9"
            id="google-api-key"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={google?.configured ? '새 키로 교체하려면 입력' : 'AIza…'}
            type="password"
            value={apiKey}
          />
          <Button disabled={apiKey.trim().length < 10} onClick={() => void saveKey()} size="lg">
            저장
          </Button>
          {google?.configured && (
            <Button onClick={() => void settings.removeApiKey()} size="lg" variant="destructive">
              제거
            </Button>
          )}
        </div>
        {google?.maskedKey && (
          <p className="mt-2 text-xs text-slate-500">
            현재 저장된 키: <span className="font-mono text-slate-700">{google.maskedKey}</span>
          </p>
        )}
      </section>

      {google?.configured && (
        <section>
          <label className="text-sm font-semibold" htmlFor="google-fallback-model">보조 모델</label>
          <p className="mt-1 text-xs text-slate-500">CLI가 실패했을 때 문서 분석에 쓸 모델입니다.</p>
          <select
            className="mt-2 h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            id="google-fallback-model"
            onChange={(event) => void settings.changeFallbackModel(event.target.value)}
            value={fallbackModel}
          >
            {options.map((model) => (
              <option key={model.id} value={model.id}>{model.label}</option>
            ))}
          </select>
          {runtime && (
            <p className="mt-2 text-xs text-slate-500">
              기본 경로: {runtime.policy.primaryProvider} · {runtime.policy.primaryModel}
            </p>
          )}
        </section>
      )}

      <ProjectUsageSection settings={settings} />
    </div>
  );
}

function ProjectUsageSection({ settings }: { settings: GoogleFallbackSettings }) {
  const { status, google, usage, isUsageLoading, runtime } = settings;
  const [clientSecret, setClientSecret] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!status) return null;

  if (!status.clientSecretConfigured) {
    const saveSecret = async () => {
      if (await settings.saveClientSecret(clientSecret)) setClientSecret('');
    };
    return (
      <section className="rounded-xl border p-4">
        <h3 className="font-semibold">Google OAuth 앱 연결</h3>
        <p className="mt-1 text-xs text-slate-500">
          프로젝트 한도를 읽으려면 Google Cloud에서 만든 데스크톱 OAuth 클라이언트의 보안 비밀번호가 필요합니다.
          원문은 Windows 자격 증명 저장소에만 보관됩니다.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            aria-label="OAuth 클라이언트 보안 비밀번호"
            autoComplete="off"
            className="h-9"
            onChange={(event) => setClientSecret(event.target.value)}
            placeholder="GOCSPX-…"
            type="password"
            value={clientSecret}
          />
          <Button disabled={clientSecret.trim().length < 8} onClick={() => void saveSecret()} size="lg">
            저장
          </Button>
        </div>
      </section>
    );
  }

  if (!status.connected) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <h3 className="font-semibold">Google 프로젝트 사용량·한도</h3>
          <p className="mt-1 text-xs text-slate-500">
            Google 계정으로 프로젝트를 연결하면 AI Studio와 같은 RPM·TPM·RPD 한도를 보여 드립니다.
          </p>
        </div>
        <Button onClick={() => void settings.connectProject()} size="lg">Google 프로젝트 연결</Button>
      </section>
    );
  }

  const emptyMessage = emptyUsageMessage(Boolean(google?.configured), usage, isUsageLoading);
  const rows = usage?.models.filter((model) => model.category === 'text') ?? [];
  const visibleRows = isExpanded ? rows : rows.slice(0, COLLAPSED_ROW_COUNT);

  return (
    <section className="overflow-hidden rounded-xl border">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div>
          <h3 className="font-semibold">Google 프로젝트 사용량·한도</h3>
          <p className="mt-1 text-xs text-slate-500">
            이 API 키로 문서 작업에 쓸 수 있는 텍스트 모델만 표시합니다. 조회 결과는 저장하지 않습니다.
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            연결됨 · {status.projectId}
            {usage && ` · ${TIER_LABEL[usage.tier]}`}
          </p>
        </div>
        <Button
          disabled={isUsageLoading || !google?.configured}
          onClick={() => void settings.refreshUsage()}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={isUsageLoading ? 'animate-spin' : undefined} />
          새로고침
        </Button>
      </header>

      {emptyMessage || !usage ? (
        <p className="p-8 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">모델</th>
                  <th className="px-4 py-3 font-medium">카테고리</th>
                  <th className="px-4 py-3 font-medium">RPM</th>
                  <th className="px-4 py-3 font-medium">TPM</th>
                  <th className="px-4 py-3 font-medium">RPD</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr className="border-b last:border-b-0" key={row.id}>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {row.label}
                      {row.id === runtime?.policy.fallbackModel && (
                        <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">
                          보조 모델
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{CATEGORY_LABEL[row.category]}</td>
                    <td className="px-4 py-3.5"><LimitCell limit={row.rpm} /></td>
                    <td className="px-4 py-3.5"><LimitCell limit={row.tpm} /></td>
                    <td className="px-4 py-3.5"><LimitCell limit={row.rpd} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > COLLAPSED_ROW_COUNT && (
            <button
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-center gap-1 border-t py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => setIsExpanded((value) => !value)}
              type="button"
            >
              {isExpanded ? '접기' : `더보기 (${rows.length - COLLAPSED_ROW_COUNT})`}
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          )}
          <p className="border-t bg-slate-50 px-4 py-2.5 text-xs text-slate-500 dark:bg-slate-800/50">
            {usageNotice(usage)}
          </p>
        </>
      )}
    </section>
  );
}
