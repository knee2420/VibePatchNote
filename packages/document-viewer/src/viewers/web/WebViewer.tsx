import { memo, useState } from 'react';
import { BookOpen, Globe, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import type { WebViewerProps, WebViewerMode } from '../../types';
import { WebReaderMode } from './modes/WebReaderMode';
import { WebLiveProxyMode } from './modes/WebLiveProxyMode';

export const WebViewer = memo(function WebViewer({
  url,
  title,
  initialMode = 'reader',
  article,
  onExtractText,
}: WebViewerProps) {
  const [mode, setMode] = useState<WebViewerMode>(initialMode === 'snapshot' ? 'reader' : initialMode);
  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-white select-none">
      {/* 웹뷰어 전용 서브 컨트롤 바 */}
      <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
        {/* 모드 전환 탭 세그먼트 (리더 vs 라이브) */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/80 border border-slate-300/70 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('reader')}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
              mode === 'reader'
                ? 'bg-white text-violet-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="본문 리딩 및 텍스트 발췌/선택에 최적화된 리더 뷰"
          >
            <BookOpen className="w-3 h-3" />
            리더
          </button>
          <button
            type="button"
            onClick={() => setMode('live')}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
              mode === 'live'
                ? 'bg-white text-violet-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="실제 웹페이지 라이브 뷰"
          >
            <Globe className="w-3 h-3" />
            라이브
          </button>
        </div>

        {/* 우측 도구: 줌 제어 및 원본 링크 새창 열기 */}
        <div className="flex items-center gap-2 text-slate-500">
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-600"
              title="축소"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-600"
              title="확대"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
          <div className="w-px h-3 bg-slate-300" />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-200 text-[11px] text-slate-600 transition"
            title="브라우저 새 창에서 원본 웹사이트 열기"
          >
            <span>원본 열기</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* 모드별 뷰포트 마운트 */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
        {mode === 'reader' && (
          <WebReaderMode
            article={article}
            title={title}
            url={url}
            zoom={zoom}
            onExtractText={onExtractText}
          />
        )}
        {mode === 'live' && (
          <WebLiveProxyMode
            url={url}
            title={title}
            onSwitchToReader={() => setMode('reader')}
          />
        )}
      </div>
    </div>
  );
});
