import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock3, KeyRound, RefreshCw, XCircle } from 'lucide-react';

import { llmConfigurationApi, type RuntimeDashboard } from '@/entities/llm-configuration';
import { notifyLlmSettingsChanged, OPEN_LLM_SETTINGS_EVENT } from '@/shared/lib/llmSettingsEvent';

import { ModelsUsageDialog } from './ModelsUsageDialog';

/** 헤더 설정 진입점은 현재 계정의 실시간 모델 사용량만 보여준다. */
export function LlmSettingsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openDialog = () => setOpen(true);
    window.addEventListener(OPEN_LLM_SETTINGS_EVENT, openDialog);
    return () => window.removeEventListener(OPEN_LLM_SETTINGS_EVENT, openDialog);
  }, []);

  return open ? <ModelsUsageDialog onClose={() => setOpen(false)} /> : null;
}

/** 상세 provider 정책 UI. 별도 설정 진입점으로 재배치하기 전까지 보존한다. */
export function LegacyLlmSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [dashboard, setDashboard] = useState<RuntimeDashboard>();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try { setDashboard(await llmConfigurationApi.runtime()); setMessage(''); }
    catch { setMessage('AI Runtime 상태를 불러오지 못했습니다. API 서버 연결을 확인해 주세요.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const openDialog = () => setOpen(true);
    window.addEventListener(OPEN_LLM_SETTINGS_EVENT, openDialog);
    return () => window.removeEventListener(OPEN_LLM_SETTINGS_EVENT, openDialog);
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  if (!open) return null;
  const save = async () => {
    setMessage('');
    try {
      await llmConfigurationApi.saveGoogleApiKey(apiKey);
      setApiKey(''); setMessage('Google API 키를 안전하게 저장했습니다.'); notifyLlmSettingsChanged(); await refresh();
    } catch { setMessage('키를 저장하지 못했습니다. 키를 확인한 뒤 다시 시도해 주세요.'); }
  };
  const remove = async () => {
    await llmConfigurationApi.removeGoogleApiKey();
    setMessage('저장된 Google API 키를 제거했습니다.'); notifyLlmSettingsChanged(); await refresh();
  };
  const updatePolicy = (key: keyof RuntimeDashboard['policy'], value: string | number) => {
    setDashboard((current) => current ? { ...current, policy: { ...current.policy, [key]: value } } : current);
  };
  const savePolicy = async () => {
    if (!dashboard) return;
    try { await llmConfigurationApi.updatePolicy(dashboard.policy); setMessage('실행 정책을 다음 분석부터 적용합니다.'); await refresh(); }
    catch { setMessage('실행 정책을 저장하지 못했습니다. 모델과 timeout 값을 확인해 주세요.'); }
  };
  const copyBridgeCommand = async () => {
    if (!dashboard) return;
    await navigator.clipboard.writeText(dashboard.agyStatusBridgeCommand);
    setMessage('AGY status-line 연결 명령을 클립보드에 복사했습니다.');
  };
  const installAgyStatusLine = async () => {
    try {
      const result = await llmConfigurationApi.installAgyStatusLine();
      setMessage(`AGY status-line을 자동 등록했습니다: ${result.settingsFile}`);
      await refresh();
    } catch {
      setMessage('AGY status-line 자동 등록에 실패했습니다. 기존 AGY settings.json 형식을 확인해 주세요.');
    }
  };
  const policy = dashboard?.policy;
  const google = dashboard?.providers.find((provider) => provider.id === 'google-api');
  const agyStatus = dashboard?.agyStatus;
  const quotaEntries = Object.entries(agyStatus?.quota ?? {});
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
    <section role="dialog" aria-modal="true" className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-slate-900">
      <header className="sticky top-0 flex items-start justify-between border-b bg-white p-6 dark:bg-slate-900"><div><h2 className="text-lg font-bold">AI Runtime</h2><p className="mt-1 text-sm text-slate-600">실행 경로, 모델, 공급자 상태와 fallback 정책을 관리합니다.</p></div><div className="flex gap-2"><button onClick={() => void refresh()} className="rounded p-2 hover:bg-slate-100"><RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} /></button><button onClick={() => setOpen(false)} className="rounded p-2 hover:bg-slate-100">×</button></div></header>
      <div className="space-y-6 p-6">{message && <p className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm">{message}</p>}
        <section><h3 className="mb-3 text-sm font-semibold">공급자 상태</h3><div className="grid gap-3 md:grid-cols-2">{dashboard?.providers.map((provider) => <article key={provider.id} className={`rounded-lg border p-4 ${provider.available ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><div className="flex justify-between"><div><p className="font-semibold">{provider.label}</p><p className="mt-1 text-xs">{provider.role === 'primary' ? '기본 실행 경로' : '보조 fallback 경로'}</p></div>{provider.available ? <CheckCircle2 className="size-5 text-emerald-700" /> : <XCircle className="size-5 text-amber-700" />}</div><dl className="mt-3 space-y-1 text-xs"><div className="flex justify-between"><dt>설정</dt><dd>{provider.configured ? '완료' : '필요'}</dd></div><div className="flex justify-between"><dt>현재 상태</dt><dd>{provider.available ? '사용 가능' : provider.blockedReason || '사용 불가'}</dd></div>{provider.recoversIn && <div className="flex justify-between"><dt>복구 예정</dt><dd>{provider.recoversIn}</dd></div>}</dl></article>)}</div></section>
        {policy && <section><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">실행 정책</h3><button onClick={() => void savePolicy()} className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white">정책 저장</button></div><div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm md:grid-cols-2"><label><p className="font-medium">1. {policy.primaryProvider}</p><select value={policy.primaryModel} onChange={(event) => updatePolicy('primaryModel', event.target.value)} className="mt-2 w-full rounded border bg-white p-2">{dashboard?.models.filter((model) => model.provider === 'agy_cli').map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}</select><input value={policy.primaryTimeoutSeconds} onChange={(event) => updatePolicy('primaryTimeoutSeconds', Number(event.target.value))} type="number" min="15" max="600" className="mt-2 w-full rounded border bg-white p-2" /></label><label><p className="font-medium">2. {policy.fallbackProvider}</p><input value={policy.fallbackModel} onChange={(event) => updatePolicy('fallbackModel', event.target.value)} className="mt-2 w-full rounded border bg-white p-2" /><input value={policy.fallbackTimeoutSeconds} onChange={(event) => updatePolicy('fallbackTimeoutSeconds', Number(event.target.value))} type="number" min="15" max="600" className="mt-2 w-full rounded border bg-white p-2" /></label></div></section>}
        <section><h3 className="mb-3 text-sm font-semibold">사용 가능 모델</h3><div className="overflow-hidden rounded-lg border"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">모델</th><th>경로</th><th>입력 한도</th><th>출력 한도</th></tr></thead><tbody>{dashboard?.models.map((model) => <tr key={`${model.provider}-${model.id}`} className="border-t"><td className="p-3 font-medium">{model.label}</td><td>{model.provider}</td><td>{model.inputTokenLimit?.toLocaleString() ?? '공급자 조회 필요'}</td><td>{model.outputTokenLimit?.toLocaleString() ?? '공급자 조회 필요'}</td></tr>)}</tbody></table></div></section>
        <section className="rounded-lg border p-4"><div className="flex gap-2"><Activity className="mt-0.5 size-4 text-indigo-600" /><div><h3 className="text-sm font-semibold">AGY 사용량 · 컨텍스트</h3><p className="mt-1 text-sm text-slate-600">AGY TUI가 보낸 실제 status-line 값만 표시합니다. API 키의 사용량을 추측하지 않습니다.</p></div></div>{agyStatus ? <div className="mt-3 space-y-3 text-sm"><div className="grid gap-2 sm:grid-cols-3"><p>활성 모델: <b>{agyStatus.model.display_name || agyStatus.model.id || '수신 대기'}</b></p><p>에이전트: <b>{agyStatus.agentState || '알 수 없음'}</b></p><p>실행 모드: <b>{agyStatus.executionMode || '수신 대기'}</b></p><p>컨텍스트 사용: <b>{typeof agyStatus.contextWindow.used_percentage === 'number' ? `${Math.round(agyStatus.contextWindow.used_percentage)}%` : '수신 대기'}</b></p><p>컨텍스트 잔여: <b>{typeof agyStatus.contextWindow.remaining_percentage === 'number' ? `${Math.round(agyStatus.contextWindow.remaining_percentage)}%` : '수신 대기'}</b></p><p>백그라운드 작업: <b>{typeof agyStatus.taskCount === 'number' ? agyStatus.taskCount : '수신 대기'}</b></p></div>{quotaEntries.length > 0 ? <div className="overflow-hidden rounded border"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-2">모델/버킷</th><th>잔여</th><th>초기화</th></tr></thead><tbody>{quotaEntries.map(([bucket, quota]) => <tr key={bucket} className="border-t"><td className="p-2">{bucket}</td><td>{typeof quota.remaining_fraction === 'number' ? `${Math.round(quota.remaining_fraction * 100)}%` : '수신 대기'}</td><td>{typeof quota.reset_in_seconds === 'number' ? `${Math.ceil(quota.reset_in_seconds / 60)}분 뒤` : quota.reset_time || '공급자 정보 없음'}</td></tr>)}</tbody></table></div> : <p className="text-xs text-slate-500">AGY가 quota 버킷을 아직 보내지 않았습니다.</p>}<p className="text-xs text-slate-500">CLI {agyStatus.cliVersion || '버전 수신 대기'} · {agyStatus.planTier || '플랜 수신 대기'} · 산출물 {agyStatus.artifactCount ?? '수신 대기'}개{agyStatus.exceeds200kTokens ? ' · 200K 컨텍스트 초과' : ''}</p></div> : <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs"><p>아직 AGY status-line 연결이 없습니다. 자동 등록하면 다음 AGY 상태 변경부터 실제 값이 표시됩니다.</p><div className="mt-2 flex gap-2"><button className="rounded bg-indigo-600 px-3 py-2 text-xs text-white" onClick={() => void installAgyStatusLine()}>자동 등록</button><button className="rounded border px-3 py-2 text-xs" onClick={() => void copyBridgeCommand()}>명령 복사</button></div><p className="mt-2">상세 quota는 AGY에서 <code>/usage</code>, Premium credit 잔액은 <code>/credits</code>로 갱신·확인할 수 있습니다.</p></div>}<p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="size-3" />{dashboard?.agyStatusLineInstalled ? 'AGY status-line 자동 등록 완료' : dashboard?.quotaNotice || '상태를 불러오는 중입니다.'}</p></section>
        <section className="rounded-lg border p-4"><div className="flex items-center gap-2"><KeyRound className="size-4 text-indigo-600" /><h3 className="text-sm font-semibold">Google API 보조 경로</h3></div><p className="mt-1 text-xs text-slate-600">키 원문은 Windows 자격 증명 저장소에만 보관됩니다.</p><div className="mt-3 flex gap-2"><input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" autoComplete="off" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" placeholder={google?.configured ? '새 키로 교체하려면 입력' : 'AIza…'} /><button onClick={() => void save()} disabled={apiKey.trim().length < 10} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-40">저장</button>{google?.configured && <button onClick={() => void remove()} className="rounded px-3 py-2 text-sm text-rose-700">제거</button>}</div></section>
      </div>
    </section>
  </div>;
}
