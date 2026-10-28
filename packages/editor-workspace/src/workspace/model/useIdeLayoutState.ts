import { useState, useCallback, useMemo } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { usePanelResize } from './usePanelResize';

export interface IdeLayoutStateConfig {
  /** 좌측 기본 사이드바 초기 너비 (기본값: 280) */
  defaultPrimarySidebarWidth?: number;
  /** 우측 보조 사이드바 초기 너비 (기본값: 340) */
  defaultSecondarySidebarWidth?: number;
  /** 하단 패널 초기 높이 (기본값: 220) */
  defaultBottomPanelHeight?: number;
  /** 리소스 매니저 초기 너비 (기본값: 320) */
  defaultResourceManagerWidth?: number;
  /** 리소스 모달 초기 너비 (기본값: 480) */
  defaultResourceModalWidth?: number;
  /** 좌측 레퍼런스 패널 초기 너비 (기본값: 420) */
  defaultLeftReferenceWidth?: number;
  /** 에디터 스플릿 초기 비율 % (기본값: 50) */
  defaultSplitRatio?: number;

  /** 초기 가시성 설정 */
  initialShowPrimarySidebar?: boolean;
  initialShowSecondarySidebar?: boolean;
  initialShowBottomPanel?: boolean;
  initialShowResourceManager?: boolean;
  initialIsSplitEditor?: boolean;
}

export interface IdeLayoutStateReturn {
  // 1. 패널 가시성 (Toggles)
  showPrimarySidebar: boolean;
  setShowPrimarySidebar: React.Dispatch<React.SetStateAction<boolean>>;
  togglePrimarySidebar: () => void;

  showSecondarySidebar: boolean;
  setShowSecondarySidebar: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSecondarySidebar: () => void;

  showBottomPanel: boolean;
  setShowBottomPanel: React.Dispatch<React.SetStateAction<boolean>>;
  toggleBottomPanel: () => void;

  showResourceManager: boolean;
  setShowResourceManager: React.Dispatch<React.SetStateAction<boolean>>;
  toggleResourceManager: () => void;

  isSplitEditor: boolean;
  setIsSplitEditor: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSplitEditor: () => void;

  // 2. 패널 크기 수치 (Dimensions)
  primarySidebarWidth: number;
  setPrimarySidebarWidth: React.Dispatch<React.SetStateAction<number>>;

  secondarySidebarWidth: number;
  setSecondarySidebarWidth: React.Dispatch<React.SetStateAction<number>>;

  bottomPanelHeight: number;
  setBottomPanelHeight: React.Dispatch<React.SetStateAction<number>>;

  resourceManagerWidth: number;
  setResourceManagerWidth: React.Dispatch<React.SetStateAction<number>>;

  resourceModalWidth: number;
  setResourceModalWidth: React.Dispatch<React.SetStateAction<number>>;

  leftReferenceWidth: number;
  setLeftReferenceWidth: React.Dispatch<React.SetStateAction<number>>;

  splitRatio: number;
  setSplitRatio: React.Dispatch<React.SetStateAction<number>>;

  // 3. 리사이징 드래그 상태 & 핸들러
  isDraggingAnyResizer: boolean;
  handleMouseDownPrimaryResizer: (e: ReactMouseEvent) => void;
  handleMouseDownSecondaryResizer: (e: ReactMouseEvent) => void;
  handleMouseDownBottomResizer: (e: ReactMouseEvent) => void;
  handleMouseDownResourceResizer: (e: ReactMouseEvent) => void;
  handleMouseDownResourceModalResizer: (e: ReactMouseEvent) => void;
  handleMouseDownLeftReferenceResizer: (e: ReactMouseEvent) => void;
  handleMouseDownSplitResizer: (containerWidth: number) => (e: ReactMouseEvent) => void;
}

/**
 * [Composite Hook] 데스크톱 IDE 레이아웃 전체의 패널 가시성, 크기, 마우스 리사이징을 총괄하는 Headless 훅.
 */
export function useIdeLayoutState(config: IdeLayoutStateConfig = {}): IdeLayoutStateReturn {
  const {
    defaultPrimarySidebarWidth = 280,
    defaultSecondarySidebarWidth = 340,
    defaultBottomPanelHeight = 220,
    defaultResourceManagerWidth = 320,
    defaultResourceModalWidth = 480,
    defaultLeftReferenceWidth = 420,
    defaultSplitRatio = 50,

    initialShowPrimarySidebar = true,
    initialShowSecondarySidebar = false,
    initialShowBottomPanel = false,
    initialShowResourceManager = false,
    initialIsSplitEditor = false,
  } = config;

  // 1. 패널 가시성 토글 상태
  const [showPrimarySidebar, setShowPrimarySidebar] = useState(initialShowPrimarySidebar);
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(initialShowSecondarySidebar);
  const [showBottomPanel, setShowBottomPanel] = useState(initialShowBottomPanel);
  const [showResourceManager, setShowResourceManager] = useState(initialShowResourceManager);
  const [isSplitEditor, setIsSplitEditor] = useState(initialIsSplitEditor);

  const togglePrimarySidebar = useCallback(() => setShowPrimarySidebar((v) => !v), []);
  const toggleSecondarySidebar = useCallback(() => setShowSecondarySidebar((v) => !v), []);
  const toggleBottomPanel = useCallback(() => setShowBottomPanel((v) => !v), []);
  const toggleResourceManager = useCallback(() => setShowResourceManager((v) => !v), []);
  const toggleSplitEditor = useCallback(() => setIsSplitEditor((v) => !v), []);

  // 전역 리사이징 진행 플래그 카운트
  const [dragCount, setDragCount] = useState(0);
  const onDragStart = useCallback(() => setDragCount((c) => c + 1), []);
  const onDragEnd = useCallback(() => setDragCount((c) => Math.max(0, c - 1)), []);
  const isDraggingAnyResizer = dragCount > 0;

  // 2. 패널 리사이징 관리 (usePanelResize 활용)
  // A. 좌측 기본 사이드바 (160 ~ 500px, normal)
  const primaryResize = usePanelResize({
    initialSize: defaultPrimarySidebarWidth,
    min: 160,
    max: 500,
    orientation: 'vertical',
    direction: 'normal',
    onDragStart,
    onDragEnd,
  });

  // B. 우측 보조 사이드바 (240 ~ 650px, inverse)
  const secondaryResize = usePanelResize({
    initialSize: defaultSecondarySidebarWidth,
    min: 240,
    max: 650,
    orientation: 'vertical',
    direction: 'inverse',
    onDragStart,
    onDragEnd,
  });

  // C. 하단 패널 높이 (100 ~ 550px, inverse)
  const bottomResize = usePanelResize({
    initialSize: defaultBottomPanelHeight,
    min: 100,
    max: 550,
    orientation: 'horizontal',
    direction: 'inverse',
    onDragStart,
    onDragEnd,
  });

  // D. 리소스 매니저 패널 (200 ~ 550px, inverse)
  const resourceResize = usePanelResize({
    initialSize: defaultResourceManagerWidth,
    min: 200,
    max: 550,
    orientation: 'vertical',
    direction: 'inverse',
    onDragStart,
    onDragEnd,
  });

  // E. 헵타베이스 스타일 리소스 모달 (320 ~ 800px, inverse)
  const resourceModalResize = usePanelResize({
    initialSize: defaultResourceModalWidth,
    min: 320,
    max: 800,
    orientation: 'vertical',
    direction: 'inverse',
    onDragStart,
    onDragEnd,
  });

  // F. 좌측 슬라이드 레퍼런스 드로어 (340 ~ 850px, normal)
  const leftReferenceResize = usePanelResize({
    initialSize: defaultLeftReferenceWidth,
    min: 340,
    max: 850,
    orientation: 'vertical',
    direction: 'normal',
    onDragStart,
    onDragEnd,
  });

  // G. 중앙 스플릿 에디터 비율 (%)
  const [splitRatio, setSplitRatio] = useState(defaultSplitRatio);
  const handleMouseDownSplitResizer = useCallback(
    (containerWidth: number) => (e: ReactMouseEvent) => {
      e.preventDefault();
      onDragStart();
      const startX = e.clientX;
      const startRatio = splitRatio;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const deltaRatio = (delta / containerWidth) * 100;
        const newRatio = Math.max(20, Math.min(80, startRatio + deltaRatio));
        setSplitRatio(newRatio);
      };

      const handleMouseUp = () => {
        onDragEnd();
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [splitRatio, onDragStart, onDragEnd]
  );

  return useMemo(
    () => ({
      // 가시성
      showPrimarySidebar,
      setShowPrimarySidebar,
      togglePrimarySidebar,

      showSecondarySidebar,
      setShowSecondarySidebar,
      toggleSecondarySidebar,

      showBottomPanel,
      setShowBottomPanel,
      toggleBottomPanel,

      showResourceManager,
      setShowResourceManager,
      toggleResourceManager,

      isSplitEditor,
      setIsSplitEditor,
      toggleSplitEditor,

      // 수치
      primarySidebarWidth: primaryResize.size,
      setPrimarySidebarWidth: primaryResize.setSize,

      secondarySidebarWidth: secondaryResize.size,
      setSecondarySidebarWidth: secondaryResize.setSize,

      bottomPanelHeight: bottomResize.size,
      setBottomPanelHeight: bottomResize.setSize,

      resourceManagerWidth: resourceResize.size,
      setResourceManagerWidth: resourceResize.setSize,

      resourceModalWidth: resourceModalResize.size,
      setResourceModalWidth: resourceModalResize.setSize,

      leftReferenceWidth: leftReferenceResize.size,
      setLeftReferenceWidth: leftReferenceResize.setSize,

      splitRatio,
      setSplitRatio,

      // 리사이저 드래그
      isDraggingAnyResizer,
      handleMouseDownPrimaryResizer: primaryResize.handleMouseDown,
      handleMouseDownSecondaryResizer: secondaryResize.handleMouseDown,
      handleMouseDownBottomResizer: bottomResize.handleMouseDown,
      handleMouseDownResourceResizer: resourceResize.handleMouseDown,
      handleMouseDownResourceModalResizer: resourceModalResize.handleMouseDown,
      handleMouseDownLeftReferenceResizer: leftReferenceResize.handleMouseDown,
      handleMouseDownSplitResizer,
    }),
    [
      showPrimarySidebar,
      togglePrimarySidebar,
      showSecondarySidebar,
      toggleSecondarySidebar,
      showBottomPanel,
      toggleBottomPanel,
      showResourceManager,
      toggleResourceManager,
      isSplitEditor,
      toggleSplitEditor,
      primaryResize.size,
      primaryResize.setSize,
      primaryResize.handleMouseDown,
      secondaryResize.size,
      secondaryResize.setSize,
      secondaryResize.handleMouseDown,
      bottomResize.size,
      bottomResize.setSize,
      bottomResize.handleMouseDown,
      resourceResize.size,
      resourceResize.setSize,
      resourceResize.handleMouseDown,
      resourceModalResize.size,
      resourceModalResize.setSize,
      resourceModalResize.handleMouseDown,
      leftReferenceResize.size,
      leftReferenceResize.setSize,
      leftReferenceResize.handleMouseDown,
      splitRatio,
      isDraggingAnyResizer,
      handleMouseDownSplitResizer,
    ]
  );
}
