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
    <div className="w-full bg-[#161b22] border-b border-[#30363d] shadow-md px-4 py-2 flex items-center justify-between gap-4 z-40 text-xs shrink-0">
      {/* 1. 타이틀 & 가이드 안내 */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-6 h-6 rounded-md bg-[#21262d] text-[#e6edf3] border border-[#30363d] flex items-center justify-center font-bold">
          <GitCompare className="w-3.5 h-3.5 text-[#58a6ff]" />
        </div>
        <div>
          <div className="font-semibold text-[#e6edf3] flex items-center gap-1.5">
            <span>Universal Compare Mode</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-mono">
              2개 카드 픽
            </span>
          </div>
          <div className="text-[11px] text-[#848d97]">
            비교할 요소의 <span className="text-[#58a6ff] font-medium">[+ Compare]</span>를 눌러 2개 카드를 슬롯에 담으세요.
          </div>
        </div>
      </div>

      {/* 2. 슬롯 1 & 슬롯 2 대조 영역 */}
      <div className="flex-1 max-w-3xl flex items-center justify-center gap-2">
        {/* Slot A (Base) */}
        <div
          className={`flex-1 min-w-0 max-w-[340px] px-3 py-1.5 rounded-md border flex items-center justify-between gap-2 transition-all ${
            slotA
              ? 'bg-[rgba(248,81,73,0.1)] border-[rgba(248,81,73,0.4)] text-[#e6edf3]'
              : 'bg-[#0d1117] border-dashed border-[#30363d] text-[#848d97]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-full bg-[rgba(248,81,73,0.2)] text-[#f85149] flex items-center justify-center font-mono font-bold text-xs shrink-0">
              🅰️
            </span>
            {slotA ? (
              <div className="min-w-0">
                <div className="font-semibold text-[#f85149] truncate text-[11px]">
                  {slotA.title}
                </div>
                {slotA.subtitle && (
                  <div className="text-[10px] text-[#848d97] font-mono truncate">
                    {slotA.subtitle}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-[#848d97] italic truncate">
                1번째 카드를 픽하세요
              </span>
            )}
          </div>

          {slotA && (
            <button
              type="button"
              onClick={onClearSlotA}
              className="p-1 text-[#848d97] hover:text-[#f85149] rounded hover:bg-[#21262d] transition-colors shrink-0 cursor-pointer"
              title="슬롯 A 비우기"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Arrow Divider */}
        <div className="text-[#6e7681] shrink-0 font-mono">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* Slot B (Target) */}
        <div
          className={`flex-1 min-w-0 max-w-[340px] px-3 py-1.5 rounded-md border flex items-center justify-between gap-2 transition-all ${
            slotB
              ? 'bg-[rgba(46,160,67,0.1)] border-[rgba(46,160,67,0.4)] text-[#e6edf3]'
              : 'bg-[#0d1117] border-dashed border-[#30363d] text-[#848d97]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-full bg-[rgba(46,160,67,0.2)] text-[#3fb950] flex items-center justify-center font-mono font-bold text-xs shrink-0">
              🅱️
            </span>
            {slotB ? (
              <div className="min-w-0">
                <div className="font-semibold text-[#3fb950] truncate text-[11px]">
                  {slotB.title}
                </div>
                {slotB.subtitle && (
                  <div className="text-[10px] text-[#848d97] font-mono truncate">
                    {slotB.subtitle}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-[#848d97] italic truncate">
                2번째 카드를 픽하세요
              </span>
            )}
          </div>

          {slotB && (
            <button
              type="button"
              onClick={onClearSlotB}
              className="p-1 text-[#848d97] hover:text-[#3fb950] rounded hover:bg-[#21262d] transition-colors shrink-0 cursor-pointer"
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
            isReady
              ? 'bg-[#238636] hover:bg-[#2ea043] text-white border border-[rgba(240,246,252,0.1)] shadow-sm'
              : 'bg-[#21262d] text-[#848d97] border border-[#30363d] cursor-not-allowed'
          }`}
          title={isReady ? 'GitHub Split Diff 열기' : '2개 카드를 모두 선택해야 합니다'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Diff 대조 열기
        </button>

        <button
          type="button"
          onClick={onCloseCompareMode}
          className="p-1.5 text-[#848d97] hover:text-[#e6edf3] rounded-md hover:bg-[#21262d] border border-transparent hover:border-[#30363d] transition-colors cursor-pointer"
          title="Compare 모드 종료"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
export default CompareDock
