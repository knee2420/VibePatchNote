import { memo, useState } from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';

interface WebLiveProxyModeProps {
  url: string;
  title: string;
  onSwitchToReader?: () => void;
  onSwitchToSnapshot?: () => void;
}

export const WebLiveProxyMode = memo(function WebLiveProxyMode({
  url,
  title,
  onSwitchToReader,
  onSwitchToSnapshot,
}: WebLiveProxyModeProps) {
  const [showNotice, setShowNotice] = useState(true);

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative bg-white">
      {/* CSP / X-Frame-Options 차단 대비 상단 스마트 가이드 배너 */}
      {showNotice && (
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              웹사이트의 보안 정책(X-Frame-Options)으로 인해 화면이 보이지 않으면 모드를 전환하세요.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onSwitchToReader && (
              <button
                type="button"
                onClick={onSwitchToReader}
                className="font-bold underline text-violet-700 hover:text-violet-800 cursor-pointer"
              >
                리더 뷰
              </button>
            )}
            {onSwitchToSnapshot && (
              <button
                type="button"
                onClick={onSwitchToSnapshot}
                className="font-bold underline text-violet-700 hover:text-violet-800 cursor-pointer"
              >
                스냅샷 뷰
              </button>
            )}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-slate-500 hover:text-slate-800"
              title="새 창에서 원본 열기"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              className="text-slate-400 hover:text-slate-600 px-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 샌드박스 라이브 웹뷰 */}
      <iframe
        src={url}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        className="flex-1 w-full h-full border-none pointer-events-auto bg-white"
      />
    </div>
  );
});

