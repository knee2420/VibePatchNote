import { useMemo } from 'react';
import {
  ShieldCheck,
  Zap,
  Calculator,
  MessageSquare,
  Activity,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import {
  IdeActivityBar,
  type ActivityBarItemConfig,
} from '@vibe/editor-workspace';

export type AiPanelMode = 'audit' | 'extract' | 'calculation' | 'chat' | 'telemetry';

export interface IdeSecondaryActivityBarProps {
  isOpen: boolean;
  activeMode: AiPanelMode;
  onSelectMode: (mode: AiPanelMode) => void;
  onToggleOpen: () => void;
  score?: number;
  issueCount?: number;
}

/**
 * [IDE Mode] 데스크톱 IDE 스타일의 우측 보조 액티비티 바.
 * 
 * `@vibe/editor-workspace`의 통합 `IdeActivityBar(side="right", itemVariant="rounded")`를
 * 기반으로 조립하여 완성도 점수 서클 및 보조 패널 열림/닫힘 토글을 제공합니다.
 */
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

  const navItems = useMemo<ActivityBarItemConfig<AiPanelMode>[]>(() => [
    {
      id: 'audit',
      label: 'Recipe 규격 및 서식 감사 (Grammarly Audit)',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: issueCount > 0 ? 'dot' : undefined,
    },
    {
      id: 'extract',
      label: '14개 슬롯 데이터 자동 추출 & 일괄 채우기',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'calculation',
      label: '지출 정산 및 수치 정합성 검증',
      icon: <Calculator className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'chat',
      label: 'Antigravity Agent 대화형 보조',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'telemetry',
      label: '런타임 실행 메타데이터 & 계측 (Telemetry)',
      icon: <Activity className="w-4 h-4" />,
    },
  ], [issueCount]);

  const topScoreSlot = (
    <>
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
      <div className="w-6 h-[1px] bg-slate-800/80 my-1" />
    </>
  );

  const bottomToggleAction = (
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
  );

  return (
    <IdeActivityBar<AiPanelMode>
      side="right"
      itemVariant="rounded"
      activeTab={isOpen ? activeMode : null}
      onSelectTab={(tab) => {
        if (tab === null) {
          onToggleOpen();
        } else {
          handleClickMode(tab);
        }
      }}
      allowDeselect
      items={navItems}
      topSlot={topScoreSlot}
      bottomActions={bottomToggleAction}
    />
  );
}

