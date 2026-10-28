/**
 * 호스트가 주입하는 표시 설정(문구·타입 어휘)을 뷰어 하위 트리에 전달한다.
 *
 * 프롭 드릴링 대신 컨텍스트를 쓴다. 문구와 어휘는 렌더 트리 깊은 곳(배지, 리사이즈
 * 핸들)까지 필요한데, 그 경로의 모든 컴포넌트가 이걸 받아 넘기게 만들면 계약이
 * 오염된다.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { defaultViewerLabels, type ViewerLabels } from './labels';
import { DEFAULT_SEGMENT_TYPES, type SegmentTypeDescriptor } from './segmentTypes';

interface ViewerConfig {
  labels: ViewerLabels;
  segmentTypes: readonly SegmentTypeDescriptor[];
}

const ViewerConfigContext = createContext<ViewerConfig>({
  labels: defaultViewerLabels,
  segmentTypes: DEFAULT_SEGMENT_TYPES,
});

export function useViewerLabels(): ViewerLabels {
  return useContext(ViewerConfigContext).labels;
}

export function useSegmentTypes(): readonly SegmentTypeDescriptor[] {
  return useContext(ViewerConfigContext).segmentTypes;
}

export function ViewerConfigProvider({
  labels,
  segmentTypes,
  children,
}: {
  labels?: Partial<ViewerLabels>;
  segmentTypes?: readonly SegmentTypeDescriptor[];
  children: ReactNode;
}) {
  const value = useMemo<ViewerConfig>(
    () => ({
      labels: labels ? { ...defaultViewerLabels, ...labels } : defaultViewerLabels,
      segmentTypes: segmentTypes?.length ? segmentTypes : DEFAULT_SEGMENT_TYPES,
    }),
    [labels, segmentTypes]
  );
  return <ViewerConfigContext.Provider value={value}>{children}</ViewerConfigContext.Provider>;
}
