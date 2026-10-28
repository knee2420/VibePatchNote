/**
 * @file vaultSync.test.ts
 * @description 보관함 읽기와 자동 저장 계획 단위 테스트
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { addProjectToWorkspace, createEmptyWorkspace } from '../src/core';
import { EMPTY_VAULT_DISK_STATE, deserializeVault, planVaultSync } from '../src/index.js';
import { readSampleVault } from './fixtures.js';

test('빈 폴더에 처음 맞출 때: 프로젝트 파일과 메타 파일만 쓴다', () => {
  const ws = createEmptyWorkspace('동기화 테스트');
  const plan = planVaultSync(EMPTY_VAULT_DISK_STATE, ws);

  assert.deepEqual(
    plan.writes.map((w) => w.path),
    ['메인 기획.json', '.outliner/workspace.json']
  );
  assert.deepEqual(plan.deletes, []);
});

test('다시 맞출 때: 달라진 프로젝트의 파일만 쓴다', () => {
  const ws = createEmptyWorkspace('동기화 테스트');
  const first = planVaultSync(EMPTY_VAULT_DISK_STATE, ws);

  const { updatedWorkspace } = addProjectToWorkspace(ws, '두 번째');
  const second = planVaultSync(first.disk, updatedWorkspace);

  assert.deepEqual(
    second.writes.map((w) => w.path),
    ['두 번째.json']
  );
});

test('견본 보관함: 예전 스냅샷 폴더와 통파일이 있어도 프로젝트 파일만 읽는다', () => {
  const result = deserializeVault(readSampleVault(), { fallbackTitle: 'sample' });
  assert.ok(result.success);
  assert.ok(result.workspace);

  const titles = Object.values(result.workspace.projects)
    .map((p) => p.title)
    .sort();
  assert.deepEqual(titles, ['메인 기획', '여기는 급을 올립니다']);
  assert.equal('snapshots' in result.workspace, false);
  assert.deepEqual(result.skipped, [
    { path: '내 생각 워크스페이스.json', reason: 'not-a-project' },
  ]);
});
