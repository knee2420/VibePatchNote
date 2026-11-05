import { memo, useState } from 'react';
import { Copy, Check, BookOpen } from 'lucide-react';
import type { WebArticlePayload } from '../../../types';

interface WebReaderModeProps {
  article?: WebArticlePayload;
  title: string;
  url: string;
  zoom?: number;
  onExtractText?: (text: string) => void;
}

export const WebReaderMode = memo(function WebReaderMode({
  article,
  title,
  url,
  zoom = 1,
  onExtractText,
}: WebReaderModeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySelection = () => {
    const selection = window.getSelection()?.toString().trim();
    const textToCopy = selection || article?.textContent || '';
    if (!textToCopy) return;

    if (navigator.clipboard) {
      void navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onExtractText?.(textToCopy);
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#fafafa] p-6 text-slate-800 select-text">
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          maxWidth: '720px',
          margin: '0 auto',
        }}
        className="transition-transform duration-100 ease-out"
      >
        {/* 아티클 헤더 */}
        <header className="mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-violet-600 font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{article?.siteName || new URL(url).hostname}</span>
            {article?.publishedTime && (
              <span className="text-slate-400 font-normal">· {article.publishedTime}</span>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-snug">
            {article?.title || title}
          </h1>
          {article?.byline && (
            <p className="text-xs text-slate-500 mt-1.5">{article.byline}</p>
          )}
        </header>

        {/* 본문 콘텐츠 */}
        {article?.contentHtml ? (
          <article
            className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 space-y-4"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        ) : article?.textContent ? (
          <article className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
            {article.textContent}
          </article>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            정제된 아티클 본문이 없습니다. 스냅샷 또는 라이브 뷰를 확인하세요.
          </div>
        )}

        {/* 하단 빠른 복사 플로팅 툴팁 힌트 */}
        <footer className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
          <span>💡 텍스트를 드래그하여 우측 에디터로 발췌할 수 있습니다.</span>
          <button
            type="button"
            onClick={handleCopySelection}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-medium cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            {copied ? '복사 완료' : '전체 복사'}
          </button>
        </footer>
      </div>
    </div>
  );
});

