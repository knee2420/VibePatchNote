import { memo } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { FaithfulnessScoreCardProps } from './types';

/**
 * FaithfulnessScoreCard (그라운딩 신뢰도 및 정합성 스코어카드)
 *
 * 생성물의 원본 리소스 사실 일치율(Faithfulness) 및 루브릭 규격 충족률을 시각화.
 */
export const FaithfulnessScoreCard = memo(function FaithfulnessScoreCard({
  score,
  className = '',
}: FaithfulnessScoreCardProps) {
  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-400 bg-emerald-500';
    if (val >= 60) return 'text-amber-400 bg-amber-500';
    return 'text-rose-400 bg-rose-500';
  };

  return (
    <div className={`flex flex-col gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs ${className}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>그라운딩 신뢰도 검증</span>
        </span>
        {score.unverifiedClaimsCount > 0 ? (
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-rose-950/80 border border-rose-700/60 text-rose-300 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
            <span>미검증 진술 {score.unverifiedClaimsCount}건</span>
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>100% 근거 기반</span>
          </span>
        )}
      </div>

      {/* 2대 프로그레스 바 (사실 일치율 / 루브릭 충족률) */}
      <div className="space-y-1.5 pt-1">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-0.5">
            <span className="text-slate-400">원문 사실 일치율 (Faithfulness)</span>
            <span className={`font-mono font-bold ${getScoreColor(score.faithfulnessScore).split(' ')[0]}`}>
              {score.faithfulnessScore}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getScoreColor(score.faithfulnessScore).split(' ')[1]}`}
              style={{ width: `${score.faithfulnessScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-0.5">
            <span className="text-slate-400">루브릭 제약 충족도 (Compliance)</span>
            <span className={`font-mono font-bold ${getScoreColor(score.rubricComplianceScore).split(' ')[0]}`}>
              {score.rubricComplianceScore}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getScoreColor(score.rubricComplianceScore).split(' ')[1]}`}
              style={{ width: `${score.rubricComplianceScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
