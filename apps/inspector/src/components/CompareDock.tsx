/**
 * @fileoverview Universal Compare Selection Dock 컴포넌트
 * 사용자가 화면 내 임의의 카드(스팬, 인풋, 아웃풋, 코드, 런 등)를 선택하여
 * 두 개의 슬롯(🅰️ Slot 1 vs 🅱️ Slot 2)에 등록하고 대조할 수 있도록 안내하는 도크 바입니다.
 * Google TypeScript Style Guide 규칙(readonly 불변성, JSDoc, 명시적 반환 타입)을 준수합니다.
 */

import React from 'react'
import { ArrowRight, GitCompare, Sparkles, X } from 'lucide-react'
import type { CompareItem } from '../types'

export interface CompareDockProps {
  readonly slotA: CompareItem | null
  readonly slotB: CompareItem | null
  readonly onClearSlotA: () => void
  readonly onClearSlotB: () => void
  readonly onCloseCompareMode: () => void
  readonly onOpenDiff: () => void
}

export const CompareDock: React.FC<CompareDockProps> = ({
  slotA,
  slotB,
  onClearSlotA,
  onClearSlotB,
  onCloseCompareMode,
  onOpenDiff,
}) => {
  const isReady = Boolean(slotA && slotB)

  return (
    <div className="w-full bg-[#0d1527] border-b border-cyan-800/80 shadow-2xl px-4 py-2.5 flex items-center justify-between gap-4 z-40 text-xs shrink-0 animate-fadeIn">
      {/* 1. 타이틀 & 가이드 안내 */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-md bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold">
          <GitCompare className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="font-semibold text-white flex items-center gap-1.5">
            <span>Universal Compare Mode</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
              2개 카드 픽
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            화면의 어떤 카드든 <span className="text-cyan-300 font-semibold">[+ Compare]</span>를
            눌러 비교 대상을 담으세요.
          </div>
        </div>
      </div>

      {/* 2. 슬롯 1 & 슬롯 2 대조 영역 */}
      <div className="flex-1 max-w-3xl flex items-center justify-center gap-2">
        {/* Slot A (Base) */}
        <div
          className={`flex-1 min-w-0 max-w-[340px] px-3 py-1.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
            slotA
              ? 'bg-rose-950/40 border-rose-500/60 text-slate-100 shadow-md'
              : 'bg-slate-900/60 border-dashed border-slate-700 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
              🅰️
            </span>
            {slotA ? (
              <div className="min-w-0">
                <div className="font-semibold text-rose-200 truncate text-[11px]">
                  {slotA.title}
                </div>
                {slotA.subtitle && (
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {slotA.subtitle}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic truncate">
                1번째 카드를 픽하세요
              </span>
            )}
          </div>

          {slotA && (
            <button
              type="button"
              onClick={onClearSlotA}
              className="p-1 text-slate-400 hover:text-rose-300 rounded hover:bg-rose-900/40 transition-colors shrink-0"
              title="슬롯 A 비우기"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Arrow Divider */}
        <div className="text-slate-600 shrink-0 font-mono">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* Slot B (Target) */}
        <div
          className={`flex-1 min-w-0 max-w-[340px] px-3 py-1.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
            slotB
              ? 'bg-emerald-950/40 border-emerald-500/60 text-slate-100 shadow-md'
              : 'bg-slate-900/60 border-dashed border-slate-700 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
              🅱️
            </span>
            {slotB ? (
              <div className="min-w-0">
                <div className="font-semibold text-emerald-200 truncate text-[11px]">
                  {slotB.title}
                </div>
                {slotB.subtitle && (
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {slotB.subtitle}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic truncate">
                2번째 카드를 픽하세요
              </span>
            )}
          </div>

          {slotB && (
            <button
              type="button"
              onClick={onClearSlotB}
              className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-emerald-900/40 transition-colors shrink-0"
              title="슬롯 B 비우기"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. 완료 및 닫기 버튼 */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenDiff}
          disabled={!isReady}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
            isReady
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40 animate-pulse'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title={isReady ? 'GitHub Split Diff 열기' : '2개 카드를 모두 선택해야 합니다'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Diff 대조 열기
        </button>

        <button
          type="button"
          onClick={onCloseCompareMode}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Compare 모드 종료"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
export default CompareDock
