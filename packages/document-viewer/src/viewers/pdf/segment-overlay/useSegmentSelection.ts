import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ViewerSegment } from '../../../types';

interface UseSegmentSelectionOptions {
  pageSegments: ViewerSegment[];
  isEditMode: boolean;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onDeleteSegment?: (segmentId: string) => void;
}

/**
 * 세그먼트 선택 / 호버 / 라벨·타입 인라인 편집 상태를 담당합니다.
 * 박스를 끌어 옮기는 동작은 `useSegmentDrag` 가 별도로 소유합니다.
 */
export function useSegmentSelection({
  pageSegments,
  isEditMode,
  onUpdateSegment,
  onDeleteSegment,
}: UseSegmentSelectionOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState('');

  /** 선택된 박스의 DOM. 바깥 클릭 판정에 씁니다. */
  const activeBoxRef = useRef<HTMLDivElement | null>(null);

  // 최신 콜백을 ref 로 유지해 리스너를 불필요하게 재등록하지 않습니다.
  const onUpdateSegmentRef = useRef(onUpdateSegment);
  onUpdateSegmentRef.current = onUpdateSegment;

  const selectedSegment = useMemo(
    () => pageSegments.find((s) => s.id === selectedId) || null,
    [pageSegments, selectedId]
  );

  // 다른 세그먼트를 새로 고를 때만 라벨 인풋을 동기화합니다. (타이핑 중 리셋 방지)
  const lastSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedSegment && lastSelectedIdRef.current !== selectedSegment.id) {
      setEditingLabel(selectedSegment.label);
      lastSelectedIdRef.current = selectedSegment.id;
    }
  }, [selectedSegment]);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setIsEditing(false);
  }, []);

  // 편집 모드를 끄면 선택 상태를 모두 비웁니다.
  useEffect(() => {
    if (!isEditMode) clearSelection();
  }, [isEditMode, clearSelection]);

  // 바깥 클릭 시 선택 및 툴바 해제
  useEffect(() => {
    if (!selectedId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (activeBoxRef.current && !activeBoxRef.current.contains(e.target as Node)) {
        clearSelection();
      }
    };

    window.addEventListener('mousedown', handleClickOutside, true);
    return () => window.removeEventListener('mousedown', handleClickOutside, true);
  }, [selectedId, clearSelection]);

  // 키보드 단축키: Del/Backspace 삭제, Esc 선택 해제
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape') setIsEditing(false);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && isEditMode) {
        // 캔버스 노드 삭제로 전파되지 않도록 여기서 끊습니다.
        e.preventDefault();
        e.stopPropagation();
        onDeleteSegment?.(selectedId);
        clearSelection();
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedId, isEditMode, onDeleteSegment, clearSelection]);

  const startLabelEdit = useCallback((segment: ViewerSegment) => {
    setSelectedId(segment.id);
    setEditingLabel(segment.label);
    setIsEditing(true);
  }, []);

  const saveLabel = useCallback(() => {
    if (selectedSegment && editingLabel.trim()) {
      onUpdateSegmentRef.current?.({ ...selectedSegment, label: editingLabel.trim() });
    }
    setIsEditing(false);
  }, [selectedSegment, editingLabel]);

  const changeType = useCallback(
    (nextType: string) => {
      if (!selectedSegment) return;
      onUpdateSegmentRef.current?.({ ...selectedSegment, type: nextType });
    },
    [selectedSegment]
  );

  const deleteSegment = useCallback(
    (segmentId: string) => {
      onDeleteSegment?.(segmentId);
      clearSelection();
    },
    [onDeleteSegment, clearSelection]
  );

  return {
    selectedId,
    selectedSegment,
    hoveredId,
    isEditing,
    editingLabel,
    activeBoxRef,
    setSelectedId,
    setHoveredId,
    setIsEditing,
    setEditingLabel,
    clearSelection,
    startLabelEdit,
    saveLabel,
    changeType,
    deleteSegment,
  };
}
