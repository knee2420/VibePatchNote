import { useCallback, useState } from 'react';
import { useReactFlow, type OnResize, type OnResizeEnd, type OnResizeStart } from '@xyflow/react';

interface NodeSize {
  width: number;
  height: number;
}

/**
 * 노드의 수동 리사이즈 상태를 관리합니다.
 *
 * 사용자가 직접 크기를 조절하면 프리셋(Fit/Spread)보다 그 크기가 우선하고,
 * 프리셋을 다시 누르면 수동 크기를 버리고 자동 맞춤 권한을 되돌려 줍니다.
 */
export function useNodeResize(nodeId: string) {
  const { setNodes } = useReactFlow();
  const [isResizing, setIsResizing] = useState(false);
  const [customSize, setCustomSize] = useState<NodeSize | null>(null);

  const onResizeStart: OnResizeStart = useCallback(() => setIsResizing(true), []);

  const onResize: OnResize = useCallback((_, params) => {
    setCustomSize({ width: params.width, height: params.height });
  }, []);

  const onResizeEnd: OnResizeEnd = useCallback((_, params) => {
    setIsResizing(false);
    setCustomSize({ width: params.width, height: params.height });
  }, []);

  /** 수동 크기를 버리고 노드에 박힌 width/height 도 함께 지웁니다. */
  const resetCustomSize = useCallback(() => {
    setCustomSize(null);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              width: undefined,
              height: undefined,
              style: { ...node.style, width: undefined, height: undefined },
            }
          : node
      )
    );
  }, [nodeId, setNodes]);

  return { isResizing, customSize, onResizeStart, onResize, onResizeEnd, resetCustomSize };
}
