import type { IdeTitleHeaderProps } from '../types';

/**
 * [Primitive] IDE 중앙 타이틀 헤더 부품.
 * 프로젝트/워크스페이스 타이틀과 현재 활성화된 문서명/파일명을 중앙에 표시하며, 긴 텍스트는 말줄임 처리합니다.
 */
export function IdeTitleHeader({
  workspaceTitle = 'VibePatchNote - Antigravity IDE',
  activeFileName,
  children,
  className = '',
}: IdeTitleHeaderProps) {
  return (
    <div
      className={`text-[11px] text-slate-400 font-medium truncate max-w-md hidden md:block select-none ${className}`}
    >
      {children ? (
        children
      ) : (
        <>
          <span>{workspaceTitle}</span>
          {activeFileName && (
            <>
              {' - '}
              <span className="text-slate-200">{activeFileName}</span>
            </>
          )}
        </>
      )}
    </div>
  );
}
