/**
 * @file VersionHistoryDrawer.tsx
 * @description 온디맨드 버전 히스토리 서랍 (우측 슬라이딩 타임머신 패널)
 * 평소에는 완전히 숨겨져 미니멀 손맛을 보존하고, 필요 시 스냅샷 목록, Diff 비교, 롤백을 제공한다.
 */

import React, { useState } from 'react';
import {
  X,
  History,
  Camera,
  RotateCcw,
  Tag,
  PlusCircle,
  MinusCircle,
  FileEdit,
  Clock,
} from 'lucide-react';
import { diffSnapshots } from '@vibe/outliner-core';
import { useActiveProject, useWorkspaceStore } from '@/entities/workspace';

const EMPTY_SNAPSHOTS: any[] = [];

export const VersionHistoryDrawer: React.FC = () => {
  const isHistoryDrawerOpen = useWorkspaceStore((s) => s.isHistoryDrawerOpen);
  const closeHistoryDrawer = useWorkspaceStore((s) => s.closeHistoryDrawer);
  const activeProjectId = useWorkspaceStore((s) => s.workspace.activeProjectId);
  const snapshotsMap = useWorkspaceStore((s) => s.workspace.snapshots);
  const snapshots = snapshotsMap[activeProjectId] ?? EMPTY_SNAPSHOTS;
  const selectedSnapshotId = useWorkspaceStore((s) => s.selectedSnapshotId);
  const selectSnapshot = useWorkspaceStore((s) => s.selectSnapshot);
  const takeSnapshot = useWorkspaceStore((s) => s.takeSnapshot);
  const rollbackToSnapshot = useWorkspaceStore((s) => s.rollbackToSnapshot);

  const currentNodes = useActiveProject().rootNodes;

  // 새 스냅샷 생성 폼 상태
  const [milestoneName, setMilestoneName] = useState('');
  const [summary, setSummary] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!isHistoryDrawerOpen) return null;

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    takeSnapshot(activeProjectId, milestoneName.trim() || undefined, summary.trim() || undefined);
    setMilestoneName('');
    setSummary('');
    setIsFormOpen(false);
  };

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId);
  // 현재 트리와 선택된 스냅샷 간의 Diff 계산
  const diff = selectedSnapshot ? diffSnapshots(selectedSnapshot.rootNodes, currentNodes) : null;

  // 직전 최신 스냅샷 대비 현재 작업본(Working Copy)의 변경점 계산
  const latestSnapshot = snapshots[0];
  const workingDiff = latestSnapshot ? diffSnapshots(latestSnapshot.rootNodes, currentNodes) : null;
  const hasWorkingChanges =
    workingDiff &&
    (workingDiff.addedCount > 0 || workingDiff.modifiedCount > 0 || workingDiff.removedCount > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">버전 히스토리 (Time Machine)</h2>
          </div>
          <button
            type="button"
            onClick={closeHistoryDrawer}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 새 스냅샷 저장 트리거 */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
          {!isFormOpen ? (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-900/20"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>현재 시점 스냅샷 박제하기</span>
            </button>
          ) : (
            <form onSubmit={handleCreateSnapshot} className="space-y-3 bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  마일스톤 명칭 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: v1.0 초안 완료, 팀 회의 결정본"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  변경 요약 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 3장 구조 재편 및 결론 보강"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                >
                  스냅샷 저장
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 스냅샷 목록 및 작업본 상태 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* 현재 작업본 상태 카드 */}
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasWorkingChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                <span>현재 작업본 (Working Draft)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {hasWorkingChanges ? '미박제 변경사항 있음' : '스냅샷과 일치 (Clean)'}
              </span>
            </div>

            {workingDiff && (
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <PlusCircle className="w-3 h-3" />
                  <span>+{workingDiff.addedCount} 추가</span>
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <FileEdit className="w-3 h-3" />
                  <span>~{workingDiff.modifiedCount} 수정</span>
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <MinusCircle className="w-3 h-3" />
                  <span>-{workingDiff.removedCount} 삭제</span>
                </span>
              </div>
            )}
          </div>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 pt-1">
            저장된 스냅샷 기록 ({snapshots.length})
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              보존된 스냅샷이 없습니다.
            </div>
          ) : (
            snapshots.map((snap, idx) => {
              const isSelected = snap.id === selectedSnapshotId;
              const dateStr = new Date(snap.timestamp).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={snap.id}
                  onClick={() => selectSnapshot(isSelected ? null : snap.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {snap.milestoneName ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{snap.milestoneName}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-300">
                          스냅샷 #{snapshots.length - idx}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{dateStr}</span>
                    </span>
                  </div>

                  {snap.summary && (
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      {snap.summary}
                    </p>
                  )}

                  {/* 선택 시 나타나는 세부 Diff 및 복원 액션 */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 animate-in fade-in duration-150">
                      {diff && (
                        <div className="mb-3 p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                          <div className="font-semibold text-slate-300 mb-1">
                            현재 상태와의 차이:
                          </div>
                          <div className="flex items-center gap-3 text-slate-400">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <PlusCircle className="w-3 h-3" />
                              <span>+{diff.addedCount} 추가</span>
                            </span>
                            <span className="flex items-center gap-1 text-amber-400">
                              <FileEdit className="w-3 h-3" />
                              <span>~{diff.modifiedCount} 수정</span>
                            </span>
                            <span className="flex items-center gap-1 text-rose-400">
                              <MinusCircle className="w-3 h-3" />
                              <span>-{diff.removedCount} 삭제</span>
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('이 스냅샷 상태로 복원하시겠습니까? 현재 변경사항은 덮어씌워집니다.')) {
                            rollbackToSnapshot(activeProjectId, snap.id);
                            closeHistoryDrawer();
                          }
                        }}
                        className="w-full py-1.5 px-3 rounded bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>이 시점 스냅샷으로 복원</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 풋터 */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center text-[10px] text-slate-500">
          모든 스냅샷은 브라우저 세션에 안전하게 불변 보존됩니다.
        </div>
      </div>
    </div>
  );
};
