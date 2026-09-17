import { useState, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  FileText,
  Image as ImageIcon,
  Code2,
  File,
  Folder,
  Sparkles,
  Maximize2,
  Minimize2,
  MapPin,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import type { ResourceItem, ResourceProvenanceInfo } from '../model/types';
import { A4DocumentViewer } from './A4DocumentViewer';

export interface IdeResourceModalProps {
  resource: ResourceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInEditor?: (resource: ResourceItem) => void;
  width?: number;
  onMouseDownResizer?: (e: React.MouseEvent) => void;
  provenance?: ResourceProvenanceInfo | null;
}

export function IdeResourceModal({
  resource,
  isOpen,
  onClose,
  onOpenInEditor,
  width = 620,
  onMouseDownResizer,
  provenance,
}: IdeResourceModalProps) {
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // 포맷별 아이콘
  const renderFormatIcon = (format: string) => {
    const f = format.toLowerCase();
    switch (f) {
      case 'json':
        return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'md':
      case 'markdown':
      case 'txt':
        return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'svg':
      case 'png':
      case 'jpg':
      case 'webp':
        return <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <Code2 className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'html':
        return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
      case 'hwp':
        return <FileText className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'pdf':
        return <File className="w-4 h-4 text-red-400 shrink-0" />;
      default:
        return <FileCode className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // 내용 복사 핸들러
  const handleCopyContent = () => {
    if (!resource?.content) return;
    navigator.clipboard.writeText(resource.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 코드 줄 번호 생성
  const codeLines = useMemo(() => {
    if (!resource?.content) return [];
    return resource.content.split('\n');
  }, [resource?.content]);

  if (!isOpen || !resource) {
    return null;
  }

  const format = resource.format.toLowerCase();
  const isBinaryDoc = ['hwp', 'pdf', 'docx'].includes(format);
  const isSvg = format === 'svg';
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(format) || (!!resource.thumbnailUrl && !isSvg);
  const isCodeOrJson = ['json', 'ts', 'tsx', 'js', 'jsx', 'html', 'css'].includes(format);
  const isMarkdown = ['md', 'markdown', 'txt'].includes(format);

  const effectiveWidth = isMaximized ? Math.max(width, 860) : width;

  return (
    <div
      style={{ width: `${effectiveWidth}px` }}
      className="fixed right-0 top-9 bottom-6 z-40 bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-200 select-none font-sans"
    >
      {/* 좌측 마우스 리사이저 핸들 */}
      {onMouseDownResizer && (
        <div
          onMouseDown={onMouseDownResizer}
          className="absolute left-0 top-0 bottom-0 w-1.5 -ml-1 cursor-col-resize z-50 hover:bg-indigo-500 transition-colors flex items-center justify-center group"
          title="드래그하여 모달 너비 조절"
        >
          <div className="w-[1px] h-full bg-slate-800 group-hover:bg-indigo-400" />
        </div>
      )}

      {/* 1. 상단 헤더 (헵타베이스 스타일 카드/문서 헤더) */}
      <div className="h-10 px-3.5 border-b border-slate-800/90 flex items-center justify-between shrink-0 bg-slate-950/60">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {renderFormatIcon(resource.format)}
          <span className="text-xs font-bold text-slate-100 truncate" title={resource.name}>
            {resource.name}
          </span>
          {resource.bundleName && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-emerald-400 border border-slate-700/50 font-mono shrink-0 truncate max-w-[120px]">
              {resource.bundleName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {/* 복사 버튼 */}
          {resource.content && !isBinaryDoc && (
            <button
              type="button"
              onClick={handleCopyContent}
              className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              title="내용 복사"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* 창 너비 토글 버튼 (헵타베이스 스타일 와이드 뷰) */}
          <button
            type="button"
            onClick={() => setIsMaximized((prev) => !prev)}
            className="p-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer"
            title={isMaximized ? '기본 너비로 복원' : '와이드 패널로 확장'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 중앙 에디터로 확장/열기 버튼 */}
          {onOpenInEditor && (
            <button
              type="button"
              onClick={() => onOpenInEditor(resource)}
              className="p-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              title="중앙 에디터 탭으로 열기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 모달 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer ml-0.5"
            title="모달 닫기 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 메타 정보 서브 바 */}
      <div className="px-3.5 py-1.5 border-b border-slate-800/50 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
        <div className="flex items-center gap-2 truncate">
          <Folder className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate text-slate-400" title={resource.path}>
            {resource.path}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-slate-500">
          <span>{resource.size}</span>
          <span>•</span>
          <span>{resource.updatedAt}</span>
        </div>
      </div>

      {/* 2-1. 출처 표시 (Provenance Inspector Banner) */}
      {provenance && (
        <div className="mx-3.5 mt-2.5 p-3 rounded-xl bg-gradient-to-br from-indigo-950/90 via-slate-900/95 to-slate-950 border border-indigo-500/40 shadow-xl text-xs space-y-2.5 shrink-0 select-text animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-indigo-200">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs tracking-wide">출처 표시 (Provenance Info)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>신뢰도 {provenance.confidence}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-mono text-[10px] border border-indigo-500/40">
                슬롯 #{provenance.slotNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-indigo-500/20">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-400">매핑 슬롯:</span>
              <span className="font-semibold text-slate-100">
                #{provenance.slotNumber} {provenance.slotLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">인용 위치:</span>
              <span className="font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 shadow-inner">
                {provenance.sourceName} - {provenance.sourceLocation}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] font-mono space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-400" />
                <span>원문 발췌 내용</span>
              </span>
              <span className="text-emerald-400/90 text-[9px]">✓ Provenance Verified</span>
            </div>
            <p className="text-emerald-300 font-medium whitespace-pre-wrap leading-relaxed">
              "{provenance.value || provenance.highlightText}"
            </p>
          </div>
        </div>
      )}

      {/* 3. 본문 뷰어 영역 (헵타베이스 스타일 실물 뷰어) */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin text-slate-200">
        {/* A. 문서 (HWP/PDF/DOCX) - 헵타베이스 스타일 A4 실물 서식/슬라이드 원본 뷰어 */}
        {isBinaryDoc && (
          <A4DocumentViewer resource={resource} onOpenInEditor={onOpenInEditor} />
        )}

        {/* B. 풀사이즈 이미지 뷰어 (PNG/JPG/WEBP) */}
        {isImage && (
          <div className="h-full flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-lg border border-slate-850">
            <div className="max-w-full max-h-[520px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-2xl flex items-center justify-center">
              <img
                src={resource.thumbnailUrl || resource.path}
                alt={resource.name}
                className="max-w-full max-h-[480px] object-contain rounded"
              />
            </div>
            <p className="mt-3 text-xs text-slate-400 font-mono text-center">
              {resource.name} ({resource.size})
            </p>
          </div>
        )}

        {/* C. SVG 에셋 실물 그래픽 뷰어 */}
        {isSvg && resource.content && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center min-h-[200px]">
              <div
                className="max-w-full max-h-64"
                dangerouslySetInnerHTML={{ __html: resource.content }}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>SVG 소스 코드</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                {resource.content}
              </pre>
            </div>
          </div>
        )}

        {/* C. 코드 / JSON 뷰어 (줄 번호 포함) */}
        {isCodeOrJson && resource.content && (
          <div className="rounded-lg border border-slate-800/90 bg-slate-950/90 overflow-hidden text-[12px] font-mono shadow-inner">
            <div className="flex select-text overflow-x-auto">
              <div className="py-2.5 px-2 bg-slate-900/60 border-r border-slate-800 text-slate-600 text-right select-none font-mono text-[11px] shrink-0">
                {codeLines.map((_, idx) => (
                  <div key={idx} className="h-5 leading-5">
                    {idx + 1}
                  </div>
                ))}
              </div>
              <div className="py-2.5 px-3 flex-1 overflow-x-auto">
                {codeLines.map((line, idx) => (
                  <div key={idx} className="h-5 leading-5 whitespace-pre text-slate-300">
                    {line || ' '}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* D. 마크다운 / 텍스트 뷰어 */}
        {isMarkdown && resource.content && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono select-text">
              {resource.content}
            </div>
          </div>
        )}

        {/* E. 본문이 없는 경우 안내 */}
        {!isBinaryDoc && !resource.content && (
          <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs gap-2">
            <FileCode className="w-8 h-8 text-slate-600" />
            <p>표시할 텍스트 내용이 없거나 로딩되지 않았습니다.</p>
          </div>
        )}
      </div>

      {/* 4. 하단 닫기 안내 바 */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <span>💡 Esc 키를 누르거나 X 버튼으로 닫을 수 있습니다.</span>
        {onOpenInEditor && (
          <button
            type="button"
            onClick={() => onOpenInEditor(resource)}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>에디터로 보내기</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
