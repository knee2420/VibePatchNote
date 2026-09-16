import { useState, useCallback } from 'react';
import { Copy, Terminal, Check } from 'lucide-react';

interface McpMarkdownPanelProps {
  markdown: string;
  renderExtraTab?: () => React.ReactNode;
  extraTabLabel?: string;
}

/**
 * 에이전트/MCP 실시간 마크다운 연동 뷰 패널.
 * 문서의 최신 마크다운 직렬화 결과를 표시하고 클립보드로 복사할 수 있습니다.
 */
export function McpMarkdownPanel({
  markdown,
  renderExtraTab,
  extraTabLabel,
}: McpMarkdownPanelProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'markdown' | 'extra'>('markdown');

  const handleCopyMarkdown = useCallback(() => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdown]);

  return (
    <aside className="w-80 border-l border-slate-800/80 bg-slate-900/60 p-4 flex flex-col shrink-0 h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>에이전트 MCP Markdown</span>
        </div>
        <button
          type="button"
          onClick={handleCopyMarkdown}
          className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
          title="마크다운 복사"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? '복사됨!' : '복사'}</span>
        </button>
      </div>

      {extraTabLabel && renderExtraTab && (
        <div className="mt-3 flex gap-1 rounded-lg bg-slate-800 p-1 text-[10px] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`flex-1 rounded px-2 py-1 transition-colors cursor-pointer ${
              activeTab === 'markdown' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            Markdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('extra')}
            className={`flex-1 rounded px-2 py-1 transition-colors cursor-pointer ${
              activeTab === 'extra' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            {extraTabLabel}
          </button>
        </div>
      )}

      {activeTab === 'markdown' ? (
        <div className="flex-1 flex flex-col min-h-0 mt-2">
          <p className="text-[10px] text-slate-500 mb-2 shrink-0">
            에이전트가 MCP 도구로 읽고 쓸 순수 마크다운 데이터입니다.
          </p>
          <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-800/80 font-mono text-[11px] text-slate-300 leading-relaxed overflow-y-auto whitespace-pre-wrap selection:bg-purple-500/30">
            {markdown || '(작성된 내용이 없습니다)'}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 mt-3 overflow-y-auto pr-1">
          {renderExtraTab ? renderExtraTab() : null}
        </div>
      )}
    </aside>
  );
}
