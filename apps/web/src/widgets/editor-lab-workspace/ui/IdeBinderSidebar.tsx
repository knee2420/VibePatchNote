import { useState, useMemo, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  FileText,
  Table as TableIcon,
  List as ListIcon,
  Image as ImageIcon,
  BookOpen,
  FileCode,
  Sparkles,
  Link2,
  Tag,
  Boxes,
  Loader2,
  SplitSquareVertical,
  MousePointerClick,
} from 'lucide-react';
import { useSegmentStructure } from '@/entities/document-segment';
import type { EditorTabItem, FileTreeNode, ResourceItem, SlotBindingInfo } from '../model/types';
import type { ScaffoldSlot } from '@/entities/scaffold-document';

export type BinderSpineMode = 'outline' | 'segment' | 'slots' | 'explorer';

export interface BinderContextMenuState {
  x: number;
  y: number;
  id: string;
  title: string;
  page?: number;
  isFolder?: boolean;
  isRoot?: boolean;
  slotId?: string;
}

export interface IdeBinderSidebarProps {
  scaffoldId?: string;
  docId?: string;
  documentTitle?: string;
  slots?: ScaffoldSlot[];
  fileTree: FileTreeNode[];
  activeNodeId?: string;
  activeTab?: EditorTabItem;
  activePageNumber?: number;
  onOpenFile: (node: FileTreeNode) => void;
  onSelectPage?: (pageNumber: number) => void;
  onOpenPageTab?: (pageNumber: number, pane?: 'pane1' | 'pane2') => void;
  selectedSlotId?: string | null;
  onSelectSlot?: (slotId: string, pageNumber: number, slotNumber?: number) => void;
  onOpenScrivenings?: () => void;
  onOpenResourceModal?: (resource: ResourceItem) => void;
  stagingResources?: ResourceItem[];
  // 신규 슬롯 소켓 바인딩 props
  slotBindings?: Record<string, SlotBindingInfo>;
  onBindSlot?: (slotId: string, value: string, resourceName?: string, resourceId?: string) => void;
  onUnbindSlot?: (slotId: string) => void;
  onApplySuggested?: (slotId: string) => void;
  onApplyAllSuggestions?: () => void;
  onResetAllSlots?: () => void;
  onOpenSlotProvenance?: (binding: SlotBindingInfo) => void;
  onToggleReferenceDoc?: () => void;
  isReferenceDocOpen?: boolean;
  activeSpine?: BinderSpineMode;
  onChangeSpine?: (spine: BinderSpineMode) => void;
}

export function IdeBinderSidebar({
  scaffoldId: _scaffoldId,
  docId = 'doc-1a0897500d9-989a3b2b',
  documentTitle = '회의비 사용 내역',
  slots: _slots = [],
  fileTree,
  activeNodeId: _activeNodeId,
  activeTab: _activeTab,
  activePageNumber,
  onOpenFile,
  onSelectPage,
  onOpenPageTab,
  selectedSlotId,
  onSelectSlot,
  onOpenScrivenings,
  onOpenResourceModal: _onOpenResourceModal,
  stagingResources: _stagingResources = [],
  slotBindings,
  onBindSlot,
  onUnbindSlot,
  onApplySuggested,
  onApplyAllSuggestions,
  onResetAllSlots,
  onOpenSlotProvenance,
  onToggleReferenceDoc,
  isReferenceDocOpen,
  activeSpine: propActiveSpine,
  onChangeSpine,
}: IdeBinderSidebarProps) {
  // 백엔드 실제 세그먼트-아웃라인 결합 구조 및 매핑 데이터 로드
  const { structure, isLoading: isLoadingStructure } = useSegmentStructure(docId, Boolean(docId));

  const totalSegmentsCount = structure?.segments?.length || 8;
  const totalOutlineElementsCount = structure?.outlineElements?.length || 14;
  const totalSlotsCount = _slots.length || 14;

  // 슬롯 바인딩 통계 (진행률 HUD 계산)
  const [filterUnboundOnly, setFilterUnboundOnly] = useState<boolean>(false);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  const slotStats = useMemo(() => {
    if (!slotBindings) return { total: 14, bound: 0, percentage: 0 };
    const values = Object.values(slotBindings);
    const total = values.length || 14;
    const bound = values.filter((s) => s.status === 'bound').length;
    const percentage = Math.round((bound / total) * 100);
    return { total, bound, percentage };
  }, [slotBindings]);

  // 1. 활성 척추 모드 (Outline, Segment, Slots, Explorer)
  const [internalSpine, setInternalSpine] = useState<BinderSpineMode>('outline');
  const activeSpine = propActiveSpine ?? internalSpine;
  const handleSpineChange = (mode: BinderSpineMode) => {
    setInternalSpine(mode);
    onChangeSpine?.(mode);
  };
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({
    'out-root': false,
    'out-p1': false,
    'out-p1-table': false,
    'out-p2': false,
    'out-p2-table': false,
    'wire-p1': false,
    'wire-p1-table': false,
    'wire-p2': false,
    'wire-p2-table': false,
    'seg-group-p1': false,
    'seg-group-p2': false,
  });
  const [selectedBinderId, setSelectedBinderId] = useState<string>('out-p1');

  // 디렉토리 우클릭 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<BinderContextMenuState | null>(null);

  const handleNodeContextMenu = (
    e: React.MouseEvent,
    node: { id: string; title: string; page?: number; isFolder?: boolean; isRoot?: boolean; slotId?: string }
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 200),
      id: node.id,
      title: node.title,
      page: node.page,
      isFolder: node.isFolder,
      isRoot: node.isRoot,
      slotId: node.slotId,
    });
  };

  // 컨텍스트 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!contextMenu) return;
    const handleCloseMenu = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('contextmenu', handleCloseMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('contextmenu', handleCloseMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  // 노드 접기/펼치기 토글
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ---------------- 1. 아웃라인 척추: 실제 elements.json 및 트리 계층 데이터 ---------------- //
  const outlineData = useMemo(() => {
    return [
      {
        id: 'out-root',
        title: documentTitle,
        level: 0,
        page: 1,
        type: 'folder' as const,
        slotCount: 14,
        children: [
          {
            id: 'out-p1',
            title: '1차 회의비 사용 내역 (P.1)',
            level: 1,
            page: 1,
            type: 'folder' as const,
            slotCount: 7,
            mappedSegment: 'seg-1 / seg-2 / seg-4',
            children: [
              {
                id: 'out-p1-table',
                title: '회의 기본정보 및 지출 내역 표',
                level: 2,
                page: 1,
                type: 'section' as const,
                slotCount: 6,
                mappedSegmentId: 'seg-2',
                mappedSlotRange: '#1 ~ #6',
                children: [
                  {
                    id: 'elem-p1-1',
                    title: '일    시',
                    value: '2018.11.08',
                    level: 3,
                    page: 1,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-2',
                    mappedSlotId: 's1',
                    slotNumber: 1,
                  },
                  {
                    id: 'elem-p1-2',
                    title: '장    소',
                    value: '6공학관 6108-1호',
                    level: 3,
                    page: 1,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-2',
                    mappedSlotId: 's2',
                    slotNumber: 2,
                  },
                  {
                    id: 'elem-p1-3',
                    title: '참 석 자',
                    value: '4명',
                    level: 3,
                    page: 1,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-2',
                    mappedSlotId: 's3',
                    slotNumber: 3,
                  },
                  {
                    id: 'elem-p1-4',
                    title: '안    건',
                    value: 'GPS + 동영상 촬영 및 프로그램 테스트 최종 확인',
                    level: 3,
                    page: 1,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-2',
                    mappedSlotId: 's4',
                    slotNumber: 4,
                  },
                  {
                    id: 'elem-p1-5',
                    title: '회의내용',
                    value: '1. 드론 비행 후 GPS 센서 정상 수집 확인 (3개 항목)',
                    level: 3,
                    page: 1,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-2',
                    mappedSlotId: 's5',
                    slotNumber: 5,
                  },
                  {
                    id: 'elem-p1-6',
                    title: '지출금액',
                    value: '₩ 40,000',
                    level: 3,
                    page: 1,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-2',
                    mappedSlotId: 's6',
                    slotNumber: 6,
                  },
                ],
              },
              {
                id: 'elem-p1-7',
                title: '증빙자료 첨부란 (신용카드/현금영수증)',
                value: '다과 및 사무용품 구입 영수증',
                level: 2,
                page: 1,
                type: 'document' as const,
                slotCount: 1,
                mappedSegmentId: 'seg-4',
                mappedSlotId: 's7',
                slotNumber: 7,
              },
            ],
          },
          {
            id: 'out-p2',
            title: '2차 회의비 사용 내역 (P.2)',
            level: 1,
            page: 2,
            type: 'folder' as const,
            slotCount: 7,
            mappedSegment: 'seg-5 / seg-6 / seg-8',
            children: [
              {
                id: 'out-p2-table',
                title: '회의 기본정보 및 지출 내역 표',
                level: 2,
                page: 2,
                type: 'section' as const,
                slotCount: 6,
                mappedSegmentId: 'seg-6',
                mappedSlotRange: '#8 ~ #13',
                children: [
                  {
                    id: 'elem-p2-1',
                    title: '일    시',
                    value: '2018.11.16',
                    level: 3,
                    page: 2,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-6',
                    mappedSlotId: 's8',
                    slotNumber: 8,
                  },
                  {
                    id: 'elem-p2-2',
                    title: '장    소',
                    value: '6공학관 6108-1호',
                    level: 3,
                    page: 2,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-6',
                    mappedSlotId: 's9',
                    slotNumber: 9,
                  },
                  {
                    id: 'elem-p2-3',
                    title: '참 석 자',
                    value: '3명',
                    level: 3,
                    page: 2,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-6',
                    mappedSlotId: 's10',
                    slotNumber: 10,
                  },
                  {
                    id: 'elem-p2-4',
                    title: '안    건',
                    value: '최종 점검, 결과보고서 작성',
                    level: 3,
                    page: 2,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-6',
                    mappedSlotId: 's11',
                    slotNumber: 11,
                  },
                  {
                    id: 'elem-p2-5',
                    title: '회의내용',
                    value: '1. 드론 최종 점검, 2. 결과보고서 작성 (2개 항목)',
                    level: 3,
                    page: 2,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-6',
                    mappedSlotId: 's12',
                    slotNumber: 12,
                  },
                  {
                    id: 'elem-p2-6',
                    title: '지출금액',
                    value: '₩ 29,000',
                    level: 3,
                    page: 2,
                    type: 'element' as const,
                    mappedSegmentId: 'seg-6',
                    mappedSlotId: 's13',
                    slotNumber: 13,
                  },
                ],
              },
              {
                id: 'elem-p2-7',
                title: '증빙자료 첨부란 (영수증 원본)',
                value: '다과 영수증 부착 영역',
                level: 2,
                page: 2,
                type: 'document' as const,
                slotCount: 1,
                mappedSegmentId: 'seg-8',
                mappedSlotId: 's14',
                slotNumber: 14,
              },
            ],
          },
        ],
      },
    ];
  }, [documentTitle]);

  // ---------------- 2. 세그먼트 척추: 세그먼트와 하위 Elements 및 슬롯 매핑 결합 ---------------- //
  const segmentGroups = useMemo(() => {
    return [
      {
        groupId: 'seg-group-p1',
        title: 'Page 1 세그먼트 (4개 원자 블록)',
        page: 1,
        segments: [
          {
            id: 'seg-1',
            page: 1,
            type: 'section' as const,
            label: '문서 제목',
            summary: '회의비 사용 내역 제목 헤더',
            box: '[87, 385, 107, 615]',
            mappedSlots: [],
            elements: [],
          },
          {
            id: 'seg-2',
            page: 1,
            type: 'table' as const,
            label: '회의 기본정보 및 지출 내역 표',
            summary: '일시(11.08), 장소, 참석자(4명), 안건, 지출금액',
            box: '[121, 122, 479, 878]',
            mappedSlots: ['s1', 's2', 's3', 's4', 's5', 's6'],
            slotRangeLabel: '슬롯 #1 ~ #6 매핑',
            elements: [
              { id: 'elem-p1-1', label: '일    시', value: '2018.11.08', slotId: 's1', slotNumber: 1 },
              { id: 'elem-p1-2', label: '장    소', value: '6공학관 6108-1호', slotId: 's2', slotNumber: 2 },
              { id: 'elem-p1-3', label: '참 석 자', value: '4명', slotId: 's3', slotNumber: 3 },
              { id: 'elem-p1-4', label: '안    건', value: 'GPS + 동영상 촬영 및 프로그램 테스트 최종 확인', slotId: 's4', slotNumber: 4 },
              { id: 'elem-p1-5', label: '회의내용', value: '드론 비행 후 센서 수집 및 테스트 (3개 항목)', slotId: 's5', slotNumber: 5 },
              { id: 'elem-p1-6', label: '지출금액', value: '₩ 40,000', slotId: 's6', slotNumber: 6 },
            ],
          },
          {
            id: 'seg-3',
            page: 1,
            type: 'list' as const,
            label: '11월 8일 회의 상세 내용 목록',
            summary: '1. 드론 비행 후 GPS 센서 정상 수집, 2. 최종 테스트',
            box: '[313, 122, 479, 878]',
            mappedSlots: ['s5'],
            slotRangeLabel: '슬롯 #5 매핑',
            elements: [
              { id: 'elem-p1-5-sub', label: '상세 회의 안건', value: '결과보고서 작성 회의', slotId: 's5', slotNumber: 5 },
            ],
          },
          {
            id: 'seg-4',
            page: 1,
            type: 'image' as const,
            label: '증빙자료 첨부란 (신용카드/현금영수증)',
            summary: '신용카드 영수증, 현금영수증 등 증빙자료 부착 및 보관',
            box: '[548, 122, 882, 878]',
            mappedSlots: ['s7'],
            slotRangeLabel: '슬롯 #7 매핑',
            elements: [
              { id: 'elem-p1-7', label: '증빙 영수증 부착', value: '다과 및 사무용품 구입 영수증', slotId: 's7', slotNumber: 7 },
            ],
          },
        ],
      },
      {
        groupId: 'seg-group-p2',
        title: 'Page 2 세그먼트 (4개 원자 블록)',
        page: 2,
        segments: [
          {
            id: 'seg-5',
            page: 2,
            type: 'section' as const,
            label: '문서 제목',
            summary: '회의비 사용 내역 제목 헤더',
            box: '[87, 385, 107, 615]',
            mappedSlots: [],
            elements: [],
          },
          {
            id: 'seg-6',
            page: 2,
            type: 'table' as const,
            label: '회의 기본정보 및 지출 내역 표',
            summary: '일시(11.16), 장소, 참석자(3명), 안건, 지출금액',
            box: '[121, 122, 520, 878]',
            mappedSlots: ['s8', 's9', 's10', 's11', 's12', 's13'],
            slotRangeLabel: '슬롯 #8 ~ #13 매핑',
            elements: [
              { id: 'elem-p2-1', label: '일    시', value: '2018.11.16', slotId: 's8', slotNumber: 8 },
              { id: 'elem-p2-2', label: '장    소', value: '6공학관 6108-1호', slotId: 's9', slotNumber: 9 },
              { id: 'elem-p2-3', label: '참 석 자', value: '3명', slotId: 's10', slotNumber: 10 },
              { id: 'elem-p2-4', label: '안    건', value: '최종 점검, 결과보고서 작성', slotId: 's11', slotNumber: 11 },
              { id: 'elem-p2-5', label: '회의내용', value: '최종 점검 회의 및 초안 작성', slotId: 's12', slotNumber: 12 },
              { id: 'elem-p2-6', label: '지출금액', value: '₩ 29,000', slotId: 's13', slotNumber: 13 },
            ],
          },
          {
            id: 'seg-7',
            page: 2,
            type: 'list' as const,
            label: '11월 16일 회의 상세 내용 목록',
            summary: '1. 드론 최종 점검, 2. 결과보고서 작성',
            box: '[313, 122, 520, 878]',
            mappedSlots: ['s12'],
            slotRangeLabel: '슬롯 #12 매핑',
            elements: [
              { id: 'elem-p2-5-sub', label: '상세 회의 안건', value: '드론 최종 점검 회의', slotId: 's12', slotNumber: 12 },
            ],
          },
          {
            id: 'seg-8',
            page: 2,
            type: 'image' as const,
            label: '증빙자료 첨부란 (영수증 원본)',
            summary: '다과 구입 영수증 부착 및 보관',
            box: '[580, 122, 882, 878]',
            mappedSlots: ['s14'],
            slotRangeLabel: '슬롯 #14 매핑',
            elements: [
              { id: 'elem-p2-7', label: '증빙 영수증 부착', value: '다과 영수증 원본', slotId: 's14', slotNumber: 14 },
            ],
          },
        ],
      },
    ];
  }, []);

  // ---------------- 3. 와이어프레임 척추: 페이지별 슬롯 그룹 및 매핑 트리 ---------------- //
  const wireframeTree = useMemo(() => {
    return [
      {
        id: 'wire-p1',
        title: 'Page 1 와이어프레임 (7개 슬롯)',
        page: 1,
        groups: [
          {
            id: 'wire-p1-table',
            title: '회의 기본정보 테이블 슬롯 그룹',
            mappedSegment: 'seg-2 (회의 기본정보 및 지출 내역 표)',
            slotRange: '#1 ~ #6',
            slots: [
              { id: 's1', number: 1, label: '회의 일시', mappedElement: 'elem-p1-1 (2018.11.08)', confidence: '99%' },
              { id: 's2', number: 2, label: '회의 장소', mappedElement: 'elem-p1-2 (6공학관 6108-1호)', confidence: '98%' },
              { id: 's3', number: 3, label: '참석자', mappedElement: 'elem-p1-3 (4명)', confidence: '99%' },
              { id: 's4', number: 4, label: '회의 안건', mappedElement: 'elem-p1-4 (GPS + 동영상 촬영)', confidence: '96%' },
              { id: 's5', number: 5, label: '회의 내용', mappedElement: 'elem-p1-5 (드론 비행 센서 수집)', confidence: '97%' },
              { id: 's6', number: 6, label: '지출금액', mappedElement: 'elem-p1-6 (₩ 40,000)', confidence: '99%' },
            ],
          },
          {
            id: 'wire-p1-proof',
            title: '증빙자료 첨부 슬롯 그룹',
            mappedSegment: 'seg-4 (증빙자료 첨부란)',
            slotRange: '#7',
            slots: [
              { id: 's7', number: 7, label: '증빙자료 영수증', mappedElement: 'elem-p1-7 (영수증 원본 부착)', confidence: '99%' },
            ],
          },
        ],
      },
      {
        id: 'wire-p2',
        title: 'Page 2 와이어프레임 (7개 슬롯)',
        page: 2,
        groups: [
          {
            id: 'wire-p2-table',
            title: '회의 기본정보 테이블 슬롯 그룹',
            mappedSegment: 'seg-6 (회의 기본정보 및 지출 내역 표)',
            slotRange: '#8 ~ #13',
            slots: [
              { id: 's8', number: 8, label: '회의 일시', mappedElement: 'elem-p2-1 (2018.11.16)', confidence: '99%' },
              { id: 's9', number: 9, label: '회의 장소', mappedElement: 'elem-p2-2 (6공학관 6108-1호)', confidence: '98%' },
              { id: 's10', number: 10, label: '참석자', mappedElement: 'elem-p2-3 (3명)', confidence: '99%' },
              { id: 's11', number: 11, label: '안건', mappedElement: 'elem-p2-4 (최종 점검, 결과보고서)', confidence: '96%' },
              { id: 's12', number: 12, label: '회의 내용', mappedElement: 'elem-p2-5 (초안 작성 회의)', confidence: '97%' },
              { id: 's13', number: 13, label: '지출금액', mappedElement: 'elem-p2-6 (₩ 29,000)', confidence: '99%' },
            ],
          },
          {
            id: 'wire-p2-proof',
            title: '증빙자료 첨부 슬롯 그룹',
            mappedSegment: 'seg-8 (증빙자료 첨부란)',
            slotRange: '#14',
            slots: [
              { id: 's14', number: 14, label: '증빙자료 영수증', mappedElement: 'elem-p2-7 (다과 영수증 부착)', confidence: '99%' },
            ],
          },
        ],
      },
    ];
  }, []);

  // 세그먼트 아이콘 헬퍼
  const renderSegmentIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <TableIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'list':
        return <ListIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  // 아웃라인 재귀 렌더러 (하위 Element까지 렌더링)
  const renderOutlineTree = (nodes: any[]) => {
    return nodes.map((node) => {
      const isCollapsed = collapsedNodes[node.id];
      const isSelected =
        selectedBinderId === node.id ||
        (Boolean(selectedSlotId) && Boolean(node.mappedSlotId) && node.mappedSlotId === selectedSlotId);
      const hasChildren = node.children && node.children.length > 0;
      const isLeafElement = node.type === 'element';
      const isPageOpen = hasChildren && node.page === activePageNumber;

      // 슬롯 소켓 바인딩 정보 조회
      const binding = node.mappedSlotId ? slotBindings?.[node.mappedSlotId] : undefined;
      const isDragOver = Boolean(node.mappedSlotId && dragOverSlotId === node.mappedSlotId);

      // 미할당 필터 적용 시, 이미 바인딩 완료된 엘리먼트는 숨김
      if (filterUnboundOnly && isLeafElement && binding && binding.status === 'bound') {
        return null;
      }

      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => {
              setSelectedBinderId(node.id);
              if (node.id === 'out-root') {
                onOpenScrivenings?.();
              } else if (node.mappedSlotId) {
                onSelectSlot?.(node.mappedSlotId, node.page, node.slotNumber);
                onSelectPage?.(node.page);
                if (binding) {
                  onOpenSlotProvenance?.(binding);
                }
              } else {
                onSelectPage?.(node.page);
              }
            }}
            onContextMenu={(e) =>
              handleNodeContextMenu(e, {
                id: node.id,
                title: node.title,
                page: node.page,
                isFolder: Boolean(hasChildren),
                isRoot: node.id === 'out-root',
                slotId: node.mappedSlotId,
              })
            }
            onDragOver={(e) => {
              if (node.mappedSlotId) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setDragOverSlotId(node.mappedSlotId);
              }
            }}
            onDragLeave={() => {
              if (node.mappedSlotId && dragOverSlotId === node.mappedSlotId) {
                setDragOverSlotId(null);
              }
            }}
            onDrop={(e) => {
              if (!node.mappedSlotId) return;
              e.preventDefault();
              setDragOverSlotId(null);

              const raw = e.dataTransfer.getData('application/json');
              if (raw) {
                try {
                  const data = JSON.parse(raw);
                  if (data.type === 'resource') {
                    onBindSlot?.(node.mappedSlotId, data.name, data.name, data.resourceId);
                    return;
                  }
                } catch {
                  // Fallthrough
                }
              }

              const plain = e.dataTransfer.getData('text/plain');
              if (plain) {
                onBindSlot?.(node.mappedSlotId, plain, '텍스트 드롭');
              }
            }}
            style={{ paddingLeft: `${node.level * 11 + 6}px` }}
            className={`
              flex items-center justify-between gap-1.5 py-1.5 pr-2 rounded-md text-xs cursor-pointer group transition-all
              ${
                isDragOver
                  ? 'bg-indigo-900/90 border-2 border-dashed border-indigo-400 text-indigo-100 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                  : isSelected
                  ? 'bg-indigo-950/80 text-indigo-200 font-medium border-l-2 border-indigo-500 pl-2'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
              }
            `}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleCollapse(node.id, e)}
                  className="p-0.5 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : isLeafElement ? (
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  {binding ? (
                    binding.status === 'bound' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] shrink-0" title="바인딩 완료" />
                    ) : binding.status === 'suggested' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.6)] shrink-0" title="추천 매핑 대기" />
                    ) : (
                      <span className="w-2 h-2 rounded-full border border-rose-400/80 bg-rose-950/40 shrink-0" title="미할당 빈 슬롯" />
                    )
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80" />
                  )}
                </span>
              ) : (
                <span className="w-3.5 h-3.5 shrink-0" />
              )}

              {hasChildren ? (
                isCollapsed ? (
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )
              ) : isLeafElement ? (
                <Tag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              )}

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`shrink-0 ${isLeafElement ? 'font-normal text-slate-300' : 'font-medium text-slate-200'}`}>
                    {node.title}
                  </span>
                  {binding ? (
                    binding.status === 'bound' ? (
                      <span className="truncate text-[10px] text-emerald-300 font-mono">
                        : {binding.currentValue || '(값 없음)'}
                        {binding.resourceName && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSlotProvenance?.(binding);
                            }}
                            className="text-emerald-400/90 hover:text-emerald-200 underline decoration-dotted cursor-pointer ml-1"
                            title="출처 확인"
                          >
                            [{binding.resourceName} - {binding.sourceLocation || '2p 17L'}]
                          </span>
                        )}
                      </span>
                    ) : binding.status === 'suggested' ? (
                      <span className="truncate text-[10px] text-amber-300/90 font-mono">
                        : 💡 {binding.suggestedValue}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSlotProvenance?.(binding);
                          }}
                          className="text-indigo-300/90 hover:text-indigo-100 underline decoration-dotted cursor-pointer ml-1"
                          title="출처 확인"
                        >
                          [{binding.resourceName || '사전 계획서.pdf'} - {binding.sourceLocation || '2p 17L'}]
                        </span>
                        {binding.confidence ? ` (${binding.confidence})` : ''}
                      </span>
                    ) : (
                      <span className="truncate text-[10px] text-rose-400/80 font-mono">
                        : [미할당 슬롯]
                      </span>
                    )
                  ) : node.value ? (
                    <span className="truncate text-[10px] text-slate-400 font-mono">
                      : {node.value}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* 우측 매핑 배지 및 페이지 & 인라인 액션 */}
            <div className="flex items-center gap-1 shrink-0 text-[10px]" onClick={(e) => e.stopPropagation()}>
              {isPageOpen && (
                <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] border border-indigo-500/40">
                  열림
                </span>
              )}

              {/* 슬롯 소켓 인라인 액션 버튼 */}
              {binding && (
                <>
                  {binding.status === 'bound' ? (
                    <div className="flex items-center gap-1">
                      {binding.resourceName && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSlotProvenance?.(binding);
                          }}
                          className="px-1 py-0.2 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-100 text-[9px] font-mono border border-emerald-700/60 flex items-center gap-0.5 truncate max-w-[85px] cursor-pointer transition-colors"
                          title={`출처: ${binding.resourceName} - ${binding.sourceLocation || '2p 17L'} (클릭하여 열기)`}
                        >
                          <Link2 className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{binding.resourceName}</span>
                        </button>
                      )}
                      {onUnbindSlot && (
                        <button
                          type="button"
                          onClick={() => onUnbindSlot(binding.slotId)}
                          className="px-1 py-0.2 rounded hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-700/60 cursor-pointer text-[10px]"
                          title="슬롯 매핑 해제"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : binding.status === 'suggested' ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSlotProvenance?.(binding);
                        }}
                        className="px-1 py-0.2 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-100 text-[9px] font-mono border border-indigo-700/60 flex items-center gap-0.5 truncate max-w-[85px] cursor-pointer transition-colors"
                        title={`출처: ${binding.resourceName || '사전 계획서.pdf'} - ${binding.sourceLocation || '2p 17L'} (클릭하여 열기)`}
                      >
                        <Link2 className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{binding.resourceName || '사전 계획서'}</span>
                      </button>
                      {onApplySuggested && (
                        <button
                          type="button"
                          onClick={() => onApplySuggested(binding.slotId)}
                          className="px-1.5 py-0.2 rounded bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 text-[9px] font-semibold border border-amber-500/40 flex items-center gap-0.5 cursor-pointer shadow-2xs transition-colors"
                          title={`추천값 즉시 승인 (${binding.suggestedValue})`}
                        >
                          <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                          <span>승인</span>
                        </button>
                      )}
                      {onUnbindSlot && (
                        <button
                          type="button"
                          onClick={() => onUnbindSlot(binding.slotId)}
                          className="px-1 py-0.2 rounded hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-700/60 cursor-pointer text-[10px]"
                          title="추천 거절 (빈 슬롯으로 초기화)"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="px-1 py-0.2 rounded bg-slate-900 text-slate-400 text-[9px] font-mono border border-dashed border-slate-700">
                      드롭대기
                    </span>
                  )}
                </>
              )}

              {node.slotNumber !== undefined ? (
                <span
                  className="px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-300 font-mono border border-emerald-800/40"
                  title={`와이어프레임 슬롯 #${node.slotNumber} 매핑`}
                >
                  #{node.slotNumber}
                </span>
              ) : node.slotCount !== undefined ? (
                <span className="px-1 py-0.2 rounded bg-indigo-950/60 text-indigo-300 font-mono">
                  {node.slotCount}슬롯
                </span>
              ) : null}
              <span className="px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono">
                P.{node.page}
              </span>
            </div>
          </div>

          {hasChildren && !isCollapsed && (
            <div className="flex flex-col">{renderOutlineTree(node.children)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 select-none overflow-hidden font-sans border-r border-slate-850">
      {/* 1. 바인더 헤더 & 정체성 */}
      <div className="h-10 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-200 tracking-wider truncate">
              BINDER
            </span>
            <span className="text-[9px] text-indigo-400/80 font-mono truncate">
              아웃라이너 & 조합기 (SSOT)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isLoadingStructure && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono mr-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>연동중</span>
            </span>
          )}
          {/* 레퍼런스 원본 DOC 열기 버튼 (좌측 슬라이드 패널) */}
          {onToggleReferenceDoc && (
            <button
              type="button"
              onClick={onToggleReferenceDoc}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-all ${
                isReferenceDocOpen
                  ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700/80'
              }`}
              title="레퍼런스 원본 DOC 패널 열기 (좌측 슬라이드 뷰)"
            >
              <BookOpen className="w-3 h-3 text-teal-400" />
              <span>레퍼런스 DOC</span>
            </button>
          )}
          {/* 전체 스크리브닝스(Scrivenings) 연속 뷰 열기 버튼 */}
          <button
            type="button"
            onClick={onOpenScrivenings}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-[10px] font-semibold border border-indigo-500/30 cursor-pointer transition-colors"
            title="모든 청크 연속 결합 에디터로 펼치기 (Scrivenings)"
          >
            <Layers className="w-3 h-3" />
            <span>조합 뷰</span>
          </button>
        </div>
      </div>

      {/* 2. 척추 스위처 (SpineSwitcher: Outline ↔ Segment ↔ Slots ↔ Explorer) */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-925/50 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => handleSpineChange('outline')}
            className={`py-1 text-[11px] font-medium rounded transition-all cursor-pointer text-center ${
              activeSpine === 'outline'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            목차 아웃라인
          </button>
          <button
            type="button"
            onClick={() => handleSpineChange('segment')}
            className={`py-1 text-[11px] font-medium rounded transition-all cursor-pointer text-center ${
              activeSpine === 'segment'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            세그먼트
          </button>
          <button
            type="button"
            onClick={() => handleSpineChange('slots')}
            className={`py-1 text-[11px] font-medium rounded transition-all cursor-pointer text-center ${
              activeSpine === 'slots'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            와이어 슬롯
          </button>
        </div>

        {/* 2-1. 슬롯 소켓 매핑 진행률 HUD (Progress Bar & Stats) */}
        <div className="mt-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Boxes className="w-3.5 h-3.5 text-indigo-400" />
              <span>슬롯 매핑 진행률</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${slotStats.percentage === 100 ? 'text-emerald-400' : 'text-indigo-300'}`}>
                {slotStats.bound} / {slotStats.total}
              </span>
              <span className="text-slate-500">({slotStats.percentage}%)</span>
            </div>
          </div>

          {/* 비주얼 프로그레스 게이지 */}
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                slotStats.percentage === 100
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400'
              }`}
              style={{ width: `${Math.max(4, slotStats.percentage)}%` }}
            />
          </div>

          {/* 퀵 액션 버튼 바: [추천 일괄 적용] [초기화] [필터] */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60 text-[10px]">
            <div className="flex items-center gap-1">
              {onApplyAllSuggestions && (
                <button
                  type="button"
                  onClick={onApplyAllSuggestions}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-semibold cursor-pointer shadow-2xs transition-colors"
                  title="모든 빈 슬롯에 AI/레퍼런스 추천 데이터 일괄 주입"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>추천 일괄적용</span>
                </button>
              )}
              {onResetAllSlots && (
                <button
                  type="button"
                  onClick={onResetAllSlots}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/60 cursor-pointer transition-colors"
                  title="모든 슬롯을 빈 소켓으로 초기화"
                >
                  초기화
                </button>
              )}
            </div>

            {/* 미할당만 보기 필터 토글 */}
            <button
              type="button"
              onClick={() => setFilterUnboundOnly((prev) => !prev)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer transition-colors ${
                filterUnboundOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
              title="미할당 슬롯만 필터링하여 확인"
            >
              {filterUnboundOnly ? '미할당만' : '전체 보기'}
            </button>
          </div>
        </div>

        {/* 2-2. 디렉토리 우클릭 탭 열기 힌트 바 */}
        <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate flex items-center gap-1">
            <MousePointerClick className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="text-slate-400 text-[9px]">
              우클릭: <span className="text-indigo-300 font-semibold">탭 열기</span> / 우측 리소스 드롭
            </span>
          </span>
          {activePageNumber ? (
            <span className="px-1 py-0.2 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-mono text-[9px]">
              P.{activePageNumber} 활성
            </span>
          ) : null}
        </div>
      </div>

      {/* 3. 메인 바인더 트리 뷰 영역 (전체 문서 고정 구조) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* 모드 1: 목차 아웃라인 척추 (Outline Hierarchy with Sub-Elements) */}
        {activeSpine === 'outline' && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
              <span>아웃라인 및 하위 엘리먼트 트리</span>
              <span className="text-slate-600 font-mono">
                {totalOutlineElementsCount}개 엘리먼트 (P.1~P.2)
              </span>
            </div>
            {renderOutlineTree(outlineData)}
          </div>
        )}

        {/* 모드 2: 세그먼트 원자 블록 척추 (Segment Pieces with Mapped Elements) */}
        {activeSpine === 'segment' && (
          <div className="space-y-2">
            <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
              <span>원자 세그먼트 & 매핑 엘리먼트 ({totalSegmentsCount}블록)</span>
              <span className="text-slate-600 font-mono">P.1 - P.2</span>
            </div>

            {segmentGroups.map((group) => {
              const isGroupCollapsed = collapsedNodes[group.groupId];
              const isPageOpen = group.page === activePageNumber;
              return (
                <div key={group.groupId} className="space-y-1">
                  <div
                    onClick={(e) => toggleCollapse(group.groupId, e)}
                    onContextMenu={(e) =>
                      handleNodeContextMenu(e, {
                        id: group.groupId,
                        title: group.title,
                        page: group.page,
                        isFolder: true,
                      })
                    }
                    className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-900 cursor-pointer text-xs text-slate-300 font-semibold"
                  >
                    <div className="flex items-center gap-1.5">
                      {isGroupCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <Folder className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{group.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isPageOpen && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/40">
                          열림
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono">
                        P.{group.page}
                      </span>
                    </div>
                  </div>

                  {!isGroupCollapsed && (
                    <div className="space-y-1 pl-2">
                      {group.segments.map((seg) => {
                        const isSelected = selectedBinderId === seg.id;
                        const hasElements = seg.elements && seg.elements.length > 0;
                        const isSegCollapsed = collapsedNodes[seg.id];

                        return (
                          <div key={seg.id} className="space-y-0.5">
                            <div
                              onClick={() => {
                                setSelectedBinderId(seg.id);
                                onSelectPage?.(seg.page);
                              }}
                              onContextMenu={(e) =>
                                handleNodeContextMenu(e, {
                                  id: seg.id,
                                  title: seg.label,
                                  page: seg.page,
                                  isFolder: Boolean(hasElements),
                                })
                              }
                              className={`
                                flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-md text-xs cursor-pointer group transition-colors
                                ${
                                  isSelected
                                    ? 'bg-indigo-950/80 text-indigo-200 font-medium border-l-2 border-indigo-500'
                                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                                }
                              `}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {hasElements ? (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleCollapse(seg.id, e)}
                                    className="p-0.5 rounded text-slate-400 hover:text-slate-200"
                                  >
                                    {isSegCollapsed ? (
                                      <ChevronRight className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-3 h-3 shrink-0" />
                                )}
                                {renderSegmentIcon(seg.type)}
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-medium text-slate-200">
                                      {seg.label}
                                    </span>
                                    <span className="text-[9px] px-1 rounded bg-slate-850 text-slate-400 font-mono">
                                      {seg.id}
                                    </span>
                                  </div>
                                  <span className="truncate text-[10px] text-slate-500">
                                    {seg.summary}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-[10px]">
                                {seg.slotRangeLabel && (
                                  <span className="px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-300 text-[9px] font-mono border border-emerald-800/40">
                                    {seg.slotRangeLabel}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 하위 매핑된 Elements 인라인 전개 */}
                            {hasElements && !isSegCollapsed && (
                              <div className="pl-6 space-y-0.5 border-l border-slate-800/60 ml-3.5 my-0.5">
                                {seg.elements.map((el) => {
                                  const isElementSelected =
                                    selectedBinderId === el.id ||
                                    (Boolean(selectedSlotId) && Boolean(el.slotId) && el.slotId === selectedSlotId);
                                  return (
                                    <div
                                      key={el.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBinderId(el.id);
                                        onSelectSlot?.(el.slotId, seg.page, el.slotNumber);
                                        onSelectPage?.(seg.page);
                                      }}
                                      onContextMenu={(e) =>
                                        handleNodeContextMenu(e, {
                                          id: el.id,
                                          title: el.label,
                                          page: seg.page,
                                          isFolder: false,
                                          slotId: el.slotId,
                                        })
                                      }
                                      className={`
                                        flex items-center justify-between px-2 py-1 rounded cursor-pointer text-[11px] group transition-colors
                                        ${
                                          isElementSelected
                                            ? 'bg-indigo-950/80 text-indigo-200 font-medium border-l-2 border-indigo-500 pl-1.5'
                                            : 'text-slate-300 hover:bg-slate-855/80'
                                        }
                                      `}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                        <span className="font-medium text-slate-300 truncate">{el.label}</span>
                                        <span className="text-[10px] text-slate-500 truncate font-mono">: {el.value}</span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="px-1 py-0.1 rounded bg-emerald-950/50 text-emerald-300 font-mono text-[9px]">
                                          #{el.slotNumber}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 모드 3: 와이어프레임 슬롯 소켓 척추 (Wireframe Slot Hierarchy) */}
        {activeSpine === 'slots' && (
          <div className="space-y-2">
            <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
              <span>와이어프레임 슬롯 계층 트리 ({totalSlotsCount}슬롯)</span>
              <span className="text-emerald-400 font-mono">100% 매핑</span>
            </div>

            {wireframeTree.map((pageWire) => {
              const isPageCollapsed = collapsedNodes[pageWire.id];
              const isPageOpen = pageWire.page === activePageNumber;
              return (
                <div key={pageWire.id} className="space-y-1">
                  <div
                    onClick={(e) => toggleCollapse(pageWire.id, e)}
                    onContextMenu={(e) =>
                      handleNodeContextMenu(e, {
                        id: pageWire.id,
                        title: pageWire.title,
                        page: pageWire.page,
                        isFolder: true,
                      })
                    }
                    className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-900 cursor-pointer text-xs text-slate-300 font-semibold"
                  >
                    <div className="flex items-center gap-1.5">
                      {isPageCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{pageWire.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isPageOpen && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/40">
                          열림
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono">
                        P.{pageWire.page}
                      </span>
                    </div>
                  </div>

                  {!isPageCollapsed && (
                    <div className="space-y-1.5 pl-2">
                      {pageWire.groups.map((group) => {
                        const isGroupCollapsed = collapsedNodes[group.id];
                        return (
                          <div key={group.id} className="space-y-0.5">
                            {/* 슬롯 그룹 컨테이너 헤더 */}
                            <div
                              onClick={(e) => toggleCollapse(group.id, e)}
                              onContextMenu={(e) =>
                                handleNodeContextMenu(e, {
                                  id: group.id,
                                  title: group.title,
                                  page: pageWire.page,
                                  isFolder: true,
                                })
                              }
                              className="flex items-center justify-between px-2 py-1 rounded bg-slate-925 hover:bg-slate-900/90 cursor-pointer text-[11px] text-slate-200"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isGroupCollapsed ? (
                                  <ChevronRight className="w-3 h-3 text-slate-500" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-slate-500" />
                                )}
                                <TableIcon className="w-3 h-3 text-blue-400 shrink-0" />
                                <span className="font-medium truncate">{group.title}</span>
                              </div>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-950/60 text-blue-300 font-mono border border-blue-800/40 shrink-0">
                                {group.slotRange}
                              </span>
                            </div>

                            {/* 개별 슬롯 렌더링 */}
                            {!isGroupCollapsed && (
                              <div className="pl-4 space-y-0.5 border-l border-slate-800/80 ml-2.5 my-0.5">
                                {group.slots.map((s) => {
                                  const binding = slotBindings?.[s.id];
                                  const isSelected =
                                    selectedBinderId === s.id ||
                                    (Boolean(selectedSlotId) && Boolean(s.id) && s.id === selectedSlotId);
                                  const isDragOver = dragOverSlotId === s.id;

                                  if (filterUnboundOnly && binding && binding.status === 'bound') {
                                    return null;
                                  }

                                  return (
                                    <div
                                      key={s.id}
                                      onClick={() => {
                                        setSelectedBinderId(s.id);
                                        onSelectSlot?.(s.id, pageWire.page, s.number);
                                        onSelectPage?.(pageWire.page);
                                        if (binding) {
                                          onOpenSlotProvenance?.(binding);
                                        }
                                      }}
                                      onContextMenu={(e) =>
                                        handleNodeContextMenu(e, {
                                          id: s.id,
                                          title: s.label,
                                          page: pageWire.page,
                                          isFolder: false,
                                          slotId: s.id,
                                        })
                                      }
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'copy';
                                        setDragOverSlotId(s.id);
                                      }}
                                      onDragLeave={() => {
                                        if (dragOverSlotId === s.id) {
                                          setDragOverSlotId(null);
                                        }
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOverSlotId(null);

                                        const raw = e.dataTransfer.getData('application/json');
                                        if (raw) {
                                          try {
                                            const data = JSON.parse(raw);
                                            if (data.type === 'resource') {
                                              onBindSlot?.(s.id, data.name, data.name, data.resourceId);
                                              return;
                                            }
                                          } catch {
                                            // Fallthrough
                                          }
                                        }

                                        const plain = e.dataTransfer.getData('text/plain');
                                        if (plain) {
                                          onBindSlot?.(s.id, plain, '텍스트 드롭');
                                        }
                                      }}
                                      className={`
                                        flex items-center justify-between gap-1.5 px-2 py-1 rounded text-xs cursor-pointer group transition-all
                                        ${
                                          isDragOver
                                            ? 'bg-indigo-900/90 border-2 border-dashed border-indigo-400 text-indigo-100 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                                            : isSelected
                                            ? 'bg-indigo-950/80 text-indigo-200 font-medium border-l-2 border-indigo-500'
                                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                                        }
                                      `}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-slate-850 border border-slate-750 text-[10px] font-mono text-indigo-400 font-bold shrink-0">
                                          #{s.number}
                                        </span>
                                        {binding ? (
                                          binding.status === 'bound' ? (
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] shrink-0" title="바인딩 완료" />
                                          ) : binding.status === 'suggested' ? (
                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.6)] shrink-0" title="추천 매핑 대기" />
                                          ) : (
                                            <span className="w-2 h-2 rounded-full border border-rose-400/80 bg-rose-950/40 shrink-0" title="미할당 빈 슬롯" />
                                          )
                                        ) : null}
                                        <div className="flex flex-col min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-slate-200 font-medium shrink-0">{s.label}</span>
                                            {binding ? (
                                              binding.status === 'bound' ? (
                                                <span className="truncate text-[10px] text-emerald-300 font-mono">
                                                  : {binding.currentValue || '(값 없음)'}
                                                  {binding.resourceName && (
                                                    <span
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenSlotProvenance?.(binding);
                                                      }}
                                                      className="text-emerald-400/90 hover:text-emerald-200 underline decoration-dotted cursor-pointer ml-1"
                                                      title="출처 확인"
                                                    >
                                                      [{binding.resourceName} - {binding.sourceLocation || '2p 17L'}]
                                                    </span>
                                                  )}
                                                </span>
                                              ) : binding.status === 'suggested' ? (
                                                <span className="truncate text-[10px] text-amber-300/90 font-mono">
                                                  : 💡 {binding.suggestedValue}
                                                  <span
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      onOpenSlotProvenance?.(binding);
                                                    }}
                                                    className="text-indigo-300/90 hover:text-indigo-100 underline decoration-dotted cursor-pointer ml-1"
                                                    title="출처 확인"
                                                  >
                                                    [{binding.resourceName || '사전 계획서.pdf'} - {binding.sourceLocation || '2p 17L'}]
                                                  </span>
                                                  {binding.confidence ? ` (${binding.confidence})` : ''}
                                                </span>
                                              ) : (
                                                <span className="truncate text-[10px] text-rose-400/80 font-mono">
                                                  : [미할당 슬롯]
                                                </span>
                                              )
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0 text-[10px]" onClick={(e) => e.stopPropagation()}>
                                        {binding ? (
                                          binding.status === 'bound' ? (
                                            <div className="flex items-center gap-1">
                                              {binding.resourceName && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenSlotProvenance?.(binding);
                                                  }}
                                                  className="px-1 py-0.2 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-100 text-[9px] font-mono border border-emerald-700/60 flex items-center gap-0.5 truncate max-w-[85px] cursor-pointer transition-colors"
                                                  title={`출처: ${binding.resourceName} - ${binding.sourceLocation || '2p 17L'} (클릭하여 열기)`}
                                                >
                                                  <Link2 className="w-2.5 h-2.5 shrink-0" />
                                                  <span className="truncate">{binding.resourceName}</span>
                                                </button>
                                              )}
                                              {onUnbindSlot && (
                                                <button
                                                  type="button"
                                                  onClick={() => onUnbindSlot(binding.slotId)}
                                                  className="px-1 py-0.2 rounded hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-700/60 cursor-pointer text-[10px]"
                                                  title="슬롯 매핑 해제"
                                                >
                                                  ✕
                                                </button>
                                              )}
                                            </div>
                                          ) : binding.status === 'suggested' ? (
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onOpenSlotProvenance?.(binding);
                                                }}
                                                className="px-1 py-0.2 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-100 text-[9px] font-mono border border-indigo-700/60 flex items-center gap-0.5 truncate max-w-[85px] cursor-pointer transition-colors"
                                                title={`출처: ${binding.resourceName || '사전 계획서.pdf'} - ${binding.sourceLocation || '2p 17L'} (클릭하여 열기)`}
                                              >
                                                <Link2 className="w-2.5 h-2.5 shrink-0" />
                                                <span className="truncate">{binding.resourceName || '사전 계획서'}</span>
                                              </button>
                                              {onApplySuggested && (
                                                <button
                                                  type="button"
                                                  onClick={() => onApplySuggested(binding.slotId)}
                                                  className="px-1.5 py-0.2 rounded bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 text-[9px] font-semibold border border-amber-500/40 flex items-center gap-0.5 cursor-pointer shadow-2xs transition-colors"
                                                  title={`추천값 즉시 승인 (${binding.suggestedValue})`}
                                                >
                                                  <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                                                  <span>승인</span>
                                                </button>
                                              )}
                                              {onUnbindSlot && (
                                                <button
                                                  type="button"
                                                  onClick={() => onUnbindSlot(binding.slotId)}
                                                  className="px-1 py-0.2 rounded hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-700/60 cursor-pointer text-[10px]"
                                                  title="추천 거절 (빈 슬롯으로 초기화)"
                                                >
                                                  ✕
                                                </button>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="px-1 py-0.2 rounded bg-slate-900 text-slate-400 text-[9px] font-mono border border-dashed border-slate-700">
                                              드롭대기
                                            </span>
                                          )
                                        ) : (
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title={`매핑 신뢰도: ${s.confidence}`} />
                                        )}
                                      </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}

        {/* 모드 4: 파일 시스템 탐색기 (기존 호환) */}
        {activeSpine === 'explorer' && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
              <span>디스크 파일 탐색기</span>
            </div>
            {fileTree.map((node) => (
              <div
                key={node.id}
                onClick={() => onOpenFile(node)}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800/60 rounded cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{node.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* 5. 디렉토리 우클릭 컨텍스트 메뉴 (Right Click Context Menu) */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[220px] py-1.5 px-1 bg-slate-900/95 border border-slate-750 rounded-lg shadow-2xl backdrop-blur-md text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 font-sans select-none"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-300 border-b border-slate-800 mb-1 flex items-center gap-1.5 truncate">
            {contextMenu.isFolder ? (
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            )}
            <span className="truncate">{contextMenu.title}</span>
          </div>

          {/* 1. 탭으로 열기 (Open in Tab) */}
          {contextMenu.page ? (
            <button
              type="button"
              onClick={() => {
                if (onOpenPageTab) {
                  onOpenPageTab(contextMenu.page!, 'pane1');
                } else {
                  onSelectPage?.(contextMenu.page!);
                }
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-indigo-600 hover:text-white text-slate-200 transition-colors cursor-pointer group"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white shrink-0" />
              <span className="font-medium truncate">탭으로 열기 (Page {contextMenu.page}.canvas)</span>
            </button>
          ) : contextMenu.isRoot ? (
            <button
              type="button"
              onClick={() => {
                onOpenScrivenings?.();
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-indigo-600 hover:text-white text-slate-200 transition-colors cursor-pointer group"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white shrink-0" />
              <span className="font-medium truncate">전체 조합 뷰 탭으로 열기</span>
            </button>
          ) : null}

          {/* 2. 우측 분할 탭으로 열기 (Open to Side) */}
          {contextMenu.page ? (
            <button
              type="button"
              onClick={() => {
                if (onOpenPageTab) {
                  onOpenPageTab(contextMenu.page!, 'pane2');
                } else {
                  onSelectPage?.(contextMenu.page!);
                }
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-indigo-600 hover:text-white text-slate-200 transition-colors cursor-pointer group"
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-blue-400 group-hover:text-white shrink-0" />
              <span className="font-medium truncate">우측 분할 창에서 열기</span>
            </button>
          ) : null}

          {/* 슬롯 소켓 전용 우클릭 메뉴 */}
          {contextMenu.slotId && (
            <>
              <div className="my-1 border-t border-slate-800" />
              {onApplySuggested && (
                <button
                  type="button"
                  onClick={() => {
                    onApplySuggested(contextMenu.slotId!);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-amber-600 hover:text-white text-amber-300 transition-colors cursor-pointer group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:text-white shrink-0" />
                  <span className="font-medium truncate">💡 추천 데이터 승인 및 매핑</span>
                </button>
              )}
              {onUnbindSlot && (
                <button
                  type="button"
                  onClick={() => {
                    onUnbindSlot(contextMenu.slotId!);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-rose-900/80 hover:text-white text-slate-300 transition-colors cursor-pointer group"
                >
                  <span className="text-rose-400 font-bold">✕</span>
                  <span className="truncate">슬롯 매핑 해제 (빈 소켓으로 리셋)</span>
                </button>
              )}
            </>
          )}

          {/* 3. 하위 노드 펼치기 / 접기 토글 (폴더인 경우) */}
          {contextMenu.isFolder && (
            <>
              <div className="my-1 border-t border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setCollapsedNodes((prev) => ({ ...prev, [contextMenu.id]: !prev[contextMenu.id] }));
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {collapsedNodes[contextMenu.id] ? '하위 노드 펼치기' : '하위 노드 접기'}
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
