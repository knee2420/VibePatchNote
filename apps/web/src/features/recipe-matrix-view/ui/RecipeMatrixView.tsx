/**
 * @fileoverview RecipeMatrixView (Recipe Matrix 2D View & Smart Chip Editor)
 * 
 * 와이어프레임 포커스 모달(ScaffoldFocusModal)에서 문서의 저작 규격(DocumentRecipe)을
 * 구글 스프레드시트의 '스마트 칩(Smart Chip)' UI 인터랙션과
 * [슬롯 ⇄ 세그먼트 정밀 2D 매핑 테이블]로 시각화 및 편집할 수 있는 전문 뷰어입니다.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Sparkles,
  Layers,
  Table,
  CheckCircle2,
  ShieldCheck,
  Save,
  Loader2,
  ChevronDown,
  Repeat,
  FileText,
  Bookmark,
  ListOrdered,
  Image as ImageIcon,
  Paperclip,
  HelpCircle,
  CircleDashed,
  Component,
  Hash,
  Check,
  Key,
} from 'lucide-react';

import { recipeApi, type RecipeRevision } from '@/entities/recipe';
import type { ScaffoldDocumentData } from '@/entities/scaffold-document';
import {
  segmentApi,
  type SegmentStructureResponse,
  type DocumentSegmentItem,
  type SegmentMappingItem,
  type SegmentStructureTarget,
} from '@/entities/document-segment';

interface RecipeBlock {
  id?: string;
  name?: string;
  role?: string;
  authoringRole?: string;
  required?: boolean;
  repeatPolicy?: string;
  elementIds?: string[];
  directive?: string;
  [key: string]: unknown;
}

interface Props {
  recipe: RecipeRevision | null;
  scaffoldData: ScaffoldDocumentData;
  docId?: string;
  mode?: 'full' | 'compact';
  isLoading?: boolean;
  onRecipeUpdated?: (updated: RecipeRevision) => void;
}

// ============================================================================
// 구글 스프레드시트 스타일 스마트 칩 (Smart Chips) 정의
// ============================================================================

const ROLE_OPTIONS = [
  { value: 'container', label: '컨테이너 (container)', desc: '여러 세그먼트와 슬롯을 묶는 상위 그룹', icon: Layers, color: 'text-purple-300 bg-purple-950/70 border-purple-700/80' },
  { value: 'section', label: '섹션 (section)', desc: '독립적인 본문 세부 논리 영역', icon: FileText, color: 'text-blue-300 bg-blue-950/70 border-blue-700/80' },
  { value: 'header', label: '헤더 (header)', desc: '문서 상단 기본 식별 및 제목 정보', icon: Bookmark, color: 'text-indigo-300 bg-indigo-950/70 border-indigo-700/80' },
  { value: 'summary', label: '요약 (summary)', desc: '핵심 지표, 집계 또는 개요 블록', icon: Sparkles, color: 'text-amber-300 bg-amber-950/70 border-amber-700/80' },
  { value: 'entry', label: '항목 (entry)', desc: '단일 입력 데이터 필드 또는 반복 단위', icon: ListOrdered, color: 'text-emerald-300 bg-emerald-950/70 border-emerald-700/80' },
  { value: 'media', label: '미디어 (media)', desc: '영수증, 증빙자료, 사진 첨부 공간', icon: ImageIcon, color: 'text-rose-300 bg-rose-950/70 border-rose-700/80' },
  { value: 'footer', label: '푸터 (footer)', desc: '하단 확인, 서명 및 서식 종결부', icon: Paperclip, color: 'text-slate-300 bg-slate-800 border-slate-700' },
] as const;

const REPEAT_OPTIONS = [
  { value: 'multiple', label: '반복 가능 (multiple)', desc: '본문 분량에 따라 여러 번 생성 가능', icon: Repeat, color: 'text-cyan-300 bg-cyan-950/70 border-cyan-700/80' },
  { value: 'single', label: '단일 1회 (single)', desc: '문서 내 단 한 번만 고정 등장', icon: CheckCircle2, color: 'text-slate-300 bg-slate-800 border-slate-700' },
  { value: 'optional', label: '선택적 (optional)', desc: '필요한 경우에만 조건부 포함', icon: HelpCircle, color: 'text-violet-300 bg-violet-950/70 border-violet-700/80' },
] as const;

const REQUIRED_OPTIONS = [
  { value: true, label: '필수 (Required)', desc: '서식 완성 시 누락 불가 필수 항목', icon: CheckCircle2, color: 'text-emerald-300 bg-emerald-950/70 border-emerald-700/80' },
  { value: false, label: '선택 (Optional)', desc: '필요 시 생략 가능한 부가 항목', icon: CircleDashed, color: 'text-slate-400 bg-slate-900 border-slate-800' },
] as const;

/** 1. 역할 스마트 칩 (Role Smart Chip) */
function RoleSmartChip({
  value,
  onChange,
}: {
  value: string;
  onChange: (newVal: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const matched = ROLE_OPTIONS.find((opt) => opt.value === value);
  const Icon = matched?.icon || Layers;
  const chipStyle = matched?.color || 'text-purple-300 bg-purple-950/70 border-purple-700/80';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-all cursor-pointer hover:brightness-125 ${chipStyle}`}
        title="클릭하여 저작 역할(Role) 스마트 칩 변경"
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold">{matched?.label || value || '미지정'}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 p-2 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            저작 역할 스마트 칩 선택
          </div>
          <div className="space-y-1 my-1 max-h-56 overflow-y-auto pr-0.5">
            {ROLE_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2 p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-purple-900/40 text-purple-200' : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <OptIcon className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-purple-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 mt-1 border-t border-slate-800">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customVal.trim()) {
                    onChange(customVal.trim());
                    setCustomVal('');
                    setIsOpen(false);
                  }
                }}
                placeholder="직접 입력..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customVal.trim()) {
                    onChange(customVal.trim());
                    setCustomVal('');
                    setIsOpen(false);
                  }
                }}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-medium"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 2. 반복 정책 스마트 칩 (Repeat Policy Smart Chip) */
function RepeatPolicySmartChip({
  value,
  onChange,
}: {
  value: string;
  onChange: (newVal: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const matched = REPEAT_OPTIONS.find((opt) => opt.value === value) || REPEAT_OPTIONS[1];
  const Icon = matched.icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-all cursor-pointer hover:brightness-125 ${matched.color}`}
        title="클릭하여 반복 정책 변경"
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold">{matched.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-60 p-2 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            반복 정책 스마트 칩
          </div>
          <div className="space-y-1 my-1">
            {REPEAT_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2 p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-cyan-900/40 text-cyan-200' : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <OptIcon className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** 3. 필수 여부 스마트 칩 (Required Smart Chip) */
function RequiredSmartChip({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (newVal: boolean) => void;
}) {
  const matched = REQUIRED_OPTIONS.find((opt) => opt.value === value) || REQUIRED_OPTIONS[0];
  const Icon = matched.icon;

  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-all cursor-pointer hover:brightness-125 ${matched.color}`}
      title="클릭하여 필수 여부(Required) 토글"
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-semibold">{matched.label}</span>
    </button>
  );
}

/** 4. 세그먼트 스마트 칩 (Segment Smart Chip) */
function SegmentSmartChip({
  segment,
}: {
  segment?: DocumentSegmentItem | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!segment) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 bg-slate-900 border border-dashed border-slate-800">
        <CircleDashed className="w-3 h-3" />
        미배정
      </span>
    );
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-950/70 text-teal-200 border border-teal-700/80 hover:bg-teal-900/80 transition-all cursor-pointer shadow-xs max-w-[240px] truncate"
        title="클릭하여 원본 세그먼트 상세 정보 확인"
      >
        <Component className="w-3 h-3 text-teal-400 shrink-0" />
        <span className="font-mono text-[10px] text-teal-300 font-bold shrink-0">{segment.id}</span>
        <span className="truncate">{segment.label || '세그먼트'}</span>
        <span className="text-[9px] px-1 rounded bg-teal-900/80 text-teal-300 border border-teal-700/50 shrink-0">
          {segment.page}P
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 p-3 rounded-xl bg-slate-950 border border-teal-700/80 shadow-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-100 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <Component className="w-3.5 h-3.5" />
              원본 세그먼트 정본 정보
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800">
              {segment.id}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="text-slate-200 font-semibold">{segment.label}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3">
              <span>페이지: <strong className="text-slate-200">{segment.page}페이지</strong></span>
              <span>유형: <strong className="text-slate-200">{segment.type}</strong></span>
            </div>
            {segment.box_2d && (
              <div className="text-[10px] font-mono text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-800">
                실측 좌표: [{segment.box_2d.join(', ')}]
              </div>
            )}
            {segment.content_summary && (
              <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 leading-relaxed max-h-24 overflow-y-auto">
                {segment.content_summary}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** 5. 엘리먼트 타입 스마트 칩 (Type Smart Chip) */
function ElementTypeSmartChip({ type }: { type?: string }) {
  const t = type?.toLowerCase() || 'unknown';
  let Icon = Hash;
  let color = 'text-slate-400 bg-slate-900 border-slate-800';
  let label = t;

  if (t === 'key_value') {
    Icon = Key;
    color = 'text-amber-300 bg-amber-950/60 border-amber-800/60';
    label = '키-값 (key_value)';
  } else if (t === 'list') {
    Icon = ListOrdered;
    color = 'text-blue-300 bg-blue-950/60 border-blue-800/60';
    label = '목록 (list)';
  } else if (t === 'media' || t === 'image') {
    Icon = ImageIcon;
    color = 'text-rose-300 bg-rose-950/60 border-rose-800/60';
    label = '미디어 (media)';
  } else if (t === 'table') {
    Icon = Table;
    color = 'text-purple-300 bg-purple-950/60 border-purple-800/60';
    label = '표 (table)';
  } else if (t === 'heading' || t === 'header') {
    Icon = Bookmark;
    color = 'text-indigo-300 bg-indigo-950/60 border-indigo-800/60';
    label = '제목 (heading)';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>
      <Icon className="w-2.5 h-2.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

// ============================================================================
// 메인 RecipeMatrixView 컴포넌트
// ============================================================================

export function RecipeMatrixView({
  recipe,
  scaffoldData,
  docId,
  mode = 'full',
  isLoading = false,
  onRecipeUpdated,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [editedBlocks, setEditedBlocks] = useState<Record<string, Partial<RecipeBlock>>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 세그먼트 구조 데이터 (구조 뷰)
  const [structure, setStructure] = useState<SegmentStructureResponse | null>(null);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);

  // docId를 바탕으로 세그먼트-아웃라인 결합 구조 로드
  useEffect(() => {
    const targetDocId = docId || scaffoldData.docId;
    if (!targetDocId) return;

    let isMounted = true;
    setIsLoadingStructure(true);

    segmentApi.getStructure(targetDocId)
      .then((res) => {
        if (isMounted) setStructure(res);
      })
      .catch((err) => {
        console.error('[RecipeMatrixView] Failed to load structure:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingStructure(false);
      });

    return () => {
      isMounted = false;
    };
  }, [docId, scaffoldData.docId]);

  // 세그먼트, 아웃라인, 매핑 룩업 맵 생성
  const segmentsMap = useMemo(() => {
    const map = new Map<string, DocumentSegmentItem>();
    if (structure?.segments) {
      for (const seg of structure.segments) {
        map.set(seg.id, seg);
      }
    }
    return map;
  }, [structure?.segments]);

  const outlineElementsMap = useMemo(() => {
    const map = new Map<string, SegmentStructureTarget>();
    if (structure?.outlineElements) {
      for (const el of structure.outlineElements) {
        map.set(el.id, el);
      }
    }
    return map;
  }, [structure?.outlineElements]);

  const mappingsMap = useMemo(() => {
    const map = new Map<string, SegmentMappingItem>();
    if (structure?.mappings) {
      for (const m of structure.mappings) {
        map.set(m.targetId, m);
      }
    }
    return map;
  }, [structure?.mappings]);

  const spec = recipe?.spec as Record<string, unknown> | undefined;

  const blocks = useMemo<RecipeBlock[]>(() => {
    if (!spec || !Array.isArray(spec.blocks)) return [];
    return spec.blocks as RecipeBlock[];
  }, [spec]);

  const couplingRules = useMemo<string[]>(() => {
    if (!spec || !Array.isArray(spec.couplingRules)) return [];
    return spec.couplingRules.map(String);
  }, [spec]);

  const validationRubric = useMemo<Record<string, string>>(() => {
    if (!spec || typeof spec.validationRubric !== 'object' || spec.validationRubric === null) return {};
    const res: Record<string, string> = {};
    for (const [k, v] of Object.entries(spec.validationRubric)) {
      res[k] = String(v);
    }
    return res;
  }, [spec]);

  // 스마트 칩 수정 핸들러
  const handleBlockChange = useCallback((blockId: string, patch: Partial<RecipeBlock>) => {
    setEditedBlocks((prev) => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        ...patch,
      },
    }));
  }, []);

  // 새 리비전으로 저장 핸들러
  const handleSaveRevision = useCallback(
    async (blockId: string) => {
      if (!recipe) return;
      const patch = editedBlocks[blockId];
      if (!patch) return;

      setIsSaving(true);
      setSaveMessage(null);
      try {
        const currentSpec = (recipe.spec || {}) as Record<string, unknown>;
        const currentBlocks = Array.isArray(currentSpec.blocks)
          ? (currentSpec.blocks as RecipeBlock[])
          : [];

        const updatedBlocks = currentBlocks.map((b, idx) => {
          const id = b.id || `block-${idx}`;
          if (id === blockId) {
            return {
              ...b,
              ...patch,
              authoringRole: patch.authoringRole || patch.role || b.authoringRole || b.role,
              role: patch.role || patch.authoringRole || b.role || b.authoringRole,
            };
          }
          return b;
        });

        const updatedSpec = {
          ...currentSpec,
          blocks: updatedBlocks,
        };

        const res = await recipeApi.save(
          recipe.provenance.recipeId,
          recipe.provenance.revisionId,
          recipe.title,
          updatedSpec,
        );

        if (res?.recipe) {
          onRecipeUpdated?.(res.recipe);
          setEditedBlocks((prev) => {
            const next = { ...prev };
            delete next[blockId];
            return next;
          });
          setSaveMessage('새 리비전이 성공적으로 저장되었습니다!');
          setTimeout(() => setSaveMessage(null), 3000);
        }
      } catch (err) {
        console.error('[RecipeMatrixView] Save failed:', err);
        setSaveMessage('저장 중 오류가 발생했습니다.');
      } finally {
        setIsSaving(false);
      }
    },
    [recipe, editedBlocks, onRecipeUpdated],
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 min-h-[260px]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
        <h4 className="text-sm font-semibold text-slate-200">저작 규격(Recipe)을 불러오는 중...</h4>
        <p className="text-xs text-slate-500 mt-1">백엔드 저장소에서 최신 리비전 명세를 조회하고 있습니다.</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
        <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-800/50 flex items-center justify-center text-purple-400 mb-3 shadow-inner">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-200">연결된 저작 규격(Recipe)이 없습니다</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
          참조 문서 상단 헤더의 저작 규격 추출 버튼을 실행하면, 4대 근거 데이터를 바탕으로
          구조화된 Recipe Matrix가 자동 생성됩니다.
        </p>
      </div>
    );
  }

  // ==========================================================================
  // 1. [컴팩트 모드]: 우측 사이드바(w-80) 내 표시
  // ==========================================================================
  if (mode === 'compact') {
    return (
      <div className="space-y-4 text-slate-200">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Recipe Matrix</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                {recipe.provenance.revisionId.slice(0, 12)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {new Date(recipe.provenance.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            정본 연동
          </span>
        </div>

        <div className="space-y-3">
          {blocks.map((block, idx) => {
            const blockId = block.id || `block-${idx}`;
            const patch = editedBlocks[blockId] || {};
            const currentRole = patch.authoringRole || patch.role || block.authoringRole || block.role || 'container';
            const currentRepeat = patch.repeatPolicy || block.repeatPolicy || 'single';
            const currentRequired = patch.required !== undefined ? patch.required : block.required !== false;
            const isModified = Object.keys(patch).length > 0;

            return (
              <div key={blockId} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    {block.name || `블록 #${idx + 1}`}
                  </span>
                  {isModified && (
                    <button
                      onClick={() => handleSaveRevision(blockId)}
                      disabled={isSaving}
                      className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />}
                      <span>저장</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <RoleSmartChip
                    value={currentRole}
                    onChange={(newVal) => handleBlockChange(blockId, { authoringRole: newVal, role: newVal })}
                  />
                  <RepeatPolicySmartChip
                    value={currentRepeat}
                    onChange={(newVal) => handleBlockChange(blockId, { repeatPolicy: newVal })}
                  />
                  <RequiredSmartChip
                    value={currentRequired}
                    onChange={(newVal) => handleBlockChange(blockId, { required: newVal })}
                  />
                </div>

                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  매핑 슬롯: <strong className="text-slate-300">{block.elementIds?.length || 0}개</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 2. [전체 화면 / 와이드 모드]: 스마트 칩 기반 계층형 2D 매트릭스 그리드
  // ==========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. 상단 종합 요약 헤더 카드 */}
      <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>DocumentRecipe Matrix Grid</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {recipe.provenance.revisionId}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  원본 문서 '{scaffoldData.sourcePdfFileName || scaffoldData.title}'의 실측 레이아웃 및 4대 근거 기반 종합 저작 매트릭스
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className="text-xs font-medium text-purple-300 bg-purple-950/60 border border-purple-800/80 px-2.5 py-1 rounded-lg animate-in fade-in">
                {saveMessage}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              정본 동기화 완료
            </span>
          </div>
        </div>

        {/* 4대 메타 스펙 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              문서 목적 (Purpose)
            </span>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {String(spec?.purpose || '회의록 및 행정 증빙 기록')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" />
              대상 독자 (Audience)
            </span>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {String(spec?.audience || '프로젝트 팀원 및 행정 감사관')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              문서 어조 (Tone)
            </span>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {String(spec?.tone || '공식적, 전문적, 구조화됨')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              작성 흐름 (Rhythm)
            </span>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {String(spec?.rhythm || '시계열적 반복 세션 항목')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. 저작 블록별 상세 매트릭스 & [슬롯 ⇄ 세그먼트 정밀 매핑 테이블] */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white">
              저작 블록 및 슬롯-세그먼트 매핑 테이블 ({blocks.length}개 블록)
            </h4>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-purple-300">
              💡 스마트 칩을 클릭하여 역할·반복 정책·필수 여부를 즉시 변경할 수 있습니다
            </span>
            {isLoadingStructure && (
              <span className="inline-flex items-center gap-1 text-[10px] text-teal-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                세그먼트 로딩 중...
              </span>
            )}
          </div>
        </div>

        {blocks.map((block, bIdx) => {
          const blockId = block.id || `block-${bIdx}`;
          const patch = editedBlocks[blockId] || {};
          const currentRole = patch.authoringRole || patch.role || block.authoringRole || block.role || 'container';
          const currentRepeat = patch.repeatPolicy || block.repeatPolicy || 'single';
          const currentRequired = patch.required !== undefined ? patch.required : block.required !== false;
          const isModified = Object.keys(patch).length > 0;

          const elementIds = Array.isArray(block.elementIds) ? block.elementIds : [];

          return (
            <div
              key={blockId}
              className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-xl backdrop-blur-md transition-all hover:border-slate-700/80"
            >
              {/* 블록 마스터 바 (Google Sheets Smart Chip Bar) */}
              <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-300 font-bold text-xs shrink-0">
                    B{bIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{block.name || `블록 #${bIdx + 1}`}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                        {blockId}
                      </span>
                    </div>
                    {block.directive && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{block.directive}</p>
                    )}
                  </div>
                </div>

                {/* 스마트 칩 3총사 + 저장 버튼 */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <RoleSmartChip
                    value={currentRole}
                    onChange={(newVal) => handleBlockChange(blockId, { authoringRole: newVal, role: newVal })}
                  />
                  <RepeatPolicySmartChip
                    value={currentRepeat}
                    onChange={(newVal) => handleBlockChange(blockId, { repeatPolicy: newVal })}
                  />
                  <RequiredSmartChip
                    value={currentRequired}
                    onChange={(newVal) => handleBlockChange(blockId, { required: newVal })}
                  />

                  <div className="h-4 w-px bg-slate-800 mx-1" />

                  <button
                    type="button"
                    onClick={() => handleSaveRevision(blockId)}
                    disabled={!isModified || isSaving}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      isModified
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
                        : 'bg-slate-800/40 text-slate-600 cursor-not-allowed border border-slate-800'
                    }`}
                    title={isModified ? '수정된 스마트 칩 값으로 새 Revision 커밋' : '변경된 내용이 없습니다'}
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isModified ? '새 Revision 저장' : '저장됨'}</span>
                  </button>
                </div>
              </div>

              {/* [슬롯 ⇄ 세그먼트 정밀 매핑 테이블] */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800/80">
                    <tr>
                      <th className="py-2.5 px-4 w-28">슬롯 식별자</th>
                      <th className="py-2.5 px-4 w-52">서식 슬롯 명칭 / 라벨</th>
                      <th className="py-2.5 px-3 w-20 text-center">페이지</th>
                      <th className="py-2.5 px-3 w-36">엘리먼트 타입</th>
                      <th className="py-2.5 px-4">매핑된 원본 세그먼트 (Segment)</th>
                      <th className="py-2.5 px-3 w-32">매핑 근거 / 신뢰도</th>
                      <th className="py-2.5 px-3 w-28 text-right font-mono text-[10px]">실측 BBox</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {elementIds.map((elemId) => {
                      const outlineElem = outlineElementsMap.get(elemId);
                      const mapping = mappingsMap.get(elemId);
                      const segment = mapping?.primarySegmentId ? segmentsMap.get(mapping.primarySegmentId) : null;

                      // 슬롯 번호와 라벨 매핑 (scaffoldData slots 보정)
                      const matchingSlot = scaffoldData.slots?.find((s) => s.id === elemId || `elem-${s.id}` === elemId);
                      const displayLabel = outlineElem?.label || matchingSlot?.label || elemId;
                      const pageNum = outlineElem?.page || matchingSlot?.pageNumber || (elemId.includes('p2') ? 2 : 1);
                      const elemType = outlineElem?.type || 'slot';
                      const box = outlineElem?.box_2d || matchingSlot?.box_2d;

                      return (
                        <tr key={elemId} className="hover:bg-slate-900/40 transition-colors group">
                          {/* 1. 슬롯 ID */}
                          <td className="py-2.5 px-4 font-mono text-purple-300 font-semibold flex items-center gap-1">
                            <Hash className="w-3 h-3 text-purple-400/80" />
                            <span>{elemId}</span>
                          </td>

                          {/* 2. 서식 슬롯 명칭 */}
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{displayLabel}</span>
                            </div>
                          </td>

                          {/* 3. 페이지 */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/80">
                              {pageNum}P
                            </span>
                          </td>

                          {/* 4. 엘리먼트 타입 스마트 칩 */}
                          <td className="py-2.5 px-3">
                            <ElementTypeSmartChip type={elemType} />
                          </td>

                          {/* 5. 매핑된 원본 세그먼트 (Segment Smart Chip) */}
                          <td className="py-2.5 px-4">
                            <SegmentSmartChip segment={segment} />
                          </td>

                          {/* 6. 매핑 근거 / 신뢰도 */}
                          <td className="py-2.5 px-3">
                            {mapping ? (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold ${mapping.confidence >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {Math.round(mapping.confidence * 100)}%
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[90px]" title={mapping.reason}>
                                  {mapping.source === 'algorithm' ? '기하 중첩' : mapping.source}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">자동 판정</span>
                            )}
                          </td>

                          {/* 7. 실측 기하 BBox */}
                          <td className="py-2.5 px-3 text-right font-mono text-[10px] text-slate-500">
                            {box ? `[${box.slice(0, 2).join(',')}]` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 하단 2단: 결합 규칙 매트릭스 & 검증 루브릭 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 결합 규칙 매트릭스 */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              결합 규칙 매트릭스 (Coupling Rules)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {couplingRules.length}개 규칙
            </span>
          </div>
          <div className="space-y-2">
            {couplingRules.map((rule, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 검증 루브릭 매트릭스 */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              검증 루브릭 매트릭스 (Validation Rubric)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {Object.keys(validationRubric).length}개 기준
            </span>
          </div>
          <div className="space-y-2">
            {Object.entries(validationRubric).map(([crit, desc]) => (
              <div
                key={crit}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1"
              >
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {crit}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed pl-3 border-l border-emerald-500/30">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
