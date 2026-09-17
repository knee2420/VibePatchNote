import { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Target,
  Users,
  Feather,
  Clock,
  Boxes,
  Workflow,
  CheckSquare,
  ShieldCheck,
  FileCode,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { recipeApi } from '@/entities/recipe';
import type { RecipeRevision } from '@/entities/recipe';

export interface IdeRecipeSidebarProps {
  onClose?: () => void;
  onOpenReferenceDoc?: () => void;
  currentDocId?: string;
  currentScaffoldId?: string;
}

// apps/api/data/knowledge/recipes/ 에 보관된 정본 Recipe 기본 데이터
const CANONICAL_RECIPES: RecipeRevision[] = [
  {
    provenance: {
      recipeId: 'recipe-1a09fffe0a2-90b03e85',
      revisionId: 'art-1a09fffe0a2-d5908495',
      createdAt: '2026-09-14T12:59:01.668500Z',
      origin: 'llm',
      runId: 'run-1a09fffd269-cdcebb34',
      traceId: 'run-1a09fffd269-cdcebb34',
      model: 'gemini-3.5-flash-lite',
      promptHash: '1afc4b2824eb4486195694805e16d56e92ba2cb33c862fa5d146767de06d0748',
      engineVersion: '1',
      sourceAnchors: {
        docId: 'doc-1a0897500d9-989a3b2b',
        segmentArtifactId: 'art-1a09ff97bee-5d7a5849',
        outlineArtifactId: 'art-1a099d8bdcb-8e776d43',
        scaffoldId: 'scaffold-1a09ffa4088-672813d4',
        mappingFingerprint: '8ab62c68a956d416decf',
      },
    },
    title: '11월 디딤돌 회의록.pdf',
    spec: {
      purpose:
        '정기 회의록 기록, 안건 의결 사항 정리, 집행 경비 산출 및 행정 정산용 증빙 영수증 체계적 보존 관리',
      audience: '프로젝트 팀원 전원, 사업단 평가 심사위원, 행정 회계 감사관',
      tone: '공식적이고 규격화된 공문서 문체, 간결하고 정량적인 기술',
      rhythm:
        '시간 순차적 회의 세션의 반복 전개: [회의 일시·장소·참석자 메타] → [주요 안건] → [토의 내용] → [지출금액] → [영수증 증빙 첨부]',
      blocks: [
        {
          id: 'block-meeting-record',
          name: 'Meeting Record Session (정기 회의 세션)',
          role: 'container',
          required: true,
          repeatPolicy: 'multiple',
          elementIds: [
            'elem-p1-1',
            'elem-p1-2',
            'elem-p1-3',
            'elem-p1-4',
            'elem-p1-5',
            'elem-p1-6',
            'elem-p1-7',
            'elem-p2-1',
            'elem-p2-2',
            'elem-p2-3',
            'elem-p2-4',
            'elem-p2-5',
            'elem-p2-6',
            'elem-p2-7',
          ],
        },
      ],
      couplingRules: [
        '각 회의 세션 블록은 일시, 장소, 참석자, 안건, 회의내용, 지출금액, 증빙 첨부란을 반드시 한 묶음으로 수반해야 함',
        '지출금액(s6, s13)이 0원이 아닌 경우 증빙 영수증(s7, s14) 미디어 공간 필수 배정',
      ],
      directives: [
        '모든 지출금액은 통화 기호(₩) 및 세부 정산 내역을 명시할 것',
        '회의 결과 및 결정 사항은 번호 매기기(Numbered List) 목록으로 기재할 것',
        '각 회의 세션마다 개별 결재 인영 및 서명 영역을 배치할 것',
      ],
      validationRubric: {
        completeness:
          '모든 필수 입력 필드(일시, 장소, 참석자수, 안건, 회의내용, 지출비, 영수증)가 완비되어 있어야 함',
        accuracy: '지출 항목 계산 합계와 참석자 명단이 회의 로그 원본과 정확히 부합해야 함',
      },
    },
  },
];

export function IdeRecipeSidebar({
  onClose,
  onOpenReferenceDoc,
  currentDocId,
  currentScaffoldId,
}: IdeRecipeSidebarProps) {
  const [recipes, setRecipes] = useState<RecipeRevision[]>(CANONICAL_RECIPES);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(CANONICAL_RECIPES[0].provenance.recipeId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    purpose: true,
    blocks: true,
    coupling: true,
    directives: true,
    rubric: true,
    rawJson: false,
  });
  const [copied, setCopied] = useState(false);

  // 백엔드 data/knowledge/recipes 에 보관된 정본 Recipe 데이터 연동
  const fetchRecipes = async () => {
    setIsRefreshing(true);
    try {
      if (currentScaffoldId) {
        const res = await recipeApi.listByScaffold(currentScaffoldId);
        if (res && res.length > 0) {
          const liveList = res.map((r) => r.recipe);
          setRecipes(liveList);
          setSelectedRecipeId(liveList[0].provenance.recipeId);
          return;
        }
      }
      if (currentDocId) {
        const res = await recipeApi.listByDocument(currentDocId);
        if (res && res.length > 0) {
          const liveList = res.map((r) => r.recipe);
          setRecipes(liveList);
          setSelectedRecipeId(liveList[0].provenance.recipeId);
          return;
        }
      }
    } catch {
      // 오프라인이거나 에러 시 CANONICAL_RECIPES 단일 정본 유지
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchRecipes();
  }, [currentDocId, currentScaffoldId]);

  const activeRecipe = recipes.find((r) => r.provenance.recipeId === selectedRecipeId) || recipes[0];
  const spec = (activeRecipe?.spec || {}) as Record<string, any>;
  const blocks = (Array.isArray(spec.blocks) ? spec.blocks : []) as Array<Record<string, any>>;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopyJson = () => {
    void navigator.clipboard.writeText(JSON.stringify(activeRecipe, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-925 text-slate-200 select-none font-sans text-xs border-r border-slate-800/80">
      {/* 1. 사이드바 헤더 */}
      <div className="h-10 px-3.5 border-b border-slate-800/90 flex items-center justify-between shrink-0 bg-slate-950/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold text-slate-100 tracking-wide text-xs truncate">
            RECIPES (문서 저작 규격)
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/50 font-mono font-bold">
            {recipes.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={fetchRecipes}
            disabled={isRefreshing}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              title="사이드바 닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Recipe 선택 카드 탭 목록 */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-950/30 shrink-0 space-y-1">
        <div className="text-[10px] text-slate-400 font-mono px-1 flex items-center justify-between">
          <span>등록된 저작 규격 (HEAD)</span>
          <span>{recipes.length} 건</span>
        </div>

        <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
          {recipes.map((rcp) => {
            const isSelected = rcp.provenance.recipeId === activeRecipe.provenance.recipeId;
            return (
              <button
                key={rcp.provenance.recipeId}
                type="button"
                onClick={() => setSelectedRecipeId(rcp.provenance.recipeId)}
                className={`w-full p-2 rounded-md text-left transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200 shadow-xs'
                    : 'bg-slate-900/60 hover:bg-slate-850/80 border-slate-800/60 text-slate-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className={`w-3 h-3 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="font-semibold text-xs truncate">{rcp.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                    <span className="text-slate-500">
                      Rev: {rcp.provenance.revisionId.slice(0, 10)}
                    </span>
                    <span className="px-1 rounded bg-slate-800/90 text-slate-400 text-[9px]">
                      {rcp.provenance.origin === 'llm' ? 'AI 추출본' : '수동 규격'}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 활성 Recipe 세부 속성 인스펙터 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* A. 상단 메타 바 (Revision, Model, Anchors) */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-200 truncate">{activeRecipe.title}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeRecipe.provenance.model || 'gemini-3.5-flash-lite'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
            <div>
              <span className="text-slate-400">Recipe ID: </span>
              <span className="text-slate-300">{activeRecipe.provenance.recipeId.slice(0, 14)}...</span>
            </div>
            <div>
              <span className="text-slate-400">생성일: </span>
              <span className="text-slate-300">{activeRecipe.provenance.createdAt.split('T')[0]}</span>
            </div>
          </div>

          {activeRecipe.provenance.sourceAnchors?.docId && (
            <div className="pt-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-mono">
                Anchor: {activeRecipe.provenance.sourceAnchors.docId}
              </span>
              {onOpenReferenceDoc && (
                <button
                  type="button"
                  onClick={onOpenReferenceDoc}
                  className="flex items-center gap-1 text-teal-400 hover:text-teal-300 cursor-pointer font-medium"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>원문 DOC 보기</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* B. 1) Purpose (문서 핵심 목적) */}
        <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('purpose')}
            className="w-full px-3 py-2 flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 cursor-pointer text-left transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>Purpose (문서 핵심 목적)</span>
            </div>
            {expandedSections.purpose ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          {expandedSections.purpose && (
            <div className="p-3 text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 border-t border-slate-800/40">
              {spec.purpose || '정의된 문서 목적이 없습니다.'}
            </div>
          )}
        </div>

        {/* C. 2) Audience & Tone (대상 독자 & 어조) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Audience */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Audience (대상 독자)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {spec.audience || '미지정'}
            </p>
          </div>

          {/* Tone */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
              <Feather className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tone (서술 어조)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {spec.tone || '공식적, 간결함'}
            </p>
          </div>
        </div>

        {/* D. 3) Rhythm (작성 순서 및 세션 전개 흐름) */}
        {spec.rhythm && (
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Rhythm (세션 전개 흐름)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800/40">
              {typeof spec.rhythm === 'string' ? spec.rhythm : JSON.stringify(spec.rhythm)}
            </p>
          </div>
        )}

        {/* E. 4) Blocks (저작 구조 블록 & 엘리먼트 매핑) */}
        <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('blocks')}
            className="w-full px-3 py-2 flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 cursor-pointer text-left transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
              <Boxes className="w-3.5 h-3.5 text-indigo-400" />
              <span>Authoring Blocks ({blocks.length})</span>
            </div>
            {expandedSections.blocks ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {expandedSections.blocks && (
            <div className="p-2.5 space-y-2 bg-slate-950/40 border-t border-slate-800/40">
              {blocks.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="p-2.5 rounded-md bg-slate-900 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs">{b.name}</span>
                    <div className="flex items-center gap-1 text-[9px] font-mono">
                      <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                        {b.role || 'container'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                        {b.repeatPolicy || 'single'}
                      </span>
                    </div>
                  </div>

                  {b.required && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>필수 작성 블록 (Required)</span>
                    </div>
                  )}

                  {Array.isArray(b.elementIds) && b.elementIds.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[9px] text-slate-400 font-mono mb-1">
                        매핑된 엘리먼트 ({b.elementIds.length}개):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {b.elementIds.slice(0, 10).map((elemId: string) => (
                          <span
                            key={elemId}
                            className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono text-[9px] border border-slate-700/50"
                          >
                            #{elemId}
                          </span>
                        ))}
                        {b.elementIds.length > 10 && (
                          <span className="text-[9px] text-slate-400 px-1 py-0.5">
                            +{b.elementIds.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* F. 5) Coupling Rules (결합 규칙) */}
        {Array.isArray(spec.couplingRules) && spec.couplingRules.length > 0 && (
          <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('coupling')}
              className="w-full px-3 py-2 flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 cursor-pointer text-left transition-colors"
            >
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                <span>Coupling Rules ({spec.couplingRules.length})</span>
              </div>
              {expandedSections.coupling ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {expandedSections.coupling && (
              <div className="p-2.5 space-y-1.5 bg-slate-950/40 border-t border-slate-800/40">
                {spec.couplingRules.map((rule: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* G. 6) Directives (작성 준수 지침) */}
        {Array.isArray(spec.directives) && spec.directives.length > 0 && (
          <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('directives')}
              className="w-full px-3 py-2 flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 cursor-pointer text-left transition-colors"
            >
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
                <span>Directives (작성 준수 지침)</span>
              </div>
              {expandedSections.directives ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {expandedSections.directives && (
              <div className="p-2.5 space-y-2 bg-slate-950/40 border-t border-slate-800/40">
                {spec.directives.map((dir: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-950 text-teal-300 border border-teal-800/50 flex items-center justify-center shrink-0 text-[9px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{dir}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* H. 7) Validation Rubric (검증 기준) */}
        {spec.validationRubric && typeof spec.validationRubric === 'object' && (
          <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('rubric')}
              className="w-full px-3 py-2 flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 cursor-pointer text-left transition-colors"
            >
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                <span>Validation Rubric (검증 루브릭)</span>
              </div>
              {expandedSections.rubric ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {expandedSections.rubric && (
              <div className="p-2.5 space-y-2 bg-slate-950/40 border-t border-slate-800/40 text-[11px]">
                {Object.entries(spec.validationRubric as Record<string, string>).map(([key, val]) => (
                  <div key={key} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                    <span className="font-mono font-bold text-violet-300 uppercase text-[10px]">
                      {key}
                    </span>
                    <p className="text-slate-300 leading-normal">{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* I. 8) Raw JSON Viewer */}
        <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 overflow-hidden">
          <div className="px-3 py-2 flex items-center justify-between bg-slate-900/90 text-xs">
            <button
              type="button"
              onClick={() => toggleSection('rawJson')}
              className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>전체 Recipe Spec (JSON)</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1 text-[10px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>
          </div>

          {expandedSections.rawJson && (
            <div className="p-2 bg-slate-950 text-[10px] font-mono border-t border-slate-800/60 overflow-x-auto max-h-60 custom-scrollbar">
              <pre className="text-slate-400">{JSON.stringify(activeRecipe, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
