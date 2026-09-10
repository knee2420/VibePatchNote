import type { Edge, Node } from '@xyflow/react';

/** 백엔드 `/api/v1/workspaces` 가 돌려주는 세션 표현. */
export interface WorkspaceSession {
  id: string;
  title: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSessionCreatePayload {
  title: string;
  description?: string;
}

export interface WorkspaceSessionUpdatePayload {
  /** API 는 부분 갱신을 지원한다. 그래프와 제목을 같은 요청에 묶지 않는다. */
  title?: string;
  description?: string;
  nodes?: Node[];
  edges?: Edge[];
}
