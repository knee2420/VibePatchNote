import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useScaffoldDocumentDetail } from '@/entities/scaffold-document';
import {
  updatePageInFullHtml,
  injectSlotValueInHtml,
  injectMultipleSlotsInHtml,
  extractSlotValuesFromHtml,
} from '../lib/scaffoldPageUtils';
import type {
  ActivityBarTab,
  BottomPanelTab,
  EditorTabItem,
  FileTreeNode,
  TerminalSessionItem,
  ChatMessageItem,
  DragPayload,
  ResourceViewMode,
  DirectoryBundle,
  ResourceItem,
  SlotBindingInfo,
  SlotBindingStatus,
  ResourceProvenanceInfo,
  BinderSpineMode,
} from './types';
import { initialFileTree } from './mockFileSystem';

export const INITIAL_SLOT_DEFINITIONS: Array<{
  slotId: string;
  slotNumber: number;
  label: string;
  pageNumber: number;
  suggestedValue: string;
  confidence: string;
  defaultResource: string;
  sourceLocation: string;
}> = [
  { slotId: 's1', slotNumber: 1, label: '회의 일시', pageNumber: 1, suggestedValue: '2018.11.08', confidence: '99%', defaultResource: '회의록_초안.md', sourceLocation: '1p 3L' },
  { slotId: 's2', slotNumber: 2, label: '회의 장소', pageNumber: 1, suggestedValue: '6공학관 6108-1호', confidence: '98%', defaultResource: '7,8월 디딤돌 회의록.hwp', sourceLocation: '1p 12L' },
  { slotId: 's3', slotNumber: 3, label: '참석자', pageNumber: 1, suggestedValue: '4명', confidence: '99%', defaultResource: '7,8월 디딤돌 회의록.hwp', sourceLocation: '1p 14L' },
  { slotId: 's4', slotNumber: 4, label: '회의 안건', pageNumber: 1, suggestedValue: '드론 관련 촬영 스케줄 일정 잡기', confidence: '96%', defaultResource: '사전 계획서.pdf', sourceLocation: '2p 17L' },
  { slotId: 's5', slotNumber: 5, label: '회의 내용', pageNumber: 1, suggestedValue: '1. 드론 비행 후 GPS 센서 정상 수집 확인 (3개 항목)', confidence: '97%', defaultResource: '회의록_초안.md', sourceLocation: '2p 5L' },
  { slotId: 's6', slotNumber: 6, label: '지출금액', pageNumber: 1, suggestedValue: '₩ 40,000', confidence: '99%', defaultResource: '영수증_스캔.png', sourceLocation: '합계금액' },
  { slotId: 's7', slotNumber: 7, label: '증빙자료 영수증', pageNumber: 1, suggestedValue: '다과 및 사무용품 구입 영수증 (신용카드)', confidence: '99%', defaultResource: '영수증_스캔.png', sourceLocation: '영수증 품목 3L' },
  { slotId: 's8', slotNumber: 8, label: '회의 일시', pageNumber: 2, suggestedValue: '2018.11.16', confidence: '99%', defaultResource: '9,10월디딤돌 회의록.hwp', sourceLocation: '1p 4L' },
  { slotId: 's9', slotNumber: 9, label: '회의 장소', pageNumber: 2, suggestedValue: '6공학관 6108-1호', confidence: '98%', defaultResource: '9,10월디딤돌 회의록.hwp', sourceLocation: '1p 11L' },
  { slotId: 's10', slotNumber: 10, label: '참석자', pageNumber: 2, suggestedValue: '3명', confidence: '99%', defaultResource: '9,10월디딤돌 회의록.hwp', sourceLocation: '1p 13L' },
  { slotId: 's12', slotNumber: 12, label: '회의 내용', pageNumber: 2, suggestedValue: '1. 드론 최종 점검, 2. 결과보고서 작성 (2개 항목)', confidence: '97%', defaultResource: '9,10월디딤돌 회의록.hwp', sourceLocation: '2p 15L' },
  { slotId: 's13', slotNumber: 13, label: '지출금액', pageNumber: 2, suggestedValue: '₩ 29,000', confidence: '99%', defaultResource: '영수증_스캔.png', sourceLocation: '합계금액' },
  { slotId: 's14', slotNumber: 14, label: '증빙자료 영수증', pageNumber: 2, suggestedValue: '다과 영수증 원본', confidence: '99%', defaultResource: '영수증_스캔.png', sourceLocation: '영수증 첨부란' },
];

const initialBundles: DirectoryBundle[] = [
  // 1. 실제 정본 참고 원본 문서 저장소 (apps/api/data/knowledge/documents)
  {
    id: 'bundle-data-knowledge',
    name: 'data/knowledge/documents (참고 원본 문서 저장소)',
    path: 'apps/api/data/knowledge/documents',
    sourceType: 'local',
    isCollapsed: false,
    items: [
      {
        id: 'doc-1a0897500d9-989a3b2b',
        docId: 'doc-1a0897500d9-989a3b2b',
        name: '11월 디딤돌 회의록.pdf',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'pdf',
        size: '33.8 KB',
        updatedAt: '2026-09-03',
        description: '회의비 사용 내역 와이어프레임의 정본 원본 문서 (정기 활동 회의록 및 예산 집행)',
        path: 'data/knowledge/documents/doc-1a0897500d9-989a3b2b/source.pdf',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'doc-pre-plan',
        name: '사전 계획서.pdf',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'pdf',
        size: '512 KB',
        updatedAt: '2026-09-01',
        description: '드론 촬영 일정 및 비행 테스트 사전 계획서 (슬롯 s4, s11 바인딩 출처)',
        path: 'data/knowledge/documents/사전 계획서.pdf',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'res-auto-2',
        name: '2018 창의미래설계 디딤돌 종합보고.hwp',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'hwp',
        size: '128.4 KB',
        updatedAt: '10분 전',
        description: '창의미래설계 종합 성과 보고서 정본',
        path: 'data/knowledge/documents/2018 창의미래설계 디딤돌 종합보고.hwp',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'doc-1a0897501d3-6c76ac35',
        docId: 'doc-1a0897501d3-6c76ac35',
        name: '프로젝트 매니저의 5대 필수 관리 문서.pdf',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'pdf',
        size: '1.1 MB',
        updatedAt: '2026-09-03',
        description: '프로젝트 관리 및 마일스톤 필수 체크리스트 서식',
        path: 'data/knowledge/documents/doc-1a0897501d3-6c76ac35/source.pdf',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'doc-1a0897501c4-45f9155b',
        docId: 'doc-1a0897501c4-45f9155b',
        name: 'Atticus LLC_ Invoice 000081709.pdf',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'pdf',
        size: '31.5 KB',
        updatedAt: '2026-09-07',
        description: 'Atticus 청구서 및 정산 명세서 원본',
        path: 'data/knowledge/documents/doc-1a0897501c4-45f9155b/source.pdf',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'doc-1a0897501c7-4e9494ac',
        docId: 'doc-1a0897501c7-4e9494ac',
        name: 'C-03_the_monorepo_solution.md',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'md',
        size: '706 B',
        updatedAt: '2026-09-03',
        description: '모노레포 아키텍처 및 도메인 분리 정본 가이드',
        path: 'data/knowledge/documents/doc-1a0897501c7-4e9494ac/source.md',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'res-auto-3',
        name: '7,8월 디딤돌 회의록.hwp',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'hwp',
        size: '38.2 KB',
        updatedAt: '25분 전',
        description: '하계 활동 회의록 서식',
        path: 'data/knowledge/documents/7,8월 디딤돌 회의록.hwp',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'res-auto-4',
        name: '9,10월디딤돌 회의록.hwp',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'hwp',
        size: '39.6 KB',
        updatedAt: '28분 전',
        description: '추계 활동 회의록 서식',
        path: 'data/knowledge/documents/9,10월디딤돌 회의록.hwp',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'res-auto-5',
        name: '디딤돌 각종 서식.hwp',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'hwp',
        size: '56.1 KB',
        updatedAt: '1시간 전',
        description: '표준 활동 신청 및 정산 서식 모음',
        path: 'data/knowledge/documents/디딤돌 각종 서식.hwp',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'res-auto-6',
        name: '디딤돌 결과보고서.hwp',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'hwp',
        size: '88.3 KB',
        updatedAt: '2시간 전',
        description: '최종 결과보고서 양식',
        path: 'data/knowledge/documents/디딤돌 결과보고서.hwp',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'res-auto-9',
        name: '딥드론 최종 ppt 00.pdf',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'pdf',
        size: '2.4 MB',
        updatedAt: '어제',
        description: '디딤돌 프로젝트 성과 발표 슬라이드 파트 1',
        path: 'data/knowledge/documents/딥드론 최종 ppt 00.pdf',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'res-auto-10',
        name: '딥드론 최종 ppt 01.pdf',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'pdf',
        size: '3.1 MB',
        updatedAt: '어제',
        description: '디딤돌 프로젝트 발표 슬라이드 파트 2 (시연 영상 포함)',
        path: 'data/knowledge/documents/딥드론 최종 ppt 01.pdf',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
      {
        id: 'res-auto-11',
        name: '젤리드론_결과보고서_final.pdf',
        category: 'linked',
        pipelineSource: 'data/knowledge/documents',
        format: 'pdf',
        size: '1.8 MB',
        updatedAt: '2일 전',
        description: '자율주행 드론 최종 보고서',
        path: 'data/knowledge/documents/젤리드론_결과보고서_final.pdf',
        isLocal: true,
        bundleId: 'bundle-data-knowledge',
        bundleName: 'data/knowledge/documents (참고 원본 문서 저장소)',
      },
    ],
  },
  // 2. 첨부 이미지 및 미디어 에셋 (Images)
  {
    id: 'bundle-assets-media',
    name: '첨부 이미지 및 미디어 에셋',
    path: 'local/assets/media',
    sourceType: 'local',
    isCollapsed: false,
    items: [
      {
        id: 'res-img-1',
        name: '드론_야외비행_테스트_01.png',
        category: 'assets',
        pipelineSource: 'local_assets',
        format: 'png',
        size: '1.2 MB',
        updatedAt: '방금 전',
        description: '야외 시험 비행 및 센서 캘리브레이션 캡처 사진',
        path: 'local/assets/media/드론_야외비행_테스트_01.png',
        isLocal: true,
        bundleId: 'bundle-assets-media',
        bundleName: '첨부 이미지 및 미디어 에셋',
        thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g1)" rx="12"/><circle cx="50" cy="45" r="16" fill="%23ffffff" opacity="0.9"/><path d="M25 75 Q50 55 75 75 Z" fill="%2360a5fa"/><circle cx="50" cy="45" r="8" fill="%232563eb"/><path d="M35 30 L65 30 M50 20 L50 40" stroke="%23ffffff" stroke-width="3" stroke-linecap="round"/></svg>',
      },
      {
        id: 'res-img-2',
        name: '창업동아리_공식로고.svg',
        category: 'assets',
        pipelineSource: 'local_assets',
        format: 'svg',
        size: '14.2 KB',
        updatedAt: '12분 전',
        description: '동아리 메인 브랜드 벡터 심볼 마크',
        path: 'local/assets/media/창업동아리_공식로고.svg',
        isLocal: true,
        bundleId: 'bundle-assets-media',
        bundleName: '첨부 이미지 및 미디어 에셋',
        content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="%234f46e5" stroke="%23818cf8" stroke-width="4"/><polygon points="50,22 62,42 85,45 68,61 72,83 50,72 28,83 32,61 15,45 38,42" fill="%23fbbf24"/></svg>',
        thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="%234f46e5" stroke="%23818cf8" stroke-width="4"/><polygon points="50,22 62,42 85,45 68,61 72,83 50,72 28,83 32,61 15,45 38,42" fill="%23fbbf24"/></svg>',
      },
      {
        id: 'res-img-3',
        name: '시제품_센서모듈_배선도.jpg',
        category: 'assets',
        pipelineSource: 'local_assets',
        format: 'jpg',
        size: '860 KB',
        updatedAt: '35분 전',
        description: '자이로 센서 및 아두이노 핀맵 실측 배선 다이어그램',
        path: 'local/assets/media/시제품_센서모듈_배선도.jpg',
        isLocal: true,
        bundleId: 'bundle-assets-media',
        bundleName: '첨부 이미지 및 미디어 에셋',
        thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230f172a" rx="12"/><rect x="20" y="25" width="60" height="50" fill="%23064e3b" stroke="%2310b981" stroke-width="2" rx="4"/><circle cx="35" cy="40" r="5" fill="%23fbbf24"/><circle cx="65" cy="40" r="5" fill="%2338bdf8"/><path d="M35 55 H65 M35 62 H55" stroke="%2334d399" stroke-width="2" stroke-linecap="round"/></svg>',
      },
      {
        id: 'res-img-4',
        name: '창의미래설계_포스터_디자인.jpg',
        category: 'assets',
        pipelineSource: 'local_assets',
        format: 'jpg',
        size: '2.1 MB',
        updatedAt: '1시간 전',
        description: '2018 창의미래설계 경진대회 메인 홍보 포스터 그래픽',
        path: 'local/assets/media/창의미래설계_포스터_디자인.jpg',
        isLocal: true,
        bundleId: 'bundle-assets-media',
        bundleName: '첨부 이미지 및 미디어 에셋',
        thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="p1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><rect width="100" height="100" fill="url(%23p1)" rx="12"/><text x="50" y="45" font-size="14" font-weight="bold" fill="%23ffffff" text-anchor="middle" font-family="sans-serif">2018</text><text x="50" y="65" font-size="10" font-weight="bold" fill="%23fdf2f8" text-anchor="middle" font-family="sans-serif">POSTER</text></svg>',
      },
      {
        id: 'res-img-5',
        name: '부스배치도_도면.png',
        category: 'assets',
        pipelineSource: 'local_assets',
        format: 'png',
        size: '540 KB',
        updatedAt: '2시간 전',
        description: '행사장 18번 부스 규격 및 전원 콘센트 위치 평면도',
        path: 'local/assets/media/부스배치도_도면.png',
        isLocal: true,
        bundleId: 'bundle-assets-media',
        bundleName: '첨부 이미지 및 미디어 에셋',
        thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231e1b4b" rx="12"/><rect x="15" y="20" width="30" height="25" fill="%234338ca" stroke="%23818cf8" stroke-width="1.5"/><rect x="55" y="20" width="30" height="25" fill="%234338ca" stroke="%23818cf8" stroke-width="1.5"/><rect x="15" y="55" width="70" height="30" fill="%23312e81" stroke="%236366f1" stroke-width="2"/><text x="50" y="74" font-size="9" fill="%23c7d2fe" text-anchor="middle" font-weight="bold">BOOTH 18</text></svg>',
      },
      {
        id: 'res-img-6',
        name: '지출증빙_영수증_스캔본.png',
        category: 'assets',
        pipelineSource: 'local_assets',
        format: 'png',
        size: '320 KB',
        updatedAt: '3시간 전',
        description: '다과 및 사무용품 구입 영수증 고해상도 스캔 이미지',
        path: 'local/assets/media/지출증빙_영수증_스캔본.png',
        isLocal: true,
        bundleId: 'bundle-assets-media',
        bundleName: '첨부 이미지 및 미디어 에셋',
        thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f1f5f9" rx="12"/><rect x="20" y="15" width="60" height="70" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><line x1="28" y1="28" x2="72" y2="28" stroke="%2364748b" stroke-width="3"/><line x1="28" y1="38" x2="58" y2="38" stroke="%2394a3b8" stroke-width="2"/><line x1="28" y1="48" x2="68" y2="48" stroke="%2394a3b8" stroke-width="2"/><line x1="28" y1="65" x2="72" y2="65" stroke="%230f172a" stroke-width="2.5"/></svg>',
      },
      {
        id: 'res-img-7',
        name: '팀원_프로필_카드.png',
        category: 'assets',
        pipelineSource: 'local_assets',
        format: 'png',
        size: '480 KB',
        updatedAt: '어제',
        description: '발표 슬라이드용 팀원 소개 아바타 및 역할 명판',
        path: 'local/assets/media/팀원_프로필_카드.png',
        isLocal: true,
        bundleId: 'bundle-assets-media',
        bundleName: '첨부 이미지 및 미디어 에셋',
        thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23042f2e" rx="12"/><circle cx="50" cy="40" r="18" fill="%2314b8a6"/><path d="M22 80 C22 62 78 62 78 80 Z" fill="%230d9488"/><text x="50" y="92" font-size="8" fill="%23ccfbf1" text-anchor="middle" font-weight="bold">TEAM MEMBER</text></svg>',
      },
    ],
  },
  // 3. 파이프라인 백데이터 (Pipelines)
  {
    id: 'bundle-pipelines',
    name: '96.data_pipeline (정본 지식 & 파이프라인)',
    path: 'workbench/96.data_pipeline',
    sourceType: 'pipeline',
    isCollapsed: false,
    items: [
      {
        id: 'res-pipe-1',
        name: 'pipeline-run-fabfd713.json',
        category: 'pipelines',
        pipelineSource: 'pdf_ingestion_pipeline',
        format: 'json',
        size: '24.5 KB',
        updatedAt: '방금 전',
        description: '회의비 사용 내역 PDF 슬롯 실측 및 OCR 원천 데이터',
        path: '96.data_pipeline/runs/pipeline-run-fabfd713.json',
        slotsCount: 14,
        content: '{\n  "pipeline": "pdf_ingestion",\n  "status": "completed",\n  "docId": "fabfd713",\n  "slotsExtracted": 14\n}',
        bundleId: 'bundle-pipelines',
        bundleName: '96.data_pipeline (정본 지식 & 파이프라인)',
      },
      {
        id: 'res-pipe-2',
        name: 'telemetry-traces-span42.json',
        category: 'pipelines',
        pipelineSource: 'agent_telemetry_pipeline',
        format: 'json',
        size: '48.1 KB',
        updatedAt: '3분 전',
        description: 'Agent Runtime 다중 LLM 추론 및 Step 관측 트레이스',
        path: '96.data_pipeline/telemetry/telemetry-traces-span42.json',
        content: '{\n  "spanId": "span-42",\n  "model": "Gemini 3.8 Flash",\n  "totalAttempts": 1,\n  "status": "success"\n}',
        bundleId: 'bundle-pipelines',
        bundleName: '96.data_pipeline (정본 지식 & 파이프라인)',
      },
      {
        id: 'res-pipe-3',
        name: 'workbench-96-card-spec.md',
        category: 'pipelines',
        pipelineSource: '96.data_pipeline',
        format: 'md',
        size: '12.8 KB',
        updatedAt: '12분 전',
        description: '고밀도 지식 파이프라인 정본 카드 인덱스 규격',
        path: '96.data_pipeline/specs/workbench-96-card-spec.md',
        content: '# Workbench 96 Knowledge Card Spec\n\n- Type: Dense Knowledge Index\n- Category: Pipeline Reference\n',
        bundleId: 'bundle-pipelines',
        bundleName: '96.data_pipeline (정본 지식 & 파이프라인)',
      },
      {
        id: 'res-pipe-4',
        name: 'extracted-slots-mapping.json',
        category: 'pipelines',
        pipelineSource: 'scaffold_extractor',
        format: 'json',
        size: '8.4 KB',
        updatedAt: '15분 전',
        description: 'A4 좌표계 기반 14개 슬롯 바운딩 박스 매핑',
        path: '96.data_pipeline/scaffolds/extracted-slots-mapping.json',
        slotsCount: 14,
        content: '[\n  { "slotId": "slot-1", "name": "회의 일시", "x": 180, "y": 240, "w": 380, "h": 24 }\n]',
        bundleId: 'bundle-pipelines',
        bundleName: '96.data_pipeline (정본 지식 & 파이프라인)',
      },
    ],
  },
  // 3. 에셋 라이브러리 (Assets)
  {
    id: 'bundle-assets',
    name: '서식 & 템플릿 에셋 라이브러리',
    path: 'assets/templates',
    sourceType: 'builtin',
    isCollapsed: false,
    items: [
      {
        id: 'res-asset-1',
        name: 'company-seal-stamp.svg',
        category: 'assets',
        pipelineSource: 'asset_storage',
        format: 'svg',
        size: '4.2 KB',
        updatedAt: '1시간 전',
        description: '법인 인감 서식 직인 벡터 에셋',
        path: 'assets/stamps/company-seal-stamp.svg',
        content: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" stroke="#ef4444" stroke-width="4" fill="none"/></svg>',
        bundleId: 'bundle-assets',
        bundleName: '서식 & 템플릿 에셋 라이브러리',
      },
      {
        id: 'res-asset-2',
        name: 'receipt-voucher-sample.md',
        category: 'assets',
        pipelineSource: 'voucher_pipeline',
        format: 'md',
        size: '6.1 KB',
        updatedAt: '2시간 전',
        description: '신용카드 영수증 증빙 샘플 텍스트 명세',
        path: 'assets/vouchers/receipt-voucher-sample.md',
        content: '### 영수증 증빙 샘플\n\n- 사용처: 회의용 다과점\n- 금액: 45,000원\n- 일시: 2026-09-17\n',
        bundleId: 'bundle-assets',
        bundleName: '서식 & 템플릿 에셋 라이브러리',
      },
      {
        id: 'res-asset-3',
        name: 'a4-multi-column-grid.svg',
        category: 'assets',
        pipelineSource: 'template_generator',
        format: 'svg',
        size: '5.8 KB',
        updatedAt: '어제',
        description: 'A4 2단/3단 다단 그리드 레이아웃 템플릿',
        path: 'assets/templates/a4-multi-column-grid.svg',
        content: '<svg viewBox="0 0 595 842"><rect width="595" height="842" fill="#fff"/></svg>',
        bundleId: 'bundle-assets',
        bundleName: '서식 & 템플릿 에셋 라이브러리',
      },
    ],
  },
  // 4. 문서 스키마/원천 (Schemas)
  {
    id: 'bundle-schemas',
    name: '문서 규격 & 스키마 원천',
    path: 'schemas/documents',
    sourceType: 'builtin',
    isCollapsed: false,
    items: [
      {
        id: 'res-schema-1',
        name: 'meeting-expense-schema.json',
        category: 'schemas',
        pipelineSource: 'schema_registry',
        format: 'json',
        size: '16.4 KB',
        updatedAt: '1일 전',
        description: '회의비 정산 서식 SSOT 스키마 v2.1',
        path: 'schemas/documents/meeting-expense-schema.json',
        content: '{\n  "$schema": "https://vibe.io/scaffold.json",\n  "title": "회의비 사용 내역",\n  "version": "2.1"\n}',
        bundleId: 'bundle-schemas',
        bundleName: '문서 규격 & 스키마 원천',
      },
      {
        id: 'res-schema-2',
        name: 'a4-page-layout-spec.json',
        category: 'schemas',
        pipelineSource: 'scaffold_engine',
        format: 'json',
        size: '9.2 KB',
        updatedAt: '2일 전',
        description: 'A4 595x842 다단 그리드 규격 및 슬롯 제약 사양',
        path: 'schemas/specs/a4-page-layout-spec.json',
        content: '{\n  "pageWidth": 595,\n  "pageHeight": 842,\n  "gridCols": 2,\n  "margin": 36\n}',
        bundleId: 'bundle-schemas',
        bundleName: '문서 규격 & 스키마 원천',
      },
      {
        id: 'res-schema-3',
        name: 'agent-runtime-contract.ts',
        category: 'schemas',
        pipelineSource: 'agent_core',
        format: 'ts',
        size: '14.0 KB',
        updatedAt: '3일 전',
        description: '도메인 비의존 Agent 관측 및 승인 계약 인터페이스',
        path: 'schemas/contracts/agent-runtime-contract.ts',
        content: 'export interface AgentRuntimeContract {\n  sessionId: string;\n  runAttempt(prompt: string): Promise<void>;\n}\n',
        bundleId: 'bundle-schemas',
        bundleName: '문서 규격 & 스키마 원천',
      },
    ],
  },
];


const DEFAULT_SCAFFOLD_ID = 'scaffold-1a0a0008250-fabfd713';

export function useIdeWorkspaceState(scaffoldId: string = DEFAULT_SCAFFOLD_ID) {
  // 실제 백엔드 스캐폴드 아카이브 데이터 연동
  const {
    detail,
    isLoading: isLoadingScaffold,
    error: scaffoldError,
    syncState,
    liveHtml,
    liveMarkdown,
    setLiveHtml,
    setLiveMarkdown,
    saveImmediately,
    reload: reloadScaffold,
  } = useScaffoldDocumentDetail(scaffoldId);

  // 1. 패널 레이아웃 및 크기 상태
  const [showPrimarySidebar, setShowPrimarySidebar] = useState(true);
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [showResourceManager, setShowResourceManager] = useState(true);

  const [primarySidebarWidth, setPrimarySidebarWidth] = useState(260);
  const [secondarySidebarWidth, setSecondarySidebarWidth] = useState(360);
  const [resourceManagerWidth, setResourceManagerWidth] = useState(300);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [splitRatio, setSplitRatio] = useState(55); // 좌우 에디터 분할 비율 (와이어프레임 캔버스 55% : 소스코드 45%)

  const [isDraggingAnyResizer, setIsDraggingAnyResizer] = useState(false);

  // 리소스 매니저 상태 (다중 디렉토리 묶음 & 통합 리소스 관리)
  const [bundles, setBundles] = useState<DirectoryBundle[]>(initialBundles);
  const [resourceViewMode, setResourceViewMode] = useState<ResourceViewMode>('directories');
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [linkedFolderName, setLinkedFolderName] = useState<string | null>(null);

  // 모든 디렉토리 묶음의 리소스 통합 평면 목록 (SSOT)
  const resources = useMemo(() => {
    return bundles.flatMap((b) => b.items);
  }, [bundles]);

  // 헵타베이스 스타일 우측 리소스 모달 상태 (출처 Provenance 지원)
  const [resourceModalResource, setResourceModalResource] = useState<ResourceItem | null>(null);
  const [resourceModalProvenance, setResourceModalProvenance] = useState<ResourceProvenanceInfo | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [resourceModalWidth, setResourceModalWidth] = useState<number>(620);

  const handleOpenResourceModal = useCallback((resource: ResourceItem, provenance?: ResourceProvenanceInfo) => {
    setResourceModalResource(resource);
    setResourceModalProvenance(provenance || null);
    setIsResourceModalOpen(true);
  }, []);

  const handleCloseResourceModal = useCallback(() => {
    setIsResourceModalOpen(false);
    setResourceModalProvenance(null);
  }, []);

  // -------------------------------------------------------------------------
  // 좌측 Reasoning 모달 상태 (Prompt + 바인더 아웃라인 맥락 + 레시피 규격)
  // -------------------------------------------------------------------------
  const [isReasoningModalOpen, setIsReasoningModalOpen] = useState<boolean>(false);
  const [reasoningFocusedSlotId, setReasoningFocusedSlotId] = useState<string | null>(null);

  const handleOpenReasoningModal = useCallback((slotId?: string) => {
    setReasoningFocusedSlotId(slotId || null);
    setIsReasoningModalOpen(true);
  }, []);

  const handleCloseReasoningModal = useCallback(() => {
    setIsReasoningModalOpen(false);
    setReasoningFocusedSlotId(null);
  }, []);

  // -------------------------------------------------------------------------
  // 좌측 레퍼런스 원본 패널 & 프로크리에이트 스타일 플로팅 레퍼런스 창 상태
  // -------------------------------------------------------------------------
  const [isLeftReferenceOpen, setIsLeftReferenceOpen] = useState<boolean>(false);
  const [leftReferenceWidth, setLeftReferenceWidth] = useState<number>(580);
  const [isFloatingReferenceOpen, setIsFloatingReferenceOpen] = useState<boolean>(false);
  // apps/api/data 매핑 원장에 따른 현재 와이어프레임('회의비 사용 내역')의 정본 원본 문서 ID
  const [selectedReferenceDocId, setSelectedReferenceDocId] = useState<string | null>(
    detail?.docId || 'doc-1a0897500d9-989a3b2b'
  );

  // detail.docId가 비동기로 로드되면 동기화
  useEffect(() => {
    if (detail?.docId) {
      setSelectedReferenceDocId(detail.docId);
    }
  }, [detail?.docId]);

  // 참고 원본 문서 목록 (HWP, PDF, DOCX, MD, 텍스트 등 실제 문서 중 현재 스캐폴드의 정본 문서를 최우선 정렬)
  const referenceDocuments = useMemo(() => {
    const docs = resources.filter((r) => {
      const fmt = r.format.toLowerCase();
      const isDocFormat = ['pdf', 'hwp', 'docx', 'doc', 'md', 'txt'].includes(fmt);
      const isNotImage =
        !['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(fmt) &&
        !r.name.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i);
      return isDocFormat && isNotImage;
    });

    // 현재 스캐폴드의 정본 원본 문서(doc-1a0897500d9-989a3b2b)를 항상 최상단에 배치
    const targetDocId = detail?.docId || 'doc-1a0897500d9-989a3b2b';
    return docs.sort((a, b) => {
      if (a.id === targetDocId || a.docId === targetDocId) return -1;
      if (b.id === targetDocId || b.docId === targetDocId) return 1;
      return 0;
    });
  }, [resources, detail?.docId]);

  const activeReferenceDoc = useMemo(() => {
    if (selectedReferenceDocId) {
      const found = resources.find((r) => r.id === selectedReferenceDocId || r.docId === selectedReferenceDocId);
      if (found) return found;
    }
    return referenceDocuments[0] || null;
  }, [selectedReferenceDocId, resources, referenceDocuments]);

  const handleToggleLeftReference = useCallback(() => {
    setIsLeftReferenceOpen((prev) => !prev);
  }, []);

  const handlePopoutToFloating = useCallback(() => {
    setIsLeftReferenceOpen(false);
    setIsFloatingReferenceOpen(true);
  }, []);

  const handleDockFloatingToPanel = useCallback(() => {
    setIsFloatingReferenceOpen(false);
    setIsLeftReferenceOpen(true);
  }, []);

  const handleCloseReference = useCallback(() => {
    setIsLeftReferenceOpen(false);
    setIsFloatingReferenceOpen(false);
  }, []);

  const handleSelectReferenceDoc = useCallback((doc: ResourceItem) => {
    setSelectedReferenceDocId(doc.id);
  }, []);

  // -------------------------------------------------------------------------
  // 슬롯 소켓 바인딩 상태 관리 (스캐폴드 슬롯 ↔ 백데이터 리소스 매핑 SSOT)
  // -------------------------------------------------------------------------
  const [slotBindings, setSlotBindings] = useState<Record<string, SlotBindingInfo>>(() => {
    const initial: Record<string, SlotBindingInfo> = {};
    INITIAL_SLOT_DEFINITIONS.forEach((def) => {
      initial[def.slotId] = {
        slotId: def.slotId,
        slotNumber: def.slotNumber,
        label: def.label,
        pageNumber: def.pageNumber,
        status: 'suggested',
        currentValue: '',
        suggestedValue: def.suggestedValue,
        confidence: def.confidence,
        resourceName: def.defaultResource,
        sourceLocation: def.sourceLocation,
      };
    });
    return initial;
  });

  // liveHtml 내용이 로드되거나 변경될 때 각 슬롯의 현재 실제 값을 슬롯 바인딩 상태에 실시간 동기화
  useEffect(() => {
    if (!liveHtml) return;
    const extracted = extractSlotValuesFromHtml(liveHtml);
    setSlotBindings((prev) => {
      let hasChanges = false;
      const next = { ...prev };
      INITIAL_SLOT_DEFINITIONS.forEach((def) => {
        const val = extracted[def.slotId] ?? '';
        const current = prev[def.slotId];
        if (current) {
          const isFilled = Boolean(val.trim());
          const newStatus: SlotBindingStatus = isFilled ? 'bound' : (current.status === 'unbound' ? 'unbound' : 'suggested');
          if (current.currentValue !== val || current.status !== newStatus) {
            next[def.slotId] = {
              ...current,
              currentValue: val,
              status: newStatus,
              resourceName: current.resourceName || (isFilled ? '기존 서식 데이터' : def.defaultResource),
              sourceLocation: current.sourceLocation || def.sourceLocation,
            };
            hasChanges = true;
          }
        }
      });
      return hasChanges ? next : prev;
    });
  }, [liveHtml]);

  // 특정 슬롯에 리소스 / 텍스트 바인딩
  const handleBindSlot = useCallback(
    (slotId: string, value: string, resourceName?: string, resourceId?: string, sourceLocation?: string) => {
      const nextHtml = injectSlotValueInHtml(liveHtml, slotId, value);
      setLiveHtml(nextHtml);

      // 열려있는 render.html 탭에도 동기화
      setPane1Tabs((prev) =>
        prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
      );
      setPane2Tabs((prev) =>
        prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
      );

      setSlotBindings((prev) => {
        const target = prev[slotId];
        if (!target) return prev;
        return {
          ...prev,
          [slotId]: {
            ...target,
            status: 'bound',
            currentValue: value,
            resourceName: resourceName || '직접 바인딩',
            resourceId,
            sourceLocation: sourceLocation || target.sourceLocation || '사용자 지정',
          },
        };
      });

      void saveImmediately();
    },
    [liveHtml, setLiveHtml, saveImmediately]
  );

  // 슬롯의 리소스 매핑 클릭 시: 원본 리소스 출력 모달을 열고 출처 표시(Provenance) 연동
  const handleOpenSlotProvenance = useCallback(
    (binding: SlotBindingInfo) => {
      // 1. 등록된 resources 중 해당 리소스 검색
      let matched = resources.find(
        (r: ResourceItem) =>
          (binding.resourceId && r.id === binding.resourceId) ||
          (binding.resourceName &&
            (r.name.toLowerCase() === binding.resourceName.toLowerCase() ||
              r.name.toLowerCase().includes(binding.resourceName.toLowerCase()) ||
              binding.resourceName.toLowerCase().includes(r.name.toLowerCase())))
      );

      // 2. 만약 resources 목록에 직접 매칭되는 파일이 없다면 가상 리소스 아이템 동적 생성
      if (!matched) {
        const resName = binding.resourceName || '사전 계획서.pdf';
        const format = resName.split('.').pop() || 'pdf';
        matched = {
          id: `res-${binding.slotId}`,
          name: resName,
          category: 'linked',
          pipelineSource: '96.data_pipeline',
          format,
          size: '1.4 MB',
          updatedAt: '방금 전',
          description: `슬롯 #${binding.slotNumber} '${binding.label}'의 원본 인용 출처 문서`,
          path: `업무 자동화 샘플/${resName}`,
          content: `// ==========================================================================\n// [원본 출처 문서: ${resName}]\n// 인용 위치: ${binding.sourceLocation || '2p 17L'}\n// 인용 슬롯: #${binding.slotNumber} ${binding.label}\n// ==========================================================================\n\n[발췌 텍스트]\n${binding.currentValue || binding.suggestedValue}\n\n// 세부 검증 신뢰도: ${binding.confidence || '98%'}\n// 출처 검증 상태: Provenance Verified\n`,
        };
      }

      const prov: ResourceProvenanceInfo = {
        slotId: binding.slotId,
        slotNumber: binding.slotNumber,
        slotLabel: binding.label,
        value: binding.currentValue || binding.suggestedValue,
        sourceName: binding.resourceName || matched.name,
        sourceLocation: binding.sourceLocation || '2p 17L',
        confidence: binding.confidence || '98%',
        highlightText: binding.currentValue || binding.suggestedValue,
      };

      handleOpenResourceModal(matched, prov);
    },
    [resources, handleOpenResourceModal]
  );

  // 슬롯 바인딩 해제 (빈 소켓으로 초기화)
  const handleUnbindSlot = useCallback(
    (slotId: string) => {
      const nextHtml = injectSlotValueInHtml(liveHtml, slotId, '');
      setLiveHtml(nextHtml);

      setPane1Tabs((prev) =>
        prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
      );
      setPane2Tabs((prev) =>
        prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
      );

      setSlotBindings((prev) => {
        const target = prev[slotId];
        if (!target) return prev;
        return {
          ...prev,
          [slotId]: {
            ...target,
            status: 'unbound',
            currentValue: '',
            resourceName: undefined,
            resourceId: undefined,
          },
        };
      });

      void saveImmediately();
    },
    [liveHtml, setLiveHtml, saveImmediately]
  );

  // 추천 값 승인 및 적용
  const handleApplySuggested = useCallback(
    (slotId: string) => {
      const target = slotBindings[slotId];
      if (!target) return;
      handleBindSlot(slotId, target.suggestedValue, target.resourceName || '레퍼런스 분석');
    },
    [slotBindings, handleBindSlot]
  );

  // 모든 빈 슬롯에 추천 데이터 일괄 적용
  const handleApplyAllSuggestions = useCallback(() => {
    const updates: Record<string, string> = {};
    INITIAL_SLOT_DEFINITIONS.forEach((def) => {
      const b = slotBindings[def.slotId];
      if (!b || b.status !== 'bound') {
        updates[def.slotId] = def.suggestedValue;
      }
    });

    if (Object.keys(updates).length === 0) return;

    const nextHtml = injectMultipleSlotsInHtml(liveHtml, updates);
    setLiveHtml(nextHtml);

    setPane1Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
    );
    setPane2Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
    );

    setSlotBindings((prev) => {
      const next = { ...prev };
      Object.entries(updates).forEach(([sId, val]) => {
        const def = INITIAL_SLOT_DEFINITIONS.find((d) => d.slotId === sId);
        if (next[sId]) {
          next[sId] = {
            ...next[sId],
            status: 'bound',
            currentValue: val,
            resourceName: def?.defaultResource || '레퍼런스 추천',
          };
        }
      });
      return next;
    });

    void saveImmediately();
  }, [slotBindings, liveHtml, setLiveHtml, saveImmediately]);

  // 모든 슬롯 초기화 (빈 소켓으로 초기화)
  const handleResetAllSlots = useCallback(() => {
    const updates: Record<string, string> = {};
    INITIAL_SLOT_DEFINITIONS.forEach((def) => {
      updates[def.slotId] = '';
    });

    const nextHtml = injectMultipleSlotsInHtml(liveHtml, updates);
    setLiveHtml(nextHtml);

    setPane1Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
    );
    setPane2Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
    );

    setSlotBindings((prev) => {
      const next = { ...prev };
      INITIAL_SLOT_DEFINITIONS.forEach((def) => {
        if (next[def.slotId]) {
          next[def.slotId] = {
            ...next[def.slotId],
            status: 'unbound',
            currentValue: '',
            resourceName: undefined,
          };
        }
      });
      return next;
    });

    void saveImmediately();
  }, [liveHtml, setLiveHtml, saveImmediately]);


  // 새 디렉토리 묶음 추가 (밑으로 계속 추가되는 묶음 구조)
  const handleAddDirectoryBundle = useCallback((bundle: DirectoryBundle) => {
    setBundles((prev) => {
      const existsIndex = prev.findIndex((b) => b.id === bundle.id);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = bundle;
        return next;
      }
      return [...prev, bundle];
    });
  }, []);

  // 디렉토리 묶음 제거 / 연동 해제
  const handleRemoveDirectoryBundle = useCallback((bundleId: string) => {
    setBundles((prev) => prev.filter((b) => b.id !== bundleId));
  }, []);

  // 디렉토리 묶음 접기 / 펼치기 토글
  const handleToggleBundleCollapse = useCallback((bundleId: string) => {
    setBundles((prev) =>
      prev.map((b) => (b.id === bundleId ? { ...b, isCollapsed: !b.isCollapsed } : b))
    );
  }, []);

  // 로컬 파일 디렉토리 연결 시 새 묶음으로 하단에 추가
  const handleAddResources = useCallback(
    (newItems: ResourceItem[], customBundleName?: string) => {
      const bName = customBundleName || newItems[0]?.pipelineSource || '로컬 파일 디렉토리';
      const bundleId = `bundle-local-${Date.now()}`;
      const newBundle: DirectoryBundle = {
        id: bundleId,
        name: bName,
        path: `local/${bName}`,
        sourceType: 'local',
        isCollapsed: false,
        items: newItems.map((item) => ({
          ...item,
          bundleId,
          bundleName: bName,
        })),
      };
      handleAddDirectoryBundle(newBundle);
      setLinkedFolderName(bName);
    },
    [handleAddDirectoryBundle]
  );

  const handleDisconnectFolder = useCallback(() => {
    setBundles((prev) => prev.filter((b) => b.sourceType !== 'local'));
    setLinkedFolderName(null);
  }, []);

  // 2. Activity Bar & Bottom Panel 활성 탭
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityBarTab>('explorer');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomPanelTab>('recipe');
  const [activeSpine, setActiveSpine] = useState<BinderSpineMode>('outline');

  // 3. 파일 트리 상태
  const [fileTree, setFileTree] = useState<FileTreeNode[]>(initialFileTree);

  // 4. 멀티 Pane 에디터 상태 (Pane 1: 와이어프레임 캔버스, Pane 2: 소스 코드/규격)
  const [isSplitEditor, setIsSplitEditor] = useState<boolean>(false);

  const [pane1Tabs, setPane1Tabs] = useState<EditorTabItem[]>([
    {
      id: 'tab-wireframe-canvas',
      name: 'wireframe.canvas',
      path: 'wireframe/canvas',
      language: 'canvas',
      type: 'wireframe',
      scaffoldId,
      isModified: false,
      content: '',
    },
    {
      id: 'tab-wireframe-html',
      name: 'render.html',
      path: 'wireframe/render.html',
      language: 'html',
      type: 'code',
      scaffoldId,
      isModified: false,
      content: '<!-- 로딩 중... -->',
    },
  ]);
  const [pane1ActiveId, setPane1ActiveId] = useState<string>('tab-wireframe-canvas');

  const [pane2Tabs, setPane2Tabs] = useState<EditorTabItem[]>([
    {
      id: 'tab-artifact-v1',
      name: '📦 Artifact: 회의록 데이터 초안 (v1)',
      path: 'artifact/stage-v1',
      language: 'diff',
      type: 'artifact',
      scaffoldId,
      isModified: true,
      content: '',
    },
    {
      id: 'tab-wireframe-md',
      name: 'content.md',
      path: 'wireframe/content.md',
      language: 'markdown',
      type: 'code',
      scaffoldId,
      isModified: false,
      content: '# 로딩 중...',
    },
    {
      id: 'tab-wireframe-slots',
      name: 'slots.json',
      path: 'wireframe/slots.json',
      language: 'json',
      type: 'code',
      scaffoldId,
      isModified: false,
      content: '[]',
    },
  ]);
  const [pane2ActiveId, setPane2ActiveId] = useState<string>('tab-wireframe-md');

  const [cursorPosition, setCursorPosition] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // 5. 터미널 상태
  const [terminalSessions, setTerminalSessions] = useState<TerminalSessionItem[]>([
    {
      id: 'powershell-1',
      name: 'powershell',
      history: [
        'PS C:\\AI_Projects\\WebNovelAssistant\\VibePatchNote> git status',
        'On branch add-document-editor',
        'Changes not staged for commit:',
        '  modified:   apps/web/src/pages/editor-lab/ui/EditorLabPage.tsx',
      ],
    },
    {
      id: 'turbo-dev',
      name: 'turbo',
      history: [
        'PS C:\\AI_Projects\\WebNovelAssistant\\VibePatchNote> pnpm dev',
        '@vibe/web:dev:   Local:   http://localhost:5173/',
        '@vibe/api:dev: INFO:     Uvicorn running on http://127.0.0.1:8000',
      ],
    },
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('turbo-dev');
  const [terminalCommandInput, setTerminalCommandInput] = useState<string>('');

  // 6. AI 챗 패널 상태
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg-1',
      sender: 'user',
      timestamp: '23:05',
      content: '화면 스플릿, 탭 이동, 패널 크기 조절 기능이 가능한가?',
    },
    {
      id: 'msg-2',
      sender: 'agent',
      timestamp: '23:06',
      content: '네, 탭 드래그 앤 드롭 이동, 탐색기 파일 드롭, 4대 패널 마우스 리사이징을 완벽하게 지원합니다.',
      filesChanged: { count: 4, additions: 420, deletions: 80 },
    },
  ]);
  const [promptInput, setPromptInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('Gemini 3.8 Flash High');
  const [isAiStreaming, setIsAiStreaming] = useState<boolean>(false);

  // 활성 탭 객체 도출
  const pane1ActiveTab = pane1Tabs.find((t) => t.id === pane1ActiveId) || pane1Tabs[0];
  const pane2ActiveTab = pane2Tabs.find((t) => t.id === pane2ActiveId) || pane2Tabs[0];

  // 파일 트리 내 파일 검색 헬퍼
  const findFileNodeById = (nodes: FileTreeNode[], fileId: string): FileTreeNode | null => {
    for (const node of nodes) {
      if (node.id === fileId) return node;
      if (node.children) {
        const found = findFileNodeById(node.children, fileId);
        if (found) return found;
      }
    }
    return null;
  };

  // 폴더 접기/펼치기
  const toggleFolderRecursive = (nodes: FileTreeNode[], targetId: string): FileTreeNode[] => {
    return nodes.map((node) => {
      if (node.id === targetId) return { ...node, isOpen: !node.isOpen };
      if (node.children) return { ...node, children: toggleFolderRecursive(node.children, targetId) };
      return node;
    });
  };

  const handleToggleFolder = useCallback((folderId: string) => {
    setFileTree((prev) => toggleFolderRecursive(prev, folderId));
  }, []);

  // 탭 닫기
  const handleCloseTab = useCallback((tabId: string, pane: 'pane1' | 'pane2', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (pane === 'pane1') {
      setPane1Tabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === pane1ActiveId && next.length > 0) {
          setPane1ActiveId(next[next.length - 1].id);
        }
        return next;
      });
    } else {
      setPane2Tabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === pane2ActiveId && next.length > 0) {
          setPane2ActiveId(next[next.length - 1].id);
        }
        return next;
      });
    }
  }, [pane1ActiveId, pane2ActiveId]);

  // 탭을 다른 Pane으로 이전 (Move to other pane)
  const handleMoveTab = useCallback((tabId: string, fromPane: 'pane1' | 'pane2', toPane: 'pane1' | 'pane2') => {
    if (fromPane === toPane) return;

    if (fromPane === 'pane1') {
      const targetTab = pane1Tabs.find((t) => t.id === tabId);
      if (!targetTab) return;
      // Pane 1에서 제거
      setPane1Tabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === pane1ActiveId && next.length > 0) {
          setPane1ActiveId(next[next.length - 1].id);
        }
        return next;
      });
      // Pane 2에 추가
      setPane2Tabs((prev) => {
        const exists = prev.find((t) => t.id === tabId);
        if (exists) return prev;
        return [...prev, targetTab];
      });
      setPane2ActiveId(tabId);
      setIsSplitEditor(true);
    } else {
      const targetTab = pane2Tabs.find((t) => t.id === tabId);
      if (!targetTab) return;
      // Pane 2에서 제거
      setPane2Tabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === pane2ActiveId && next.length > 0) {
          setPane2ActiveId(next[next.length - 1].id);
        }
        return next;
      });
      // Pane 1에 추가
      setPane1Tabs((prev) => {
        const exists = prev.find((t) => t.id === tabId);
        if (exists) return prev;
        return [...prev, targetTab];
      });
      setPane1ActiveId(tabId);
    }
  }, [pane1Tabs, pane2Tabs, pane1ActiveId, pane2ActiveId]);

  // 탭 순서 변경 및 Pane 간 위치 지정 이동 (Reorder / Insert)
  const handleReorderTab = useCallback(
    (
      sourceTabId: string,
      targetTabId: string | null,
      sourcePane: 'pane1' | 'pane2',
      targetPane: 'pane1' | 'pane2',
      position: 'before' | 'after' = 'before'
    ) => {
      // 1. 동일 Pane 내에서 탭 순서 변경 (Reorder)
      if (sourcePane === targetPane) {
        if (sourceTabId === targetTabId) return;

        const updateTabs = (prevTabs: EditorTabItem[]) => {
          const sourceTab = prevTabs.find((t) => t.id === sourceTabId);
          if (!sourceTab) return prevTabs;

          const remaining = prevTabs.filter((t) => t.id !== sourceTabId);
          if (!targetTabId) {
            return [...remaining, sourceTab];
          }

          const targetIndex = remaining.findIndex((t) => t.id === targetTabId);
          if (targetIndex === -1) {
            return [...remaining, sourceTab];
          }

          const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
          const nextTabs = [...remaining];
          nextTabs.splice(insertIndex, 0, sourceTab);
          return nextTabs;
        };

        if (sourcePane === 'pane1') {
          setPane1Tabs(updateTabs);
          setPane1ActiveId(sourceTabId);
        } else {
          setPane2Tabs(updateTabs);
          setPane2ActiveId(sourceTabId);
        }
        return;
      }

      // 2. 다른 Pane 간 이동 및 위치 삽입 (Cross-pane transfer with position)
      if (sourcePane === 'pane1') {
        const movedTab = pane1Tabs.find((t) => t.id === sourceTabId);
        if (!movedTab) return;

        setPane1Tabs((prev) => {
          const next = prev.filter((t) => t.id !== sourceTabId);
          if (sourceTabId === pane1ActiveId && next.length > 0) {
            setPane1ActiveId(next[next.length - 1].id);
          }
          return next;
        });

        setPane2Tabs((prev) => {
          const remaining = prev.filter((t) => t.id !== sourceTabId);
          if (!targetTabId) {
            return [...remaining, movedTab];
          }
          const targetIndex = remaining.findIndex((t) => t.id === targetTabId);
          if (targetIndex === -1) {
            return [...remaining, movedTab];
          }
          const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
          const next = [...remaining];
          next.splice(insertIndex, 0, movedTab);
          return next;
        });

        setPane2ActiveId(sourceTabId);
        setIsSplitEditor(true);
      } else {
        const movedTab = pane2Tabs.find((t) => t.id === sourceTabId);
        if (!movedTab) return;

        setPane2Tabs((prev) => {
          const next = prev.filter((t) => t.id !== sourceTabId);
          if (sourceTabId === pane2ActiveId && next.length > 0) {
            setPane2ActiveId(next[next.length - 1].id);
          }
          return next;
        });

        setPane1Tabs((prev) => {
          const remaining = prev.filter((t) => t.id !== sourceTabId);
          if (!targetTabId) {
            return [...remaining, movedTab];
          }
          const targetIndex = remaining.findIndex((t) => t.id === targetTabId);
          if (targetIndex === -1) {
            return [...remaining, movedTab];
          }
          const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
          const next = [...remaining];
          next.splice(insertIndex, 0, movedTab);
          return next;
        });

        setPane1ActiveId(sourceTabId);
      }
    },
    [pane1Tabs, pane2Tabs, pane1ActiveId, pane2ActiveId]
  );

  // 백엔드 스캐폴드 아카이브 상세 데이터가 로드되면 탭 및 파일 트리에 실시간 반영
  const isInitialPopulatedRef = useRef(false);

  useEffect(() => {
    if (!detail) return;

    // 총 페이지 수 계산 (기본 2페이지)
    const totalPages = detail.totalPages || (detail.pages ? detail.pages.length : 2);
    const pageNodes: FileTreeNode[] = [];

    // 페이지별 단독 캔버스 노드 생성
    for (let p = 1; p <= totalPages; p++) {
      pageNodes.push({
        id: `tab-wireframe-p${p}`,
        name: `page-${p}.canvas`,
        path: `wireframe/page-${p}`,
        isFolder: false,
        type: 'wireframe',
        language: 'canvas',
        scaffoldId: detail.scaffoldId,
        pageNumber: p,
      });
    }

    // 1. 파일 트리에 실제 와이어프레임 아카이브 노드 주입
    const archiveNode: FileTreeNode = {
      id: `archive-${detail.scaffoldId}`,
      name: `${detail.title || '와이어프레임'} [${detail.scaffoldId.slice(-8)}]`,
      path: 'wireframe',
      isFolder: true,
      isOpen: true,
      children: [
        {
          id: 'tab-wireframe-canvas',
          name: 'wireframe (전체).canvas',
          path: 'wireframe/canvas',
          isFolder: false,
          type: 'wireframe',
          language: 'canvas',
          scaffoldId: detail.scaffoldId,
        },
        ...pageNodes,
        {
          id: 'tab-wireframe-html',
          name: 'render.html',
          path: 'wireframe/render.html',
          isFolder: false,
          type: 'code',
          language: 'html',
          scaffoldId: detail.scaffoldId,
          content: liveHtml || detail.htmlContent || '',
        },
        {
          id: 'tab-wireframe-md',
          name: 'content.md',
          path: 'wireframe/content.md',
          isFolder: false,
          type: 'code',
          language: 'markdown',
          scaffoldId: detail.scaffoldId,
          content: liveMarkdown || detail.markdownContent || '',
        },
        {
          id: 'tab-wireframe-prompt-spec',
          name: 'prompt_spec.md',
          path: 'wireframe/prompt_spec.md',
          isFolder: false,
          type: 'code',
          language: 'markdown',
          scaffoldId: detail.scaffoldId,
          content: detail.promptSpecMd || '# 와이어프레임 엔진 규격\n',
        },
        {
          id: 'tab-wireframe-slots',
          name: 'slots.json',
          path: 'wireframe/slots.json',
          isFolder: false,
          type: 'code',
          language: 'json',
          scaffoldId: detail.scaffoldId,
          content: JSON.stringify(detail.slots || [], null, 2),
        },
      ],
    };

    setFileTree([archiveNode, ...initialFileTree]);

    // 2. 초기 1회 로드 시: 기본 단일 에디터 뷰 (좌우 분할 해제), 필요시 사용자가 분할
    if (!isInitialPopulatedRef.current) {
      setPane1Tabs([
        {
          id: 'tab-wireframe-p1',
          name: 'Page 1.canvas',
          path: 'wireframe/page-1',
          language: 'canvas',
          type: 'wireframe',
          scaffoldId: detail.scaffoldId,
          pageNumber: 1,
          isModified: false,
          content: '',
        },
        {
          id: 'tab-wireframe-p2',
          name: 'Page 2.canvas',
          path: 'wireframe/page-2',
          language: 'canvas',
          type: 'wireframe',
          scaffoldId: detail.scaffoldId,
          pageNumber: 2,
          isModified: false,
          content: '',
        },
        {
          id: 'tab-wireframe-canvas',
          name: 'wireframe (전체).canvas',
          path: 'wireframe/canvas',
          language: 'canvas',
          type: 'wireframe',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: '',
        },
        {
          id: 'tab-wireframe-html',
          name: 'render.html',
          path: 'wireframe/render.html',
          language: 'html',
          type: 'code',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: liveHtml || detail.htmlContent || '',
        },
        {
          id: 'tab-wireframe-md',
          name: 'content.md',
          path: 'wireframe/content.md',
          language: 'markdown',
          type: 'code',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: liveMarkdown || detail.markdownContent || '',
        },
      ]);
      setPane1ActiveId('tab-wireframe-p1');

      setPane2Tabs([
        {
          id: 'tab-artifact-v1',
          name: '📦 Artifact: 회의록 데이터 초안 (v1)',
          path: 'artifact/stage-v1',
          language: 'diff',
          type: 'artifact',
          scaffoldId: detail.scaffoldId,
          isModified: true,
          content: '',
        },
        {
          id: 'tab-wireframe-p2',
          name: 'Page 2.canvas',
          path: 'wireframe/page-2',
          language: 'canvas',
          type: 'wireframe',
          scaffoldId: detail.scaffoldId,
          pageNumber: 2,
          isModified: false,
          content: '',
        },
        {
          id: 'tab-wireframe-md',
          name: 'content.md',
          path: 'wireframe/content.md',
          language: 'markdown',
          type: 'code',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: liveMarkdown || detail.markdownContent || '',
        },
        {
          id: 'tab-wireframe-slots',
          name: 'slots.json',
          path: 'wireframe/slots.json',
          language: 'json',
          type: 'code',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: JSON.stringify(detail.slots || [], null, 2),
        },
      ]);
      setPane2ActiveId('tab-wireframe-p2');
      setIsSplitEditor(false); // 새로고침 시 기본적으로 좌우 분할 해제 (단일 에디터 뷰)
      isInitialPopulatedRef.current = true;
    } else {
      // 이후 동기화 시: render.html / content.md 내용 업데이트
      setPane1Tabs((prev) =>
        prev.map((t) => {
          if (t.id === 'tab-wireframe-html' && !t.isModified) {
            return {
              ...t,
              content: liveHtml || detail.htmlContent || '',
              scaffoldId: detail.scaffoldId,
            };
          }
          return t;
        })
      );

      setPane2Tabs((prev) =>
        prev.map((t) => {
          if (t.id === 'tab-wireframe-md' && !t.isModified) {
            return {
              ...t,
              content: liveMarkdown || detail.markdownContent || '',
              scaffoldId: detail.scaffoldId,
            };
          }
          if (t.id === 'tab-wireframe-slots') {
            return {
              ...t,
              content: JSON.stringify(detail.slots || [], null, 2),
              scaffoldId: detail.scaffoldId,
            };
          }
          return t;
        })
      );
    }
  }, [detail, liveHtml, liveMarkdown]);

  // 파일 클릭 시 열기
  const handleOpenFile = useCallback((node: FileTreeNode, targetPane: 'pane1' | 'pane2' = 'pane1') => {
    if (node.isFolder) {
      handleToggleFolder(node.id);
      return;
    }

    const isWireframe = node.type === 'wireframe' || node.name.endsWith('.canvas');

    const newTab: EditorTabItem = {
      id: node.id,
      name: node.name,
      path: node.path,
      content: node.content || (isWireframe ? '' : `// ${node.name}\n`),
      language: node.language || (isWireframe ? 'canvas' : 'typescript'),
      type: isWireframe ? 'wireframe' : (node.type || 'code'),
      scaffoldId: node.scaffoldId || scaffoldId,
      pageNumber: node.pageNumber,
      isModified: node.gitStatus === 'M',
    };

    if (targetPane === 'pane1') {
      setPane1Tabs((prev) => {
        const exists = prev.find((t) => t.id === node.id);
        if (exists) return prev;
        return [...prev, newTab];
      });
      setPane1ActiveId(node.id);
    } else {
      setPane2Tabs((prev) => {
        const exists = prev.find((t) => t.id === node.id);
        if (exists) return prev;
        return [...prev, newTab];
      });
      setPane2ActiveId(node.id);
      setIsSplitEditor(true);
    }
  }, [handleToggleFolder, scaffoldId]);

  // 단독 페이지 탭 열기 (Open solo page tab)
  const handleOpenPageTab = useCallback((pageNumber: number, targetPane: 'pane1' | 'pane2' = 'pane1') => {
    const pageTabId = `tab-wireframe-p${pageNumber}`;
    const exists1 = pane1Tabs.find((t) => t.id === pageTabId);
    if (exists1) {
      setPane1ActiveId(pageTabId);
      return;
    }
    const newTab: EditorTabItem = {
      id: pageTabId,
      name: `Page ${pageNumber}.canvas`,
      path: `wireframe/page-${pageNumber}`,
      language: 'canvas',
      type: 'wireframe',
      scaffoldId,
      pageNumber,
      content: '',
    };

    if (targetPane === 'pane1') {
      setPane1Tabs((prev) => [...prev, newTab]);
      setPane1ActiveId(pageTabId);
    } else {
      setPane2Tabs((prev) => [...prev, newTab]);
      setPane2ActiveId(pageTabId);
      setIsSplitEditor(true);
    }
  }, [scaffoldId, pane1Tabs]);

  // 전체 스크리브닝스(조합 뷰) 열기
  const handleOpenScrivenings = useCallback(() => {
    const canvasTabId = 'tab-wireframe-canvas';
    const exists = pane1Tabs.find((t) => t.id === canvasTabId);
    if (exists) {
      setPane1ActiveId(canvasTabId);
      return;
    }
    const canvasTab: EditorTabItem = {
      id: canvasTabId,
      name: 'wireframe (전체).canvas',
      path: 'wireframe/canvas',
      language: 'canvas',
      type: 'wireframe',
      scaffoldId,
      content: '',
    };
    setPane1Tabs((prev) => [canvasTab, ...prev]);
    setPane1ActiveId(canvasTabId);
  }, [scaffoldId, pane1Tabs]);

  // [컨셉 B] 멀티 Pane 에디터의 전용 탭: tab-artifact-stage (Cursor Diff 스타일)
  const handleOpenArtifactStageTab = useCallback(
    (version = 1, targetPane: 'pane1' | 'pane2' = 'pane2') => {
      const artifactTabId = `tab-artifact-v${version}`;
      const newTab: EditorTabItem = {
        id: artifactTabId,
        name: `📦 Artifact: 회의록 데이터 초안 (v${version})`,
        path: `artifact/stage-v${version}`,
        language: 'diff',
        type: 'artifact',
        scaffoldId,
        content: '',
        isModified: true,
      };

      if (targetPane === 'pane2') {
        setPane2Tabs((prev) => {
          const exists = prev.find((t) => t.id === artifactTabId);
          if (exists) return prev;
          return [...prev, newTab];
        });
        setPane2ActiveId(artifactTabId);
        setIsSplitEditor(true);
      } else {
        setPane1Tabs((prev) => {
          const exists = prev.find((t) => t.id === artifactTabId);
          if (exists) return prev;
          return [...prev, newTab];
        });
        setPane1ActiveId(artifactTabId);
      }
    },
    [scaffoldId]
  );

  // 리소스 매니저 아이템을 에디터 탭으로 열기
  const handleOpenResource = useCallback((resource: ResourceItem, targetPane: 'pane1' | 'pane2' = 'pane2') => {
    const tabId = `tab-res-${resource.id}`;
    const newTab: EditorTabItem = {
      id: tabId,
      name: resource.name,
      path: resource.path,
      content: resource.content || `// ${resource.name}\n// Pipeline: ${resource.pipelineSource}\n// Format: ${resource.format}\n`,
      language: resource.format === 'json' ? 'json' : resource.format === 'md' ? 'markdown' : resource.format === 'html' ? 'html' : 'typescript',
      type: 'code',
      scaffoldId,
      isModified: false,
    };

    if (targetPane === 'pane1') {
      setPane1Tabs((prev) => {
        const exists = prev.find((t) => t.id === tabId);
        if (exists) return prev;
        return [...prev, newTab];
      });
      setPane1ActiveId(tabId);
    } else {
      setPane2Tabs((prev) => {
        const exists = prev.find((t) => t.id === tabId);
        if (exists) return prev;
        return [...prev, newTab];
      });
      setPane2ActiveId(tabId);
      setIsSplitEditor(true);
    }
  }, [scaffoldId]);

  // 드래그 앤 드롭 아이템 드롭 처리기
  const handleDropItem = useCallback((payload: DragPayload, targetPane: 'pane1' | 'pane2') => {
    if (payload.type === 'tab') {
      handleReorderTab(payload.tabId, null, payload.sourcePane, targetPane, 'after');
    } else if (payload.type === 'file') {
      const fileNode = findFileNodeById(fileTree, payload.fileId);
      if (fileNode) {
        handleOpenFile(fileNode, targetPane);
      }
    } else if (payload.type === 'resource') {
      const res = resources.find((r: ResourceItem) => r.id === payload.resourceId);
      if (res) {
        handleOpenResource(res, targetPane);
      }
    }
  }, [fileTree, resources, handleReorderTab, handleOpenFile, handleOpenResource]);

  // 특정 페이지(pageNumber)에서 HTML 편집 시 전체 문서(SSOT)에 병합 반영
  const handlePageWireframeChangeHtml = useCallback(
    (pageNumber: number, pageHtml: string) => {
      const mergedHtml = updatePageInFullHtml(liveHtml, pageNumber, pageHtml);
      setLiveHtml(mergedHtml);
      setPane1Tabs((prev) =>
        prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: mergedHtml } : t))
      );
      setPane2Tabs((prev) =>
        prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: mergedHtml } : t))
      );
    },
    [liveHtml, setLiveHtml]
  );

  // 캔버스 에디터에서 전체 HTML 변경 시 핸들러
  const handleWireframeChangeHtml = useCallback((nextHtml: string) => {
    setLiveHtml(nextHtml);
    // 열려있는 render.html 탭에도 동기화
    setPane1Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
    );
    setPane2Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
    );
  }, [setLiveHtml]);

  // 캔버스 에디터에서 Markdown 변경 시 핸들러
  const handleWireframeChangeMarkdown = useCallback((nextMd: string) => {
    setLiveMarkdown(nextMd);
    // 열려있는 content.md 탭에도 동기화
    setPane1Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-md' ? { ...t, content: nextMd } : t))
    );
    setPane2Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-md' ? { ...t, content: nextMd } : t))
    );
  }, [setLiveMarkdown]);

  // 코드 텍스트 에디터에서 수정 시 핸들러
  const handleContentChange = useCallback((newContent: string, pane: 'pane1' | 'pane2') => {
    const activeId = pane === 'pane1' ? pane1ActiveId : pane2ActiveId;

    if (pane === 'pane1' && pane1ActiveId) {
      setPane1Tabs((prev) =>
        prev.map((t) => (t.id === pane1ActiveId ? { ...t, content: newContent, isModified: true } : t))
      );
    } else if (pane === 'pane2' && pane2ActiveId) {
      setPane2Tabs((prev) =>
        prev.map((t) => (t.id === pane2ActiveId ? { ...t, content: newContent, isModified: true } : t))
      );
    }

    // 만약 render.html 또는 content.md 탭이 수정되었다면 실제 데이터에도 반영
    if (activeId === 'tab-wireframe-html') {
      setLiveHtml(newContent);
    } else if (activeId === 'tab-wireframe-md') {
      setLiveMarkdown(newContent);
    }
  }, [pane1ActiveId, pane2ActiveId, setLiveHtml, setLiveMarkdown]);

  // ---------------- 리사이저 드래그 핸들러들 ---------------- //
  // A. 좌측 사이드바 리사이징 (너비)
  const handleMouseDownPrimaryResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startWidth = primarySidebarWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const newWidth = Math.max(160, Math.min(500, startWidth + delta));
      setPrimarySidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [primarySidebarWidth]);

  // B. 우측 AI 패널 리사이징 (너비)
  const handleMouseDownSecondaryResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startWidth = secondarySidebarWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const newWidth = Math.max(240, Math.min(650, startWidth + delta));
      setSecondarySidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [secondarySidebarWidth]);

  // B-2. 리소스 매니저 패널 리사이징 (너비)
  const handleMouseDownResourceResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startWidth = resourceManagerWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const newWidth = Math.max(200, Math.min(550, startWidth + delta));
      setResourceManagerWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [resourceManagerWidth]);

  // B-3. 헵타베이스 스타일 리소스 모달 리사이징 (너비)
  const handleMouseDownResourceModalResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startWidth = resourceModalWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const newWidth = Math.max(320, Math.min(800, startWidth + delta));
      setResourceModalWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [resourceModalWidth]);

  // B-4. 좌측 슬라이드 레퍼런스 패널 리사이징 (너비)
  const handleMouseDownLeftReferenceResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startWidth = leftReferenceWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const newWidth = Math.max(340, Math.min(850, startWidth + delta));
      setLeftReferenceWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [leftReferenceWidth]);

  // C. 하단 패널 리사이징 (높이)
  const handleMouseDownBottomResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      const newHeight = Math.max(100, Math.min(550, startHeight + delta));
      setBottomPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [bottomPanelHeight]);

  // D. 중앙 스플릿 에디터 리사이징 (좌우 비율 %)
  const handleMouseDownSplitResizer = useCallback((containerWidth: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startRatio = splitRatio;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const deltaRatio = (delta / containerWidth) * 100;
      const newRatio = Math.max(20, Math.min(80, startRatio + deltaRatio));
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [splitRatio]);

  // Activity Bar 클릭 핸들러
  const handleSelectActivityTab = useCallback((tab: ActivityBarTab) => {
    if (activeActivityTab === tab) {
      setShowPrimarySidebar((prev) => !prev);
    } else {
      setActiveActivityTab(tab);
      setShowPrimarySidebar(true);
    }
  }, [activeActivityTab]);

  // 터미널 명령 제출
  const handleTerminalSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!terminalCommandInput.trim()) return;

    const cmd = terminalCommandInput.trim();
    setTerminalSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeTerminalId) return sess;
        let response = '';
        if (cmd === 'clear') return { ...sess, history: [] };
        if (cmd === 'pnpm lint') response = 'Found 0 errors. Finished in 0.8s on 176 files.';
        else if (cmd === 'pnpm typecheck') response = '> tsc -b (Success, 0 errors)';
        else response = `Command executed: ${cmd}`;
        return {
          ...sess,
          history: [...sess.history, `PS C:\\AI_Projects\\WebNovelAssistant\\VibePatchNote> ${cmd}`, response],
        };
      })
    );
    setTerminalCommandInput('');
  }, [activeTerminalId, terminalCommandInput]);

  // 터미널 세션 추가
  const handleAddTerminalSession = useCallback(() => {
    const newId = `bash-${Date.now()}`;
    setTerminalSessions((prev) => [
      ...prev,
      {
        id: newId,
        name: `bash ${prev.length + 1}`,
        history: ['Welcome to Antigravity Integrated Bash Console'],
      },
    ]);
    setActiveTerminalId(newId);
  }, []);

  // AI 프롬프트 전송
  const handleSendPrompt = useCallback(() => {
    if (!promptInput.trim()) return;

    const userPrompt = promptInput.trim();
    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      content: userPrompt,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setIsAiStreaming(true);

    setTimeout(() => {
      const agentReply: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        content: `"${userPrompt}" 요청에 따른 에디터 탭 및 레이아웃 상태를 동기화했습니다.`,
      };
      setChatMessages((prev) => [...prev, agentReply]);
      setIsAiStreaming(false);
    }, 1000);
  }, [promptInput]);

  return {
    // 레이아웃 토글 & 너비/높이
    showPrimarySidebar,
    setShowPrimarySidebar,
    showSecondarySidebar,
    setShowSecondarySidebar,
    showBottomPanel,
    setShowBottomPanel,
    showResourceManager,
    setShowResourceManager,
    primarySidebarWidth,
    secondarySidebarWidth,
    resourceManagerWidth,
    bottomPanelHeight,
    splitRatio,
    isDraggingAnyResizer,

    // 리사이저 마우스 핸들러
    handleMouseDownPrimaryResizer,
    handleMouseDownSecondaryResizer,
    handleMouseDownResourceResizer,
    handleMouseDownBottomResizer,
    handleMouseDownSplitResizer,

    // 리소스 매니저 (다중 디렉토리 묶음 & 통합 리소스)
    bundles,
    setBundles,
    resources,
    resourceViewMode,
    setResourceViewMode,
    resourceSearchQuery,
    setResourceSearchQuery,
    linkedFolderName,
    setLinkedFolderName,
    handleAddDirectoryBundle,
    handleRemoveDirectoryBundle,
    handleToggleBundleCollapse,
    handleAddResources,
    handleDisconnectFolder,
    handleOpenResource,

    // 헵타베이스 스타일 우측 리소스 모달
    resourceModalResource,
    resourceModalProvenance,
    isResourceModalOpen,
    resourceModalWidth,
    handleOpenResourceModal,
    handleCloseResourceModal,
    handleMouseDownResourceModalResizer,

    // 좌측 Reasoning 모달 (Prompt + 바인더 아웃라인 + 레시피 규격)
    isReasoningModalOpen,
    reasoningFocusedSlotId,
    handleOpenReasoningModal,
    handleCloseReasoningModal,

    // 좌측 레퍼런스 원본 패널 & 플로팅 레퍼런스 창
    isLeftReferenceOpen,
    leftReferenceWidth,
    isFloatingReferenceOpen,
    referenceDocuments,
    activeReferenceDoc,
    handleToggleLeftReference,
    handlePopoutToFloating,
    handleDockFloatingToPanel,
    handleCloseReference,
    handleSelectReferenceDoc,
    handleMouseDownLeftReferenceResizer,

    // 탭
    activeActivityTab,
    handleSelectActivityTab,
    activeBottomTab,
    setActiveBottomTab,
    activeSpine,
    setActiveSpine,

    // 파일 트리
    fileTree,
    handleToggleFolder,
    handleOpenFile,
    handleOpenPageTab,
    handleOpenScrivenings,
    handleOpenArtifactStageTab,

    // 멀티 Pane 에디터
    isSplitEditor,
    setIsSplitEditor,
    pane1Tabs,
    pane1ActiveId,
    setPane1ActiveId,
    pane1ActiveTab,
    pane2Tabs,
    pane2ActiveId,
    setPane2ActiveId,
    pane2ActiveTab,
    handleCloseTab,
    handleMoveTab,
    handleReorderTab,
    handleDropItem,
    handleContentChange,
    cursorPosition,
    setCursorPosition,

    // 터미널
    terminalSessions,
    activeTerminalId,
    setActiveTerminalId,
    terminalCommandInput,
    setTerminalCommandInput,
    handleTerminalSubmit,
    handleAddTerminalSession,

    // AI
    chatMessages,
    promptInput,
    setPromptInput,
    selectedModel,
    setSelectedModel,
    isAiStreaming,
    handleSendPrompt,

    // 실제 백엔드 스캐폴드/와이어프레임 데이터 및 핸들러
    scaffoldId,
    detail,
    isLoadingScaffold,
    scaffoldError,
    syncState,
    liveHtml,
    liveMarkdown,
    handleWireframeChangeHtml,
    handlePageWireframeChangeHtml,
    handleWireframeChangeMarkdown,
    saveImmediately,
    reloadScaffold,

    // 슬롯 소켓 바인딩 (스캐폴드 슬롯 ↔ 백데이터 리소스 매핑)
    slotBindings,
    handleBindSlot,
    handleUnbindSlot,
    handleApplySuggested,
    handleApplyAllSuggestions,
    handleResetAllSlots,
    handleOpenSlotProvenance,
  };
}
