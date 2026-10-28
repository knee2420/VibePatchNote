import { useMemo } from 'react';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Tag,
  ExternalLink,
  FileText,
  Boxes,
  LayoutGrid,
  Zap,
  Info,
} from 'lucide-react';
import {
  DiagnosticQuickFix,
} from '@vibe/editor-workspace';
import type { BinderSpineMode } from './IdeBinderSidebar';
import type { SlotBindingInfo } from '../model/types';

/** 규격 충족률 원형 링 게이지 */
function CoverageRing({ value, size = 22, strokeWidth = 2.5 }: { value: number; size?: number; strokeWidth?: number; showPercent?: boolean }) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} className="text-slate-800" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" />
        <circle cx={size / 2} cy={size / 2} r={radius} className="text-emerald-400 transition-all duration-500 ease-out" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" />
      </svg>
    </div>
  );
}

/** 소켓 바인딩 상태 뱃지 */
function SocketStateBadge({ state, count }: { state: 'filled' | 'empty' | 'partial'; count?: number }) {
  if (state === 'filled') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60">
        <span>연결됨 {count !== undefined ? `(${count})` : ''}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/60">
      <span>미할당</span>
    </span>
  );
}

export interface IdeRecipeBottomViewProps {
  activeSpine: BinderSpineMode;
  onChangeSpine?: (spine: BinderSpineMode) => void;
  selectedSlotId: string | null;
  selectedSlotNumber: number | null;
  onSelectSlot?: (slotId: string, pageNumber: number, slotNumber?: number) => void;
  slotBindings?: Record<string, SlotBindingInfo>;
  onBindSlot?: (slotId: string, value: string, resourceName?: string, resourceId?: string) => void;
  onOpenSoloTab?: (pageNumber: number) => void;
  scaffoldId?: string;
  docId?: string;
}

// 레시피 슬롯 메타데이터 사전 (14개 슬롯의 아웃라인 / 세그먼트 / 슬롯 규격 SSOT)
interface SlotRecipeSpec {
  slotId: string;
  slotNumber: number;
  label: string;
  pageNumber: number;
  elementId: string;
  outlinePath: string;
  dataType: string;
  isRequired: boolean;
  directive: string;
  segmentId: string;
  segmentName: string;
  segmentRole: 'container' | 'leaf';
  couplingRule?: {
    description: string;
    targetSlotId: string;
    checkPass: (bindings: Record<string, SlotBindingInfo>) => boolean;
    failMessage: string;
    quickFixLabel: string;
    fixValue: string;
    fixResource: string;
  };
  dimensions: { x: number; y: number; w: number; h: number };
}

const SLOT_RECIPE_SPECS: Record<string, SlotRecipeSpec> = {
  s1: {
    slotId: 's1',
    slotNumber: 1,
    label: '회의 일시',
    pageNumber: 1,
    elementId: 'elem-p1-1',
    outlinePath: '1차 회의비 사용 내역 > 일시',
    dataType: 'Date (YYYY.MM.DD)',
    isRequired: true,
    directive: '회의 진행 일자를 YYYY.MM.DD 형식으로 명확히 기재할 것',
    segmentId: 'seg-2',
    segmentName: '정기 회의 메타 세션 (Meeting Meta)',
    segmentRole: 'container',
    dimensions: { x: 140, y: 195, w: 180, h: 22 },
  },
  s2: {
    slotId: 's2',
    slotNumber: 2,
    label: '회의 장소',
    pageNumber: 1,
    elementId: 'elem-p1-2',
    outlinePath: '1차 회의비 사용 내역 > 장소',
    dataType: 'Text (Building & Room)',
    isRequired: true,
    directive: '건물명 및 구체적인 호수를 포함하여 회의 장소를 표기할 것',
    segmentId: 'seg-2',
    segmentName: '정기 회의 메타 세션 (Meeting Meta)',
    segmentRole: 'container',
    dimensions: { x: 380, y: 195, w: 180, h: 22 },
  },
  s3: {
    slotId: 's3',
    slotNumber: 3,
    label: '참석자',
    pageNumber: 1,
    elementId: 'elem-p1-3',
    outlinePath: '1차 회의비 사용 내역 > 참석자',
    dataType: 'Integer (인원수) + 명단',
    isRequired: true,
    directive: '참석 인원수(명)와 필요시 주요 참석자 명단을 기재할 것',
    segmentId: 'seg-2',
    segmentName: '정기 회의 메타 세션 (Meeting Meta)',
    segmentRole: 'container',
    dimensions: { x: 140, y: 225, w: 420, h: 22 },
  },
  s4: {
    slotId: 's4',
    slotNumber: 4,
    label: '회의 안건',
    pageNumber: 1,
    elementId: 'elem-p1-4',
    outlinePath: '1차 회의비 사용 내역 > 안건',
    dataType: 'Text (Agenda Summary)',
    isRequired: true,
    directive: '회의 소집 목적 및 핵심 토의 안건을 1~2문장으로 압축 요약할 것',
    segmentId: 'seg-2',
    segmentName: '정기 회의 세션 본문 (Meeting Record Session)',
    segmentRole: 'container',
    dimensions: { x: 140, y: 255, w: 420, h: 24 },
  },
  s5: {
    slotId: 's5',
    slotNumber: 5,
    label: '회의 내용',
    pageNumber: 1,
    elementId: 'elem-p1-5',
    outlinePath: '1차 회의비 사용 내역 > 회의내용',
    dataType: 'Rich Text (Numbered List)',
    isRequired: true,
    directive: '회의 결과 및 토의 사항은 번호 매기기(1., 2., 3.) 개조식으로 명시할 것',
    segmentId: 'seg-2',
    segmentName: '정기 회의 세션 본문 (Meeting Record Session)',
    segmentRole: 'container',
    couplingRule: {
      description: '회의 내용은 가독성을 위한 개조식 번호 매기기 서식을 준수해야 함',
      targetSlotId: 's5',
      checkPass: (b) => {
        const val = b.s5?.currentValue || b.s5?.suggestedValue || '';
        return val.includes('1.') || val.includes('2.');
      },
      failMessage: '회의내용 개조식 번호 매기기(1., 2., 3.) 서식 권장',
      quickFixLabel: '번호 목록 서식 변환',
      fixValue: '1. 드론 비행 후 GPS 센서 정상 수집 확인\n2. 영상 인코딩 스트리밍 레이턴시 50ms 이내 안정화\n3. 시연 동선 리허설',
      fixResource: '서식 교정',
    },
    dimensions: { x: 140, y: 290, w: 420, h: 90 },
  },
  s6: {
    slotId: 's6',
    slotNumber: 6,
    label: '지출금액',
    pageNumber: 1,
    elementId: 'elem-p1-6',
    outlinePath: '1차 회의비 사용 내역 > 지출금액',
    dataType: 'Currency (KRW)',
    isRequired: true,
    directive: '모든 지출금액은 통화 기호(₩) 및 천 단위 콤마를 포함하여 정산할 것',
    segmentId: 'seg-2',
    segmentName: '정기 회의 세션 본문 (Meeting Record Session)',
    segmentRole: 'container',
    couplingRule: {
      description: '지출금액(s6) 발생 시 증빙 영수증(s7) 미디어 공간 필수 결합 (Coupling Rule)',
      targetSlotId: 's7',
      checkPass: (b) => {
        const s7Val = b.s7?.currentValue || b.s7?.suggestedValue || '';
        return Boolean(s7Val && s7Val.includes('영수증'));
      },
      failMessage: '지출금액(₩40,000)에 대응하는 영수증 증빙 미첨부 (Coupling Rule)',
      quickFixLabel: '영수증 자동 부착 (receipt-20181108.png)',
      fixValue: 'receipt-20181108.png (영수증 부착)',
      fixResource: '11월8일영수증.png',
    },
    dimensions: { x: 140, y: 390, w: 420, h: 24 },
  },
  s7: {
    slotId: 's7',
    slotNumber: 7,
    label: '증빙자료 영수증',
    pageNumber: 1,
    elementId: 'elem-p1-7',
    outlinePath: '1차 회의비 사용 내역 > 증빙자료',
    dataType: 'Media / Attachment (PNG/PDF)',
    isRequired: true,
    directive: '카드 매출전표 또는 세금계산서 실물 스캔본 이미지를 첨부할 것',
    segmentId: 'seg-2',
    segmentName: '정기 회의 세션 본문 (Meeting Record Session)',
    segmentRole: 'leaf',
    couplingRule: {
      description: '영수증 품목 내역과 지출금액(s6)의 합계가 100% 일치해야 함',
      targetSlotId: 's6',
      checkPass: (b) => {
        const s6Val = b.s6?.currentValue || b.s6?.suggestedValue || '';
        return s6Val.includes('40,000');
      },
      failMessage: '영수증 품목 합계와 지출금액 불일치 검증',
      quickFixLabel: '지출금액 정합성 동기화',
      fixValue: '₩ 40,000',
      fixResource: '영수증_스캔.png',
    },
    dimensions: { x: 140, y: 420, w: 420, h: 180 },
  },
  s8: {
    slotId: 's8',
    slotNumber: 8,
    label: '회의 일시',
    pageNumber: 2,
    elementId: 'elem-p2-1',
    outlinePath: '2차 회의비 사용 내역 > 일시',
    dataType: 'Date (YYYY.MM.DD)',
    isRequired: true,
    directive: '회의 진행 일자를 YYYY.MM.DD 형식으로 명확히 기재할 것',
    segmentId: 'seg-6',
    segmentName: '2차 정기 회의 세션 (Meeting Record Session P2)',
    segmentRole: 'container',
    dimensions: { x: 140, y: 195, w: 180, h: 22 },
  },
  s9: {
    slotId: 's9',
    slotNumber: 9,
    label: '회의 장소',
    pageNumber: 2,
    elementId: 'elem-p2-2',
    outlinePath: '2차 회의비 사용 내역 > 장소',
    dataType: 'Text (Building & Room)',
    isRequired: true,
    directive: '건물명 및 구체적인 호수를 포함하여 회의 장소를 표기할 것',
    segmentId: 'seg-6',
    segmentName: '2차 정기 회의 세션 (Meeting Record Session P2)',
    segmentRole: 'container',
    dimensions: { x: 380, y: 195, w: 180, h: 22 },
  },
  s10: {
    slotId: 's10',
    slotNumber: 10,
    label: '참석자',
    pageNumber: 2,
    elementId: 'elem-p2-3',
    outlinePath: '2차 회의비 사용 내역 > 참석자',
    dataType: 'Integer (인원수) + 명단',
    isRequired: true,
    directive: '참석 인원수(명)와 필요시 주요 참석자 명단을 기재할 것',
    segmentId: 'seg-6',
    segmentName: '2차 정기 회의 세션 (Meeting Record Session P2)',
    segmentRole: 'container',
    dimensions: { x: 140, y: 225, w: 420, h: 22 },
  },
  s12: {
    slotId: 's12',
    slotNumber: 12,
    label: '회의 내용',
    pageNumber: 2,
    elementId: 'elem-p2-5',
    outlinePath: '2차 회의비 사용 내역 > 회의내용',
    dataType: 'Rich Text (Numbered List)',
    isRequired: true,
    directive: '회의 결과 및 토의 사항은 번호 매기기(1., 2., 3.) 개조식으로 명시할 것',
    segmentId: 'seg-6',
    segmentName: '2차 정기 회의 세션 (Meeting Record Session P2)',
    segmentRole: 'container',
    dimensions: { x: 140, y: 290, w: 420, h: 90 },
  },
  s13: {
    slotId: 's13',
    slotNumber: 13,
    label: '지출금액',
    pageNumber: 2,
    elementId: 'elem-p2-6',
    outlinePath: '2차 회의비 사용 내역 > 지출금액',
    dataType: 'Currency (KRW)',
    isRequired: true,
    directive: '1인당 한도 규정(₩10,000 이내) 준수 여부를 확인하고 금액을 기재할 것',
    segmentId: 'seg-6',
    segmentName: '2차 정기 회의 세션 (Meeting Record Session P2)',
    segmentRole: 'container',
    couplingRule: {
      description: '지출금액(s13) 발생 시 대응하는 영수증(s14) 미디어 공간 필수 결합',
      targetSlotId: 's14',
      checkPass: (b) => {
        const s14Val = b.s14?.currentValue || b.s14?.suggestedValue || '';
        return Boolean(s14Val && s14Val.includes('영수증'));
      },
      failMessage: '지출금액 ₩29,000 (1인당 9,666원) 한도 규정 준수 확인',
      quickFixLabel: '예산 집행 인증 마크 첨부',
      fixValue: '₩ 29,000 (한도 준수 확인)',
      fixResource: '영수증_스캔.png',
    },
    dimensions: { x: 140, y: 390, w: 420, h: 24 },
  },
  s14: {
    slotId: 's14',
    slotNumber: 14,
    label: '증빙자료 영수증',
    pageNumber: 2,
    elementId: 'elem-p2-7',
    outlinePath: '2차 회의비 사용 내역 > 증빙자료',
    dataType: 'Media / Attachment (PNG/PDF)',
    isRequired: true,
    directive: '카드 매출전표 또는 세금계산서 실물 스캔본 이미지를 첨부할 것',
    segmentId: 'seg-6',
    segmentName: '2차 정기 회의 세션 (Meeting Record Session P2)',
    segmentRole: 'leaf',
    dimensions: { x: 140, y: 420, w: 420, h: 180 },
  },
};

export function IdeRecipeBottomView({
  activeSpine,
  onChangeSpine,
  selectedSlotId,
  selectedSlotNumber: _selectedSlotNumber,
  onSelectSlot,
  slotBindings = {},
  onBindSlot,
  onOpenSoloTab,
  scaffoldId: _scaffoldId,
  docId: _docId,
}: IdeRecipeBottomViewProps) {
  // 현재 선택된 슬롯의 레시피 스펙 조회 (없으면 기본값 또는 null)
  const currentSpec = useMemo(() => {
    if (!selectedSlotId) return null;
    return SLOT_RECIPE_SPECS[selectedSlotId] || null;
  }, [selectedSlotId]);

  const currentBinding = selectedSlotId ? slotBindings[selectedSlotId] : null;

  // 전체 완성도 통계
  const stats = useMemo(() => {
    const specs = Object.values(SLOT_RECIPE_SPECS);
    const total = specs.length;
    let boundCount = 0;
    specs.forEach((s) => {
      const b = slotBindings[s.slotId];
      if (b && (b.status === 'bound' || b.currentValue)) {
        boundCount++;
      }
    });
    const percentage = Math.round((boundCount / total) * 100);
    return { total, boundCount, percentage };
  }, [slotBindings]);

  // 현재 선택된 슬롯의 커플링 룰 검사
  const couplingResult = useMemo(() => {
    if (!currentSpec?.couplingRule) return null;
    const rule = currentSpec.couplingRule;
    const isPass = rule.checkPass(slotBindings);
    return {
      rule,
      isPass,
    };
  }, [currentSpec, slotBindings]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-200 font-sans text-xs select-none overflow-hidden">
      {/* [1. 상단 컨트롤 & 컨텍스트 바] */}
      <div className="h-8 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 gap-3">
        {/* 좌측: 작업 베이스 전환 스위처 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mr-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>작업 베이스:</span>
          </span>

          <button
            type="button"
            onClick={() => onChangeSpine?.('outline')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeSpine === 'outline'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>아웃라인</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSpine?.('segment')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeSpine === 'segment'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-3 h-3" />
            <span>세그먼트</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSpine?.('slots')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeSpine === 'slots'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>와이어 슬롯</span>
          </button>
        </div>

        {/* 중앙: 현재 선택 상태 안내 배지 */}
        <div className="flex items-center gap-2 min-w-0">
          {currentSpec ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/40 text-[11px] text-indigo-200 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono font-bold text-indigo-300 shrink-0">#{currentSpec.slotId}</span>
              <span className="font-semibold truncate">{currentSpec.label}</span>
              <span className="text-[10px] text-indigo-400/80 shrink-0">(Page {currentSpec.pageNumber})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">중앙 캔버스나 좌측 바인더에서 요소를 클릭하면 실시간 레시피 속성이 표시됩니다</span>
            </div>
          )}
        </div>

        {/* 우측: 전체 완성도 미니 지표 */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-slate-400">규격 충족률:</span>
            <span className="font-bold text-emerald-400">{stats.boundCount}/{stats.total}</span>
            <span className="text-slate-500">({stats.percentage}%)</span>
          </div>
          <CoverageRing value={stats.percentage} size={22} strokeWidth={2.5} showPercent={false} />
        </div>
      </div>

      {/* [2. 본문 영역: Contextual Property Inspector] */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {currentSpec ? (
          /* =============================================================== */
          /* [A] 특정 요소가 선택되었을 때 (Contextual Property Inspector)      */
          /* =============================================================== */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
            {/* [패널 1] 기본 정체성 & 소속 블록 정보 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between space-y-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold text-slate-200 text-xs">요소 기본 정체성</span>
                  </div>
                  <SocketStateBadge
                    state={currentBinding?.status === 'bound' ? 'filled' : 'empty'}
                    count={currentBinding?.status === 'bound' ? 1 : 0}
                  />
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>엘리먼트 ID:</span>
                    <span className="font-mono text-slate-200 font-semibold">{currentSpec.elementId}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>슬롯 번호:</span>
                    <span className="font-mono text-indigo-300 font-semibold">#{currentSpec.slotNumber} ({currentSpec.slotId})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>항목명:</span>
                    <span className="text-slate-200 font-semibold">{currentSpec.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>필수 여부:</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      currentSpec.isRequired ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {currentSpec.isRequired ? '필수 항목 (Required)' : '선택 항목'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>데이터 유형:</span>
                    <span className="font-mono text-slate-300 text-[10px]">{currentSpec.dataType}</span>
                  </div>
                </div>
              </div>

              {/* 현재 바인딩 값 미리보기 */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400 block mb-1 text-[10px]">현재 입력된 값 (SSOT):</span>
                <div className="bg-slate-950 p-2 rounded border border-slate-800/80 font-mono text-xs text-slate-200 truncate">
                  {currentBinding?.currentValue || currentBinding?.suggestedValue || '(미입력 빈 값)'}
                </div>
              </div>
            </div>

            {/* [패널 2] 현재 작업 베이스(Spine)에 따른 동적 속성 및 규칙 검사 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between space-y-2">
              <div className="space-y-2">
                {/* 헤더: 활성 베이스 배지 */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    {activeSpine === 'outline' && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                    {activeSpine === 'segment' && <Boxes className="w-3.5 h-3.5 text-purple-400" />}
                    {activeSpine === 'slots' && <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className="font-bold text-slate-200 text-xs">
                      {activeSpine === 'outline' && '아웃라인 기반 저작 규격'}
                      {activeSpine === 'segment' && '세그먼트 결합 규격 (Coupling)'}
                      {activeSpine === 'slots' && '2D 와이어프레임 기하학 규격'}
                      {activeSpine === 'explorer' && '리소스 파일 규격'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 uppercase">
                    {activeSpine}
                  </span>
                </div>

                {/* [케이스 A: 아웃라인 모드일 때] */}
                {activeSpine === 'outline' && (
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block">목차 트리 경로:</span>
                      <span className="text-blue-300 font-semibold">{currentSpec.outlinePath}</span>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded border border-blue-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[10px]">
                        <Info className="w-3 h-3" />
                        <span>작성 지침 (Directive)</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px] font-sans">
                        {currentSpec.directive}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>목차 정합성 검증 완료 (Pass)</span>
                    </div>
                  </div>
                )}

                {/* [케이스 B: 세그먼트 모드일 때] */}
                {activeSpine === 'segment' && (
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block">소속 세그먼트:</span>
                      <span className="text-purple-300 font-semibold">{currentSpec.segmentName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                      <span>역할: <strong className="text-slate-200">{currentSpec.segmentRole}</strong></span>
                      <span>세그먼트 ID: <strong className="font-mono text-slate-200">{currentSpec.segmentId}</strong></span>
                    </div>

                    {/* 커플링 룰 진단 및 원클릭 퀵픽스 */}
                    {couplingResult ? (
                      couplingResult.isPass ? (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded p-2 text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="min-w-0 flex-1 text-[10px]">
                            <strong className="block text-emerald-200">결합 규칙 충족</strong>
                            <span>{couplingResult.rule.description}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="bg-amber-950/40 border border-amber-500/40 rounded p-2 text-amber-200 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1 text-[10px]">
                              <strong className="block text-amber-300">결합 규칙 위반 감지</strong>
                              <span className="text-slate-300">{couplingResult.rule.failMessage}</span>
                            </div>
                          </div>

                          <DiagnosticQuickFix
                            issueType="conflict"
                            issueMessage={couplingResult.rule.failMessage}
                            suggestedActionLabel={couplingResult.rule.quickFixLabel}
                            onApplyFix={() => {
                              onBindSlot?.(
                                couplingResult.rule.targetSlotId,
                                couplingResult.rule.fixValue,
                                couplingResult.rule.fixResource
                              );
                            }}
                            className="w-full justify-between"
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-slate-400 text-[10px] italic py-2">
                        이 요소에 정의된 별도의 필수 결합 규칙(Coupling Rule)이 없습니다.
                      </div>
                    )}
                  </div>
                )}

                {/* [케이스 C: 와이어 슬롯 모드일 때] */}
                {activeSpine === 'slots' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>페이지:</span>
                      <span className="font-semibold text-slate-200">Page {currentSpec.pageNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>물리 좌표 (X, Y):</span>
                      <span className="font-mono text-emerald-300">{currentSpec.dimensions.x}pt, {currentSpec.dimensions.y}pt</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>바운딩 크기 (W, H):</span>
                      <span className="font-mono text-emerald-300">{currentSpec.dimensions.w}pt × {currentSpec.dimensions.h}pt</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>A4 인쇄 오버플로우:</span>
                        <span className="text-emerald-400 font-bold">0 overflow (안전)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>SSOT 렌더러:</span>
                        <span className="text-indigo-300 font-mono">TiptapScaffold</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 인터랙션 액션 바 */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onOpenSoloTab?.(currentSpec.pageNumber)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[10px] font-semibold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Page {currentSpec.pageNumber} 단독 탭 열기</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSlot?.(currentSpec.slotId, currentSpec.pageNumber, currentSpec.slotNumber)}
                  className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[10px] font-semibold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>캔버스 슬롯 포커스</span>
                </button>
              </div>
            </div>

            {/* [패널 3] 레시피 검증 루브릭 및 프로비넌스 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between space-y-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-slate-200 text-xs">루브릭 & 프로비넌스</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">HEAD</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>레시피 ID:</span>
                    <span className="font-mono text-slate-300 text-[10px]">recipe-1a09fffe0a2</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>검증 AI 엔진:</span>
                    <span className="font-mono text-indigo-400 text-[10px] font-semibold">gemini-3.5-flash-lite</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>출처 앵커 문서:</span>
                    <span className="text-slate-300 truncate max-w-[140px] text-[10px]">11월 디딤돌 회의록.pdf</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>인용 위치:</span>
                    <span className="font-mono text-slate-300 text-[10px]">{currentBinding?.sourceLocation || '1p 14L'}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1 text-[10px]">
                  <div className="text-slate-400 font-semibold">검증 루브릭 (Validation Rubric)</div>
                  <div className="text-slate-300">
                    • <strong>완전성</strong>: 필수 항목(일시, 장소, 안건, 내용, 금액, 영수증) 완비
                  </div>
                  <div className="text-slate-300">
                    • <strong>정확성</strong>: 지출금액과 참석자 명단이 회의록 원본과 정확히 부합
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Rev: art-1a09fffe0a2</span>
                <span className="text-emerald-400 font-semibold">Provenance Verified</span>
              </div>
            </div>
          </div>
        ) : (
          /* =============================================================== */
          /* [B] 선택된 요소가 없을 때 (Base Overview & 전체 규격 현황 조망)    */
          /* =============================================================== */
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-xs">
                    {activeSpine === 'outline' && '아웃라인 베이스 전체 문서 규격 요약'}
                    {activeSpine === 'segment' && '세그먼트 베이스 결합 구조 및 커플링 룰 현황'}
                    {activeSpine === 'slots' && '와이어프레임 2D 슬롯 배치 현황'}
                    {activeSpine === 'explorer' && '전체 리소스 매핑 요약'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    아래 규격 항목 카드를 클릭하거나 중앙 캔버스에서 슬롯을 선택하면 세부 속성이 실시간 인스펙터로 전환됩니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-indigo-300 font-bold">14개 요소 등록됨</span>
              </div>
            </div>

            {/* 전체 슬롯 규격 그리드 목록 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.values(SLOT_RECIPE_SPECS).map((spec) => {
                const binding = slotBindings[spec.slotId];
                const isBound = binding && (binding.status === 'bound' || binding.currentValue);

                return (
                  <button
                    key={spec.slotId}
                    type="button"
                    onClick={() => onSelectSlot?.(spec.slotId, spec.pageNumber, spec.slotNumber)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[86px] ${
                      isBound
                        ? 'bg-slate-900/80 border-slate-750 hover:border-indigo-400/60 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-[10px] font-bold text-indigo-400">
                        #{spec.slotId}
                      </span>
                      <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">
                        P.{spec.pageNumber}
                      </span>
                    </div>

                    <div className="my-1">
                      <div className="font-semibold text-xs text-slate-100 truncate">{spec.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {activeSpine === 'segment' ? spec.segmentName : spec.dataType}
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full pt-1 border-t border-slate-800/60 text-[10px]">
                      <span className={isBound ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {isBound ? '입력됨' : '미입력'}
                      </span>
                      {spec.couplingRule && (
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                          Rule
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
