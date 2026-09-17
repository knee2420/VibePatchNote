import {
  ShieldCheck,
  Zap,
  Calculator,
  MessageSquare,
  Activity,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

export type AiPanelMode = 'audit' | 'extract' | 'calculation' | 'chat' | 'telemetry';

interface IdeSecondaryActivityBarProps {
  isOpen: boolean;
  activeMode: AiPanelMode;
  onSelectMode: (mode: AiPanelMode) => void;
  onToggleOpen: () => void;
  score?: number;
  issueCount?: number;
}

export function IdeSecondaryActivityBar({
  isOpen,
  activeMode,
  onSelectMode,
  onToggleOpen,
  score = 85,
  issueCount = 2,
}: IdeSecondaryActivityBarProps) {
  const handleClickMode = (mode: AiPanelMode) => {
    if (!isOpen) {
      onToggleOpen();
      onSelectMode(mode);
    } else if (activeMode === mode) {
      // 이미 열려있고 같은 탭을 누르면 닫기
      onToggleOpen();
    } else {
      onSelectMode(mode);
    }
  };

  return (
    <aside className="w-11.5 h-full bg-slate-950/95 border-l border-slate-800/90 flex flex-col items-center justify-between py-2 select-none z-20 shrink-0 text-slate-400">
      {/* 1. 상단: 완성도 점수 배지 + Grammarly AI 기능 아이콘들 */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Grammarly 스타일 실시간 완성도 점수 서클 */}
        <button
          type="button"
          onClick={() => handleClickMode('audit')}
          className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all cursor-pointer shadow-xs ${
            isOpen && activeMode === 'audit'
              ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-indigo-500/30'
              : 'bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400'
          }`}
          title={`문서 완성도 점수: ${score}점 (클릭하여 규격 검사)`}
        >
          <span>{score}</span>
          {issueCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 border border-slate-950 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
              {issueCount}
            </span>
          )}
        </button>

        <div className="w-6 h-[1px] bg-slate-800/80 my-0.5" />

        {/* 탭 1: 규격 & 서식 감사 (Audit) */}
        <button
          type="button"
          onClick={() => handleClickMode('audit')}
          className={`relative p-2 rounded-lg transition-all cursor-pointer ${
            isOpen && activeMode === 'audit'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
              : 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
          }`}
          title="Recipe 규격 및 서식 감사 (Grammarly Audit)"
        >
          <ShieldCheck className="w-4 h-4" />
          {issueCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* 탭 2: 14개 슬롯 자동 추출 & 채우기 (Extract & Fill) */}
        <button
          type="button"
          onClick={() => handleClickMode('extract')}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isOpen && activeMode === 'extract'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
              : 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
          }`}
          title="14개 슬롯 데이터 자동 추출 & 일괄 채우기"
        >
          <Zap className="w-4 h-4 text-amber-400" />
        </button>

        {/* 탭 3: 지출비 정산 & 수치 계산 검증 (Calculation) */}
        <button
          type="button"
          onClick={() => handleClickMode('calculation')}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isOpen && activeMode === 'calculation'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
              : 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
          }`}
          title="지출 정산 및 수치 정합성 검증"
        >
          <Calculator className="w-4 h-4 text-cyan-400" />
        </button>

        {/* 탭 4: 에이전트 자유 챗 (Agent Chat) */}
        <button
          type="button"
          onClick={() => handleClickMode('chat')}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isOpen && activeMode === 'chat'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
              : 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
          }`}
          title="Antigravity Agent 대화형 보조"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* 탭 5: 런타임 실행 계측 관측 (Telemetry) */}
        <button
          type="button"
          onClick={() => handleClickMode('telemetry')}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isOpen && activeMode === 'telemetry'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
              : 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
          }`}
          title="런타임 실행 메타데이터 & 계측 (Telemetry)"
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>

      {/* 2. 최하단: 패널 열기/닫기 토글 버튼 */}
      <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onToggleOpen}
          className="p-2 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title={isOpen ? 'AI 패널 닫기' : 'AI 패널 열기'}
        >
          {isOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
