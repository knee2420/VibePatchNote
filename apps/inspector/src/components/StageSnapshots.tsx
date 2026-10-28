/**
 * @fileoverview 단계 스냅샷 패널.
 *
 * 파이프라인이 각 단계에서 남긴 도메인 요약이다. 스팬의 입출력이 "무엇이
 * 오갔는가"라면, 스냅샷은 "그 단계가 무엇을 확정했는가"다.
 *
 * 이 데이터는 계속 저장되고 API 도 돌려주고 있었지만 **화면에 렌더된 적이
 * 없었다.** SpanDetail 이 prop 으로 받아 놓고 destructure 조차 하지 않았고,
 * 목록에는 개수 배지만 떠서 클릭해도 볼 방법이 없었다.
 *
 * 스냅샷은 span 이 아니라 **run** 에 속하므로 여기(워터폴)에 둔다.
 */

import React, { useState } from 'react'
import { Camera, ChevronDown } from 'lucide-react'

import type { StageSnapshotRecord } from '../types'

interface StageSnapshotsProps {
  readonly snapshots: readonly StageSnapshotRecord[]
}

/** 스칼라는 한 줄로, 그 외는 JSON 으로 보여준다. */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export const StageSnapshots: React.FC<StageSnapshotsProps> = ({ snapshots }) => {
  const [open, setOpen] = useState(false)

  if (snapshots.length === 0) return null

  return (
    <div className="rounded-md border border-[#30363d] bg-[#161b22]/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#848d97] hover:text-[#e6edf3] transition-colors cursor-pointer select-none"
      >
        <span className="flex items-center gap-1.5 font-semibold">
          <Camera className="w-3.5 h-3.5 text-[#bc8cff]" />
          단계 스냅샷 ({snapshots.length})
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {snapshots.map((snapshot, index) => {
            const entries = Object.entries(snapshot.payload ?? {})
            return (
              <div
                key={`${snapshot.stage_id}-${index}`}
                className="rounded-md border border-[#30363d] bg-[#0d1117] overflow-hidden"
              >
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#161b22] border-b border-[#30363d]">
                  <span className="text-[11px] font-semibold text-[#e6edf3]">
                    {snapshot.stage_name}
                  </span>
                  <span className="text-[10px] font-mono text-[#848d97]">{snapshot.stage_id}</span>
                </div>

                {entries.length === 0 ? (
                  <div className="px-2.5 py-2 text-[11px] text-[#848d97] italic">
                    기록된 값이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-2.5 py-2">
                    {entries.map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] text-[#848d97] truncate" title={key}>
                          {key}
                        </span>
                        <span
                          className="font-mono text-[11px] text-[#e6edf3] truncate"
                          title={renderValue(value)}
                        >
                          {renderValue(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
