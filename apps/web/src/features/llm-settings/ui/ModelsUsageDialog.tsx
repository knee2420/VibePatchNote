import { useState } from 'react';
import { X } from 'lucide-react';

import { CliUsagePanel } from './CliUsagePanel';
import { EngineRoutingPanel } from './EngineRoutingPanel';
import { GoogleFallbackPanel } from './GoogleFallbackPanel';

interface ModelsUsageDialogProps {
  onClose: () => void;
}

type Tab = 'routing' | 'cli' | 'fallback';

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'routing', label: '엔진 & 라우팅 설정' },
  { id: 'cli', label: 'CLI 현황' },
  { id: 'fallback', label: 'Google API & 한도' },
];

/** 헤더의 설정 진입점. 엔진 라우팅, CLI 사용 현황, Google API 설정을 탭으로 나눕니다. */
export function ModelsUsageDialog({ onClose }: ModelsUsageDialogProps) {
  const [tab, setTab] = useState<Tab>('routing');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
      <section
        aria-labelledby="models-usage-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" id="models-usage-title">Models &amp; Usage</h2>
            <p className="mt-1 text-sm text-slate-500">실행 엔진 선택, 모델 라우팅, 공급자 한도를 한곳에서 관리합니다.</p>
          </div>
          <button
            aria-label="닫기"
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <nav aria-label="Models & Usage 메뉴" className="mt-5 flex gap-1 border-b" role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              aria-selected={tab === id}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === id ? 'border-indigo-600 font-semibold text-indigo-700 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              key={id}
              onClick={() => setTab(id)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'routing' && <EngineRoutingPanel onNavigateToGoogleTab={() => setTab('fallback')} />}
        {tab === 'cli' && <CliUsagePanel />}
        {tab === 'fallback' && <GoogleFallbackPanel />}
      </section>
    </div>
  );
}
