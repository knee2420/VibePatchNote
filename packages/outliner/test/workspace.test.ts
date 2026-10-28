/**
 * @file workspace.test.ts
 * @description 워크스페이스 안의 프로젝트 추가·삭제·제목 변경 단위 테스트
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addProjectToWorkspace,
  createEmptyWorkspace,
  removeProjectFromWorkspace,
  renameProjectInWorkspace,
} from '../src/index.js';

test('프로젝트를 추가해도 다른 프로젝트는 그대로다', () => {
  const ws = createEmptyWorkspace('테스트');
  const firstId = ws.activeProjectId;

  const { updatedWorkspace, newProject } = addProjectToWorkspace(ws, '두 번째');

  assert.deepEqual(Object.keys(updatedWorkspace.projects).sort(), [firstId, newProject.id].sort());
  assert.equal(updatedWorkspace.projects[firstId], ws.projects[firstId]);
  assert.equal(updatedWorkspace.activeProjectId, firstId);
  assert.equal(newProject.title, '두 번째');
});

test('보고 있던 프로젝트를 지우면 남은 프로젝트로 넘어간다', () => {
  const base = createEmptyWorkspace('테스트');
  const firstId = base.activeProjectId;
  const { updatedWorkspace: ws, newProject } = addProjectToWorkspace(base, '두 번째');

  const removed = removeProjectFromWorkspace(ws, firstId);

  assert.equal(removed.success, true);
  assert.deepEqual(Object.keys(removed.updatedWorkspace.projects), [newProject.id]);
  assert.equal(removed.updatedWorkspace.activeProjectId, newProject.id);
});

test('마지막 남은 프로젝트와 없는 프로젝트는 지우지 않는다', () => {
  const ws = createEmptyWorkspace('테스트');

  assert.equal(removeProjectFromWorkspace(ws, ws.activeProjectId).success, false);
  assert.equal(removeProjectFromWorkspace(ws, 'nope').success, false);
});

test('제목을 비워서 바꾸면 기본 제목이 된다', () => {
  const ws = createEmptyWorkspace('테스트');
  const id = ws.activeProjectId;

  assert.equal(renameProjectInWorkspace(ws, id, '  새 이름  ').projects[id].title, '새 이름');
  assert.equal(renameProjectInWorkspace(ws, id, '   ').projects[id].title, '제목 없는 스캐폴드');
});
