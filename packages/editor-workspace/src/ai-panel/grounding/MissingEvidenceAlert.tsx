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
    <div className={`flex flex-col gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 shadow-2xs ${className}`}>
      <div className="flex items-center gap-1.5 font-bold text-amber-800">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>근거 보강 필요 항목</span>
      </div>

      {unverifiedStatements.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-800">미검증 진술:</span>
          {unverifiedStatements.map((stmt, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-1 p-1.5 rounded-lg bg-white border border-amber-200/80 text-[11px] text-slate-700 shadow-2xs"
            >
              <span className="flex-1 leading-relaxed">"{stmt}"</span>
              {onAddEvidenceRequest && (
                <button
                  type="button"
                  onClick={() => onAddEvidenceRequest(stmt)}
                  title="이 진술에 대한 원문 근거 추가 탐색 요청"
                  className="shrink-0 p-0.5 rounded text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {missingRequirements && missingRequirements.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-amber-200">
          <span className="text-[10px] uppercase font-bold text-amber-800">루브릭 누락 항목:</span>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
            {missingRequirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
