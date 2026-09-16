import { memo } from 'react';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import type { MissingEvidenceAlertProps } from './types';

/**
 * MissingEvidenceAlert (근거 누락 및 미검증 진술 알림)
 *
 * 원본 리소스에서 근거를 찾지 못한 진술이나 필수 누락 요구조건을 안내합니다.
 */
export const MissingEvidenceAlert = memo(function MissingEvidenceAlert({
  unverifiedStatements,
  missingRequirements,
  onAddEvidenceRequest,
  className = '',
}: MissingEvidenceAlertProps) {
  if (
    (!unverifiedStatements || unverifiedStatements.length === 0) &&
    (!missingRequirements || missingRequirements.length === 0)
  ) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 ${className}`}>
      <div className="flex items-center gap-1.5 font-bold text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>근거 보강 필요 항목</span>
      </div>

      {unverifiedStatements.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400/80">미검증 진술:</span>
          {unverifiedStatements.map((stmt, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-1 p-1.5 rounded bg-slate-900/60 border border-amber-900/40 text-[11px]"
            >
              <span className="flex-1 opacity-90 leading-relaxed">"{stmt}"</span>
              {onAddEvidenceRequest && (
                <button
                  type="button"
                  onClick={() => onAddEvidenceRequest(stmt)}
                  title="이 진술에 대한 원문 근거 추가 탐색 요청"
                  className="shrink-0 p-0.5 rounded text-amber-400 hover:text-amber-200 hover:bg-amber-950 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {missingRequirements && missingRequirements.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-amber-900/40">
          <span className="text-[10px] uppercase font-bold text-amber-400/80">루브릭 누락 항목:</span>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
            {missingRequirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
