import type { FileTreeNode, EditorTabItem } from './types';

export const initialFileTree: FileTreeNode[] = [
  {
    id: 'agents-folder',
    name: '.agents',
    path: '.agents',
    isFolder: true,
    isOpen: true,
    children: [
      {
        id: 'rules-folder',
        name: 'rules',
        path: '.agents/rules',
        isFolder: true,
        isOpen: false,
        children: [
          {
            id: 'rule-core',
            name: 'rule.md',
            path: '.agents/rules/00-core/rule.md',
            isFolder: false,
            language: 'markdown',
            content: '# 시스템 핵심 헌법\n\n1. 하위 레이어는 상위 레이어를 참조하지 않습니다.\n2. 도메인 중립 원칙을 유지합니다.',
          },
        ],
      },
      {
        id: 'skills-folder',
        name: 'skills',
        path: '.agents/skills',
        isFolder: true,
        isOpen: false,
        children: [
          {
            id: 'front-gen',
            name: 'SKILL.md',
            path: '.agents/skills/develop_50_front_generator/SKILL.md',
            isFolder: false,
            language: 'markdown',
            content: '---\nname: develop_50_front_generator\n---\n\n프론트엔드 체크리스트 기반 개발 스킬',
          },
        ],
      },
    ],
  },
  {
    id: 'apps-folder',
    name: 'apps',
    path: 'apps',
    isFolder: true,
    isOpen: true,
    children: [
      {
        id: 'api-folder',
        name: 'api',
        path: 'apps/api',
        isFolder: true,
        isOpen: false,
        children: [
          {
            id: 'api-main',
            name: 'main.py',
            path: 'apps/api/main.py',
            isFolder: false,
            language: 'python',
            content: 'from fastapi import FastAPI\n\napp = FastAPI(title="Vibe Agent API")',
          },
        ],
      },
      {
        id: 'web-folder',
        name: 'web',
        path: 'apps/web',
        isFolder: true,
        isOpen: true,
        children: [
          {
            id: 'src-folder',
            name: 'src',
            path: 'apps/web/src',
            isFolder: true,
            isOpen: true,
            children: [
              {
                id: 'pages-folder',
                name: 'pages',
                path: 'apps/web/src/pages',
                isFolder: true,
                isOpen: true,
                children: [
                  {
                    id: 'doc-edit-folder',
                    name: 'document-editor',
                    path: 'apps/web/src/pages/document-editor',
                    isFolder: true,
                    isOpen: false,
                    children: [
                      {
                        id: 'doc-edit-page',
                        name: 'DocumentEditorPage.tsx',
                        path: 'apps/web/src/pages/document-editor/ui/DocumentEditorPage.tsx',
                        isFolder: false,
                        language: 'typescript',
                        content: `import { useParams, useNavigate } from 'react-router-dom';
import { DocumentEditorWorkspace } from '@/widgets/document-editor-workspace';

export function DocumentEditorPage() {
  const { scaffoldId } = useParams<{ scaffoldId: string }>();
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen">
      <DocumentEditorWorkspace scaffoldId={scaffoldId || 'default'} />
    </div>
  );
}`,
                      },
                    ],
                  },
                  {
                    id: 'editor-lab-folder',
                    name: 'editor-lab',
                    path: 'apps/web/src/pages/editor-lab',
                    isFolder: true,
                    isOpen: true,
                    children: [
                      {
                        id: 'editor-lab-page',
                        name: 'EditorLabPage.tsx',
                        path: 'apps/web/src/pages/editor-lab/ui/EditorLabPage.tsx',
                        isFolder: false,
                        gitStatus: 'M',
                        language: 'typescript',
                        content: `import { useNavigate } from 'react-router-dom';
import { EditorLabWorkspace } from '@/widgets/editor-lab-workspace';

/**
 * EditorLabPage (FSD Page Layer)
 *
 * 본 프로젝트의 DocumentEditorPage 정본 구조를 계승하여,
 * 페이지 레이어에서는 라우팅 제어 및 최상위 위젯(EditorLabWorkspace)만을 호스팅합니다.
 */
export function EditorLabPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-slate-50 text-slate-900 overflow-hidden antialiased selection:bg-indigo-500 selection:text-white">
      <EditorLabWorkspace onBack={() => navigate('/')} />
    </div>
  );
}`,
                      },
                      {
                        id: 'editor-lab-index',
                        name: 'index.ts',
                        path: 'apps/web/src/pages/editor-lab/index.ts',
                        isFolder: false,
                        gitStatus: 'U',
                        language: 'typescript',
                        content: "export { EditorLabPage } from './ui/EditorLabPage';",
                      },
                    ],
                  },
                ],
              },
              {
                id: 'widgets-folder',
                name: 'widgets',
                path: 'apps/web/src/widgets',
                isFolder: true,
                isOpen: true,
                children: [
                  {
                    id: 'lab-ws-folder',
                    name: 'editor-lab-workspace',
                    path: 'apps/web/src/widgets/editor-lab-workspace',
                    isFolder: true,
                    isOpen: false,
                    gitStatus: 'U',
                    children: [
                      {
                        id: 'lab-ws-main',
                        name: 'EditorLabWorkspace.tsx',
                        path: 'apps/web/src/widgets/editor-lab-workspace/ui/EditorLabWorkspace.tsx',
                        isFolder: false,
                        gitStatus: 'U',
                        language: 'typescript',
                        content: "export function EditorLabWorkspace() { return <div>EditorLabWorkspace</div>; }",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'pkg-json',
            name: 'package.json',
            path: 'apps/web/package.json',
            isFolder: false,
            language: 'json',
            content: '{\n  "name": "@vibe/web",\n  "version": "0.0.0"\n}',
          },
        ],
      },
    ],
  },
  {
    id: 'agents-md',
    name: 'AGENTS.md',
    path: 'AGENTS.md',
    isFolder: false,
    language: 'markdown',
    content: '# AGENTS.md — 이 저장소에서 작업하는 모든 코딩 에이전트에게\n\nTurborepo 모노레포 FSD 아키텍처 규칙 정본.',
  },
];

export const initialOpenTabs: EditorTabItem[] = [
  {
    id: 'editor-lab-page',
    name: 'EditorLabPage.tsx',
    path: 'apps/web/src/pages/editor-lab/ui/EditorLabPage.tsx',
    language: 'typescript',
    isModified: true,
    content: `import { useNavigate } from 'react-router-dom';
import { EditorLabWorkspace } from '@/widgets/editor-lab-workspace';

/**
 * EditorLabPage (FSD Page Layer)
 *
 * 본 프로젝트의 DocumentEditorPage 정본 구조를 계승하여,
 * 페이지 레이어에서는 라우팅 제어 및 최상위 위젯(EditorLabWorkspace)만을 호스팅합니다.
 */
export function EditorLabPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-slate-50 text-slate-900 overflow-hidden antialiased selection:bg-indigo-500 selection:text-white">
      <EditorLabWorkspace onBack={() => navigate('/')} />
    </div>
  );
}`,
  },
  {
    id: 'editor-lab-index',
    name: 'index.ts',
    path: 'apps/web/src/pages/editor-lab/index.ts',
    language: 'typescript',
    isModified: false,
    content: "export { EditorLabPage } from './ui/EditorLabPage';",
  },
  {
    id: 'doc-edit-page',
    name: 'DocumentEditorPage.tsx',
    path: 'apps/web/src/pages/document-editor/ui/DocumentEditorPage.tsx',
    language: 'typescript',
    isModified: false,
    content: `import { useParams, useNavigate } from 'react-router-dom';
import { DocumentEditorWorkspace } from '@/widgets/document-editor-workspace';

export function DocumentEditorPage() {
  const { scaffoldId } = useParams<{ scaffoldId: string }>();
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen">
      <DocumentEditorWorkspace scaffoldId={scaffoldId || 'default'} />
    </div>
  );
}`,
  },
];
