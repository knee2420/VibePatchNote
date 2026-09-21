import {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  startTransition,
} from 'react';
import { Tree, type TreeApi, type NodeApi, type CreateHandler } from 'react-arborist';
import { IdeArboristRow } from './primitives/IdeArboristRow';
import { IdeArboristContext } from './IdeArboristContext';
import type { IdeArboristNodeData } from './types';

export interface IdeArboristTreeProps {
  data: IdeArboristNodeData[];
  selectedId?: string | null;
  onSelectNode?: (node: IdeArboristNodeData) => void;
  onMove?: (args: {
    dragIds: string[];
    parentId: string | null;
    index: number;
    dragNodes: NodeApi<IdeArboristNodeData>[];
    parentNode: NodeApi<IdeArboristNodeData> | null;
  }) => void;
  onRename?: (args: { id: string; name: string; node: NodeApi<IdeArboristNodeData> }) => void;
  onCreate?: CreateHandler<IdeArboristNodeData>;
  onDelete?: (args: { ids: string[]; nodes: NodeApi<IdeArboristNodeData>[] }) => void;
  onSelectSlot?: (slotId: string, pageNumber: number) => void;
  onApplySuggested?: (slotId: string) => void;
  onUnbindSlot?: (slotId: string) => void;
  className?: string;
  emptyMessage?: string;
}

/**
 * IdeArboristTree
 * react-arborist 기반 고성능 가상화 트리 엔진.
 * ResizeObserver를 통한 100% 반응형 뷰포트 추적과 고밀도(30px) 행 렌더링,
 * 폴더 드래그 앤 드롭, 인라인 이름 변경 및 선택 이벤트를 완벽하게 지원합니다.
 */
export const IdeArboristTree = forwardRef<TreeApi<IdeArboristNodeData>, IdeArboristTreeProps>(
  function IdeArboristTree(
    {
      data,
      selectedId,
      onSelectNode,
      onMove,
      onRename,
      onCreate,
      onDelete,
      onSelectSlot,
      onApplySuggested,
      onUnbindSlot,
      className = '',
      emptyMessage = '표시할 항목이 없습니다.',
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const treeInternalRef = useRef<TreeApi<IdeArboristNodeData> | null>(null);
    const isSyncingRef = useRef(false);
    const lastDimRef = useRef<{ width: number; height: number }>({ width: 320, height: 500 });
    const rafIdRef = useRef<number | null>(null);

    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
      width: 320,
      height: 500,
    });

    // 외부 ref와 내부 TreeApi 연결
    useImperativeHandle(ref, () => treeInternalRef.current as TreeApi<IdeArboristNodeData>, []);

    // 컨테이너 리사이즈 관측 (rAF + 2px 오차 무시 쓰로틀링으로 무한 리플로우 완전 차단)
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const handleResize = (newWidth: number, newHeight: number) => {
        const floorW = Math.floor(newWidth);
        const floorH = Math.floor(newHeight);
        if (
          floorW > 0 &&
          floorH > 0 &&
          (Math.abs(floorW - lastDimRef.current.width) > 2 ||
            Math.abs(floorH - lastDimRef.current.height) > 2)
        ) {
          lastDimRef.current = { width: floorW, height: floorH };
          if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
          }
          rafIdRef.current = requestAnimationFrame(() => {
            setDimensions({ width: floorW, height: floorH });
          });
        }
      };

      // 초기 크기 측정
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        handleResize(rect.width, rect.height);
      }

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          handleResize(width, height);
        }
      });

      observer.observe(el);
      return () => {
        observer.disconnect();
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }
      };
    }, []);

    // 선택 노드 외부 동기화 (재귀 이벤트 루프 차단 가드)
    useEffect(() => {
      if (selectedId && treeInternalRef.current) {
        try {
          isSyncingRef.current = true;
          treeInternalRef.current.select(selectedId);
        } catch {
          // 가상화 트리에 없는 경우 조용히 무시
        } finally {
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 0);
        }
      }
    }, [selectedId]);

    if (!data || data.length === 0) {
      return (
        <div className={`w-full h-full flex items-center justify-center p-6 text-xs text-slate-500 ${className}`}>
          {emptyMessage}
        </div>
      );
    }

    const contextValue = {
      onSelectSlot,
      onApplySuggested,
      onUnbindSlot,
    };

    return (
      <IdeArboristContext.Provider value={contextValue}>
        <div
          ref={containerRef}
          className={`w-full h-full overflow-hidden select-none font-sans ${className}`}
          style={{ overflowX: 'hidden' }}
        >
          <style>{`
            [role="tree"], [role="tree"] > div, [role="tree"] * {
              overflow-x: hidden !important;
              scrollbar-width: none !important;
            }
            [role="tree"]::-webkit-scrollbar:horizontal {
              display: none !important;
              height: 0 !important;
            }
          `}</style>
          {dimensions.width > 0 && dimensions.height > 0 && (
            <Tree<IdeArboristNodeData>
              ref={treeInternalRef}
              data={data}
              width={Math.max(60, dimensions.width)}
              height={dimensions.height}
              indent={0}
              rowHeight={25}
              overscanCount={6}
              openByDefault={true}
              onSelect={(nodes) => {
                if (isSyncingRef.current) return;
                if (nodes.length > 0 && nodes[0]) {
                  const target = nodes[0].data;
                  startTransition(() => {
                    onSelectNode?.(target);
                    if (target.fieldData && onSelectSlot) {
                      onSelectSlot(target.fieldData.id, target.pageNumber || 1);
                    } else if (target.kind === 'slot' && onSelectSlot) {
                      onSelectSlot(target.id, target.pageNumber || 1);
                    }
                  });
                }
              }}
              onMove={onMove}
              onRename={onRename}
              onCreate={onCreate}
              onDelete={onDelete}
            >
              {IdeArboristRow}
            </Tree>
          )}
        </div>
      </IdeArboristContext.Provider>
    );
  }
);

