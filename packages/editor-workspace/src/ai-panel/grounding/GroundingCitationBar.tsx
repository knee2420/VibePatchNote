import { memo } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { FaithfulnessScoreCard } from './FaithfulnessScoreCard';
import { MissingEvidenceAlert } from './MissingEvidenceAlert';
import type { GroundingCitationBarProps } from './types';

/**
 * GroundingCitationBar (출처 역추적 및 그라운딩 검증 종합 바)
 *
 * 생성물의 인용 목록, 팩트 일치율 스코어카드, 근거 누락 경고를 보여줍니다.
 */
export const GroundingCitationBar = memo(function GroundingCitationBar({
  citations,
  score,
  missingStatements,
  onSelectCitation,
  className = '',
}: GroundingCitationBarProps) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {/* 1. 신뢰도 스코어카드 */}
      {score && <FaithfulnessScoreCard score={score} />}

      {/* 2. 근거 누락 알림 */}
      {missingStatements && missingStatements.length > 0 && (
        <MissingEvidenceAlert unverifiedStatements={missingStatements} />
      )}

      {/* 3. 인용 발췌문 카드 목록 */}
      {citations.length > 0 && (
        <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-semibold pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>원천 근거 발췌 목록 ({citations.length})</span>
            </span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1 no-scrollbar">
            {citations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCitation?.(c)}
                className="w-full flex flex-col gap-0.5 p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 transition-colors text-left select-none cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-indigo-300">
                  <span className="font-bold flex items-center gap-1">
                    <span className="px-1 py-0.2 rounded bg-indigo-950 border border-indigo-700/60">
                      [{c.index}]
                    </span>
                    <span className="truncate max-w-[140px]">{c.sourceDocTitle}</span>
                  </span>
                  {c.page !== undefined && <span>p.{c.page}</span>}
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mt-0.5">
                  "{c.snippet}"
                </p>

                <div className="flex items-center justify-end text-[9px] text-slate-500 group-hover:text-indigo-300 transition-colors pt-0.5">
                  <span className="flex items-center gap-0.5">
                    <ExternalLink className="w-2 h-2" />
                    <span>원문 위치로 이동</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
