import type {
  BinderItem,
  SocketNodeData,
  SpineOption,
  StagingAssetItem,
  CitationItem,
  DiffChunkItem,
  RunAttemptItem,
  AgentExecutionStep,
  ContextTagItem,
  ModelConfig,
} from '@vibe/editor-workspace';

/** 1. 척추 모드 옵션 (루브릭 뼈대 vs 에셋 슬롯) */
export const labSpineOptions: SpineOption<'rubric' | 'evidence'>[] = [
  { id: 'rubric', label: '문서 루브릭' },
  { id: 'evidence', label: '증거 및 에셋' },
];

/** 2. 바인더 소켓 트리 실험용 데이터 */
export const labBinderTreeData: BinderItem<SocketNodeData>[] = [
  {
    id: 'root',
    name: '범용 시스템 기술 제안서',
    isFolder: true,
    data: {
      id: 'root',
      name: '범용 시스템 기술 제안서',
      slotNumber: 0,
      fillingState: 'partial',
      isFolder: true,
    },
    children: [
      {
        id: 'sec-1',
        name: '1. 개요 및 설계 목표',
        isFolder: true,
        data: {
          id: 'sec-1',
          name: '1. 개요 및 설계 목표',
          slotNumber: 1,
          fillingState: 'filled',
          mappedCount: 2,
          isFolder: true,
        },
        children: [
          {
            id: 'sec-1-1',
            name: '1.1 문제 정의 및 해결 전략',
            data: {
              id: 'sec-1-1',
              name: '1.1 문제 정의 및 해결 전략',
              slotNumber: 1,
              fillingState: 'filled',
              mappedCount: 1,
              acceptTypes: ['text'],
            },
          },
          {
            id: 'sec-1-2',
            name: '1.2 도메인 중립 아키텍처 원칙',
            data: {
              id: 'sec-1-2',
              name: '1.2 도메인 중립 아키텍처 원칙',
              slotNumber: 2,
              fillingState: 'filled',
              mappedCount: 1,
              acceptTypes: ['text', 'code'],
            },
          },
        ],
      },
      {
        id: 'sec-2',
        name: '2. 워크스페이스 코어 엔진',
        isFolder: true,
        data: {
          id: 'sec-2',
          name: '2. 워크스페이스 코어 엔진',
          slotNumber: 2,
          fillingState: 'partial',
          mappedCount: 1,
          isFolder: true,
        },
        children: [
          {
            id: 'sec-2-1',
            name: '2.1 멀티 스플릿 도킹 셸',
            data: {
              id: 'sec-2-1',
              name: '2.1 멀티 스플릿 도킹 셸',
              slotNumber: 3,
              fillingState: 'filled',
              mappedCount: 1,
              acceptTypes: ['text'],
            },
          },
          {
            id: 'sec-2-2',
            name: '2.2 다차원 바인더 및 캔버스 뷰포트',
            data: {
              id: 'sec-2-2',
              name: '2.2 다차원 바인더 및 캔버스 뷰포트',
              slotNumber: 4,
              fillingState: 'conflict',
              conflictReason: '참조 앵커 규격과 바인더 노드 속성 불일치',
              acceptTypes: ['text', 'table'],
            },
          },
        ],
      },
      {
        id: 'sec-3',
        name: '3. 에이전트 인텔리전스 & 거버넌스',
        isFolder: true,
        data: {
          id: 'sec-3',
          name: '3. 에이전트 인텔리전스 & 거버넌스',
          slotNumber: 3,
          fillingState: 'partial',
          isFolder: true,
        },
        children: [
          {
            id: 'sec-3-1',
            name: '3.1 인라인 AI 렌즈 및 프롬프트 하네스',
            data: {
              id: 'sec-3-1',
              name: '3.1 인라인 AI 렌즈 및 프롬프트 하네스',
              slotNumber: 5,
              fillingState: 'filled',
              mappedCount: 1,
              acceptTypes: ['text'],
            },
          },
          {
            id: 'sec-3-2',
            name: '3.2 HITL 3단계 계획 승인 게이트',
            data: {
              id: 'sec-3-2',
              name: '3.2 HITL 3단계 계획 승인 게이트',
              slotNumber: 6,
              fillingState: 'empty',
              acceptTypes: ['text'],
            },
          },
        ],
      },
      {
        id: 'sec-4',
        name: '4. 텔레메트리 및 관측 사양',
        data: {
          id: 'sec-4',
          name: '4. 텔레메트리 및 관측 사양',
          slotNumber: 4,
          fillingState: 'empty',
          acceptTypes: ['text', 'code'],
        },
      },
    ],
  },
];

/** 3. 미매핑 에셋 대기소 트레이 샘플 */
export const labStagingAssets: StagingAssetItem[] = [
  {
    id: 'asset-1',
    title: '시스템 계층별 경계 헌법 요약',
    type: 'text',
    sourceDocTitle: '00-core/rule.md',
    summary: '하위 레이어는 상위 레이어를 참조하지 않으며, 단방향 의존성을 철저히 유지합니다.',
  },
  {
    id: 'asset-2',
    title: '데이터 수명주기 등급 매트릭스',
    type: 'table',
    sourceDocTitle: '60-data/rule.md',
    summary: 'config, data, cache, state 등급별 격리 및 복구 정책',
  },
  {
    id: 'asset-3',
    title: 'Span / Attempt 관측 계약 인터페이스',
    type: 'code',
    sourceDocTitle: 'telemetry/contract.ts',
    summary: 'source_of 메타데이터 및 dotted_order 인덱스 계층 구조 정의',
  },
];

/** 4. 섹션별 본문 콘텐츠 목데이터 */
export interface LabSectionContent {
  id: string;
  title: string;
  slotNumber: number;
  status: '초안' | '작성중' | '검토필요' | '완료';
  summary: string;
  paragraphs: string[];
  wordCount: number;
}

export const labSectionContents: Record<string, LabSectionContent> = {
  'sec-1-1': {
    id: 'sec-1-1',
    title: '1.1 문제 정의 및 해결 전략',
    slotNumber: 1,
    status: '완료',
    summary: '단일 거대 문서의 분해 조립 한계와 에이전트 인터랙션의 단절을 극복하는 전략을 설명합니다.',
    paragraphs: [
      '현대의 복잡한 전문 문서는 수십 개의 세그먼트와 외부 증거 자료가 상호 참조되는 유기적 구조를 띱니다. 그러나 기존의 전통적인 위지윅(WYSIWYG) 에디터는 단일 거대 버퍼에 모든 텍스트를 담아내어, 구조적 분해와 부분 재합성에 취약했습니다.',
      '본 아키텍처는 문서를 원자적 세그먼트 단위로 분할하고, 각각의 세그먼트를 독립된 소켓으로 관리합니다. 이를 통해 작성자는 전체 조감도를 잃지 않으면서도 각 단락의 루브릭 규격을 정밀하게 타격하여 작성할 수 있습니다.',
      '또한 지능형 에이전트 하네스를 에디터 캔버스 바로 위에 오버레이하여, 문서 문맥을 손실 없이 실시간으로 주입받고 인라인 패치(Diff)를 안전하게 생성합니다.',
    ],
    wordCount: 420,
  },
  'sec-1-2': {
    id: 'sec-1-2',
    title: '1.2 도메인 중립 아키텍처 원칙',
    slotNumber: 2,
    status: '완료',
    summary: '호스트 환경에 비의존적인 코어 라이브러리 추출과 단방향 의존성 규칙을 정립합니다.',
    paragraphs: [
      '워크스페이스 엔진(@vibe/editor-workspace)은 특정 비즈니스 도메인이나 백엔드 프레임워크에 종속되지 않는 순수 Headless/UI 라이브러리로 설계되었습니다.',
      '도킹 셸, 바인더 트리, 뷰 레이아웃, 그리고 AI 하네스는 완전히 분리된 2중 계층(Two-Tier)으로 분리되어 있으며, 상위 호스트 앱은 필요한 컴포넌트만을 주입하여 자유롭게 조합할 수 있습니다.',
    ],
    wordCount: 310,
  },
  'sec-2-1': {
    id: 'sec-2-1',
    title: '2.1 멀티 스플릿 도킹 셸',
    slotNumber: 3,
    status: '작성중',
    summary: 'VS Code 스타일의 dockview 무한 탭 분할 및 뷰포트 격리 메커니즘을 다룹니다.',
    paragraphs: [
      'dockview 기반의 분할 시스템은 작성자가 좌우/상하로 에디터와 참조 문서를 나란히 배치할 수 있게 지원합니다.',
      '각 탭은 독립된 에디터 인스턴스 또는 시각화 뷰(캔버스, 아웃라이너, 코크보드)를 격리하여 호스팅하며, 활성 탭 전환 시 단축키(Ctrl+1~9)를 통해 레이턴시 없는 전환을 보장합니다.',
    ],
    wordCount: 280,
  },
  'sec-2-2': {
    id: 'sec-2-2',
    title: '2.2 다차원 바인더 및 캔버스 뷰포트',
    slotNumber: 4,
    status: '검토필요',
    summary: '루브릭 뼈대 ↔ 다차원 에셋 소켓 트리와 4대 문서 뷰 모드 간의 상호작용 규격입니다.',
    paragraphs: [
      '바인더 트리는 단순 파일 트리가 아닌, 문서의 논리적 뼈대(Spine)를 지탱하는 소켓 구조체입니다.',
      '현재 참조 앵커 규격과 바인더 노드 속성 간에 매핑 불일치가 감지되었습니다. 원본 서식 규격과 세그먼트 데이터 충돌을 해결하기 위한 AI 자동 수복 렌즈가 활성화되어 있습니다.',
    ],
    wordCount: 350,
  },
  'sec-3-1': {
    id: 'sec-3-1',
    title: '3.1 인라인 AI 렌즈 및 프롬프트 하네스',
    slotNumber: 5,
    status: '완료',
    summary: '단락 플로팅 스마트 액션 렌즈와 Ctrl+I 인라인 프롬프트 상호작용 사양입니다.',
    paragraphs: [
      '단락 헤더 상단에 떠 있는 인라인 렌즈(DocumentInlineLens)는 작성자가 특정 단락에 대한 요약, 논리 보강, 규격 검증을 1-클릭으로 트리거할 수 있게 돕습니다.',
      '선택된 텍스트 범위에 대해 Ctrl+I를 입력하면 플로팅 인풋 모달이 호출되어 즉각적인 인라인 패치 제안을 시각적 Diff로 확인할 수 있습니다.',
    ],
    wordCount: 290,
  },
  'sec-3-2': {
    id: 'sec-3-2',
    title: '3.2 HITL 3단계 계획 승인 게이트',
    slotNumber: 6,
    status: '초안',
    summary: '에이전트의 파괴적 문서 변경을 사전에 방지하는 3단계(Plan-Diff-Apply) 승인 프로세스입니다.',
    paragraphs: [
      '에이전트의 대규모 변경 요청이 발생하면 즉각 본문을 변경하지 않고, 변경 계획(Execution Plan) 모달을 띄워 사용자에게 사전 동의를 구합니다.',
      '사용자가 승인한 변경분만이 인라인 Diff 검토 화면으로 진입하며, 청크별 수락/거절을 거쳐 최종적으로 문서에 커밋됩니다.',
    ],
    wordCount: 195,
  },
  'sec-4': {
    id: 'sec-4',
    title: '4. 텔레메트리 및 관측 사양',
    slotNumber: 4,
    status: '초안',
    summary: '에이전트 실행 추론 단계별 Span, Step, Attempt 관측 및 불변 원장 기록 방안을 정의합니다.',
    paragraphs: [
      '모든 AI 추론 과정은 StepCollector를 통해 호스트 비의존적 관측 계약 규격으로 텔레메트리 버스에 전송됩니다.',
    ],
    wordCount: 110,
  },
};

/** 5. AI 패널용 실험 데이터 (에이전트 실행 스텝, 모델, 인용, Diff) */
export const labAvailableModels = [
  'Gemini-3.8-flash',
  'Gemini-3.1-pro',
  'Gemini-3.5-flash-lite',
  'Gemma4 31b',
];

export const labModelConfig: ModelConfig = {
  modelName: 'Gemini-3.8-flash',
  temperature: 0.2,
  maxTokens: 4096,
};

export const labContextTags: ContextTagItem[] = [
  { id: 'tag-1', type: 'section', label: '1.1 문제 정의 및 해결 전략' },
  { id: 'tag-2', type: 'doc', label: '루브릭 뼈대 헌법 (00-core)' },
];

export const labAgentSteps: AgentExecutionStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: '섹션 문맥 및 바인더 소켓 규격 수집',
    status: 'completed',
    thought: '문서의 원자적 분할 아키텍처와 호스트 비의존성 원칙이 적절히 서술되어 있는지 점검합니다. 2차 단락의 설명이 명확합니다.',
    startedAt: Date.now() - 60000,
    completedAt: Date.now() - 58000,
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: '인라인 개선안 및 서술 정밀화 패치 생성',
    status: 'completed',
    startedAt: Date.now() - 57000,
    completedAt: Date.now() - 55000,
  },
];

export const labDiffChunks: DiffChunkItem[] = [
  {
    id: 'diff-1',
    sectionTitle: '1.1 단락 결론부 보강 제안',
    originalText: '지능형 에이전트 하네스를 결합하여 작성 보조를 수행합니다.',
    proposedText: '또한 지능형 에이전트 하네스를 에디터 캔버스 바로 위에 오버레이하여, 문서 문맥을 손실 없이 실시간으로 주입받고 인라인 패치(Diff)를 안전하게 생성합니다.',
    status: 'pending',
    reason: '문맥 손실 방지 및 안전 승인 메커니즘 명시',
  },
];

export const labCitations: CitationItem[] = [
  {
    id: 'cite-1',
    index: 1,
    sourceDocTitle: '00-core/rule.md (시스템 헌법)',
    snippet: '하위 레이어는 상위 레이어를 참조하지 않으며, 단방향 의존성을 철저히 유지한다.',
    page: 1,
    confidence: 0.96,
  },
  {
    id: 'cite-2',
    index: 2,
    sourceDocTitle: '60-data/rule.md (데이터 관리 정본)',
    snippet: '캔버스 노드는 다른 애그리거트를 식별자로만 참조하며 본문 사본을 중복 보관하지 않는다.',
    page: 3,
    confidence: 0.92,
  },
];

export const labRunAttempts: RunAttemptItem[] = [
  {
    id: 'attempt-1',
    attemptNumber: 1,
    timestamp: Date.now() - 300000,
    prompt: '섹션 1.1 기본 골격 및 문제 정의 생성',
    result: '1.1 문제 정의 및 해결 전략 초안 생성 완료',
    modelName: 'Gemini-3.8-flash',
    isAccepted: true,
  },
  {
    id: 'attempt-2',
    attemptNumber: 2,
    timestamp: Date.now() - 60000,
    prompt: '에이전트 하네스 결합 설명 보강',
    result: '인라인 Diff 패치 및 단락 렌즈 보강 완료',
    modelName: 'Gemini-3.8-flash',
    isAccepted: true,
  },
];
