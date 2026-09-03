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
  title: string;
  nodes: Node[];
  edges: Edge[];
}
