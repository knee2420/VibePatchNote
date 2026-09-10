import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { llmConfigurationApi, type AgyUsage, type GoogleApiModel, type RuntimeDashboard } from '@/entities/llm-configuration';

interface AgyUsageDialogProps {
  onClose: () => void;
}

const POPULAR_GOOGLE_MODEL_IDS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemma-3-27b-it',
  'gemma-3-12b-it',
];

const POPULAR_MODEL_COUNT = 8;

function resetText(value: string | null | undefined) {
  if (!value) return '적용되지 않음';
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function orderByGeneralPopularity(models: GoogleApiModel[]): GoogleApiModel[] {
  // 개인별 사용 기록은 저장하거나 읽지 않는다. 이 순서는 일반적인 모델 인지도만 반영한다.
  return [...models].sort((left, right) => {
    const leftRank = POPULAR_GOOGLE_MODEL_IDS.indexOf(left.id.toLowerCase());
    const rightRank = POPULAR_GOOGLE_MODEL_IDS.indexOf(right.id.toLowerCase());
    const normalizedLeftRank = leftRank === -1 ? Number.MAX_SAFE_INTEGER : leftRank;
    const normalizedRightRank = rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank;

    return normalizedLeftRank - normalizedRightRank || left.label.localeCompare(right.label, 'en');
  });
}

export function AgyUsageDialog({ onClose }: AgyUsageDialogProps) {
  const [usage, setUsage] = useState<AgyUsage>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'usage' | 'fallback'>('usage');
  const [runtime, setRuntime] = useState<RuntimeDashboard>();
  const [apiKey, setApiKey] = useState('');
  const [googleModels, setGoogleModels] = useState<GoogleApiModel[]>([]);
  const [isModelListExpanded, setIsModelListExpanded] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      setUsage(await llmConfigurationApi.usage());
    } catch {
      setError('AGY 사용량을 읽지 못했습니다. CLI 로그인 상태를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const openFallbackSettings = async () => {
    setTab('fallback');
    setLoading(true);
    setError('');
    try {
      const dashboard = await llmConfigurationApi.runtime();
      setRuntime(dashboard);
      if (dashboard.providers.some((provider) => provider.id === 'google-api' && provider.configured)) {
        setGoogleModels((await llmConfigurationApi.googleModels()).models);
      }
    }
    catch { setError('보조 API 설정 상태를 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  };

  const saveGoogleKey = async () => {
    try {
      await llmConfigurationApi.saveGoogleApiKey(apiKey);
      setApiKey('');
      const dashboard = await llmConfigurationApi.runtime();
      setRuntime(dashboard);
      setGoogleModels((await llmConfigurationApi.googleModels()).models);
    } catch { setError('Google API 키를 저장하지 못했습니다. 키를 확인해 주세요.'); }
  };

  const removeGoogleKey = async () => {
    try {
      await llmConfigurationApi.removeGoogleApiKey();
      setRuntime(await llmConfigurationApi.runtime());
    } catch { setError('Google API 키를 제거하지 못했습니다.'); }
  };

  const google = runtime?.providers.find((provider) => provider.id === 'google-api');
  const orderedGoogleModels = orderByGeneralPopularity(googleModels);
  const visibleGoogleModels = isModelListExpanded
    ? orderedGoogleModels
    : orderedGoogleModels.slice(0, POPULAR_MODEL_COUNT);
  const selectGoogleModel = async (model: string) => {
    if (!runtime) return;
    try {
      await llmConfigurationApi.updatePolicy({ ...runtime.policy, fallbackModel: model });
      setRuntime(await llmConfigurationApi.runtime());
    } catch { setError('fallback 모델을 변경하지 못했습니다.'); }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
    <section aria-modal="true" className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900" role="dialog">
      <header className="flex items-start justify-between"><div><div className="flex items-center gap-2"><h2 className="text-xl font-bold">Models &amp; Usage</h2><button aria-label="사용량 새로고침" className="rounded p-1 hover:bg-slate-100" onClick={() => void refresh()}><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></button></div><p className="mt-1 text-sm text-slate-500">현재 AGY 계정의 모델 quota를 직접 조회합니다.</p></div><button aria-label="닫기" className="rounded p-2 hover:bg-slate-100" onClick={onClose}>×</button></header>
      <nav className="mt-6 flex gap-1 border-b" aria-label="AI Runtime 메뉴"><button className={`border-b-2 px-3 py-2 text-sm ${tab === 'usage' ? 'border-indigo-600 font-semibold text-indigo-700' : 'border-transparent text-slate-500'}`} onClick={() => setTab('usage')}>사용량</button><button className={`border-b-2 px-3 py-2 text-sm ${tab === 'fallback' ? 'border-indigo-600 font-semibold text-indigo-700' : 'border-transparent text-slate-500'}`} onClick={() => void openFallbackSettings()}>보조 API 설정</button></nav>
      <div className="mt-6 space-y-6">{error && <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{tab === 'usage' ? usage?.groups.map((group) => <section key={group.name}><h3 className="mb-2 text-sm font-semibold">{group.name}</h3><div className="overflow-hidden rounded-lg border">{group.buckets.map((bucket) => { const percentage = Math.round(bucket.remaining_fraction * 100); return <article className="border-b p-4 last:border-b-0" key={bucket.id}><div className="flex items-center justify-between gap-4"><div><p className="font-medium">{bucket.name}</p><p className="mt-1 text-xs text-slate-500">{bucket.disabled ? '현재 적용되지 않음' : bucket.description || `다음 초기화: ${resetText(bucket.reset_time)}`}</p></div><div className="flex items-center gap-3"><b>{bucket.disabled ? '—' : `${percentage}%`}</b><span className="block size-8 rounded-full" style={{ background: `conic-gradient(#3f8c45 ${percentage}%, #d1d5db ${percentage}%)` }} /></div></div></article>; })}</div></section>) : <section className="space-y-4"><div className={`rounded-lg border p-4 ${google?.configured ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><p className="font-semibold">Google API fallback</p><p className="mt-1 text-sm">{google?.configured ? '설정됨 — AGY quota가 소진되거나 CLI가 실패하면 이 경로를 사용합니다.' : '미설정 — AGY quota가 소진되면 분석을 계속할 수 없습니다.'}</p></div><div><label className="text-sm font-medium" htmlFor="google-api-key">Google API key</label><p className="mt-1 text-xs text-slate-500">키 원문은 Windows 자격 증명 저장소에만 보관됩니다.</p><div className="mt-2 flex gap-2"><input id="google-api-key" autoComplete="off" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" onChange={(event) => setApiKey(event.target.value)} placeholder={google?.configured ? '새 키로 교체하려면 입력' : 'AIza…'} type="password" value={apiKey} /><button className="rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-40" disabled={apiKey.trim().length < 10} onClick={() => void saveGoogleKey()}>저장</button>{google?.configured && <button className="rounded border border-rose-200 px-3 py-2 text-sm text-rose-700" onClick={() => void removeGoogleKey()}>제거</button>}</div>{google?.maskedKey && <p className="mt-2 text-xs text-slate-500">현재 저장된 키: <span className="font-mono text-slate-700">{google.maskedKey}</span></p>}</div>{google?.configured && <section><div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">이 API key에서 사용 가능한 모델</h3><p className="mt-1 text-xs text-slate-500">기본 8개는 일반적인 사용 인지도 기준이며, 개인 사용 기록은 수집하지 않습니다.</p></div>{googleModels.length > POPULAR_MODEL_COUNT && <button aria-expanded={isModelListExpanded} className="shrink-0 rounded border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={() => setIsModelListExpanded((expanded) => !expanded)}>{isModelListExpanded ? '접기' : `전체 ${googleModels.length}개 보기`}</button>}</div><select className="w-full rounded border bg-white p-2 text-sm" onChange={(event) => void selectGoogleModel(event.target.value)} value={runtime?.policy.fallbackModel}>{orderedGoogleModels.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}</select><div className="mt-2 overflow-hidden rounded border"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-2">모델</th><th>입력</th><th>출력</th></tr></thead><tbody>{visibleGoogleModels.map((model) => <tr className="border-t" key={model.id}><td className="p-2">{model.label}</td><td>{model.inputTokenLimit?.toLocaleString() ?? '—'}</td><td>{model.outputTokenLimit?.toLocaleString() ?? '—'}</td></tr>)}</tbody></table></div><p className="mt-2 text-xs text-slate-500">RPM·TPM·RPD 및 현재 잔여량은 API key가 아닌 Google 프로젝트/tier 권한 값입니다. 프로젝트 OAuth 연동을 추가하면 실제 quota를 표시할 수 있습니다.</p></section>}<p className="rounded bg-slate-50 p-3 text-xs text-slate-600">현재 기본 경로: {runtime?.policy.primaryProvider} · {runtime?.policy.primaryModel}<br />보조 모델: {runtime?.policy.fallbackModel}</p></section>}</div>
    </section>
  </div>;
}
