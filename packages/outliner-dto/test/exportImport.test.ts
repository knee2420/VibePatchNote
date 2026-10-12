/**
 * @file exportImport.test.ts
 * @description 내보낼 파일 만들기와 가져오기 읽기 단위 테스트 (견본 보관함 기준)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import type { Workspace } from '@vibe/outliner-core';
import {
  buildExportFile,
  deserializeVault,
  parseProjectFile,
  readImport,
  serializeProjectFile,
} from '../src/index.js';
import { readSampleVault } from './fixtures.js';

const MAIN_ID = 'XHdQQ8UGiY3a'; // 메인 기획
const ZOOM_NODE_ID = 'VyX1CKUyYuj9'; // "메인 기획 개요"

function sampleWorkspace(): Workspace {
  const result = deserializeVault(readSampleVault(), { fallbackTitle: 'sample' });
  assert.ok(result.success && result.workspace);
  return result.workspace;
}

test('프로젝트 파일: 쓰고 다시 읽으면 같은 프로젝트다', () => {
  const ws = sampleWorkspace();
  const parsed = parseProjectFile(serializeProjectFile(ws.projects[MAIN_ID]));

  assert.ok(parsed.success);
  assert.deepEqual(parsed.project, ws.projects[MAIN_ID]);
});

test('프로젝트 파일: 깨진 글자·다른 규격 번호·프로젝트가 아닌 값을 구분한다', () => {
  assert.deepEqual(parseProjectFile('{'), { success: false, reason: 'parse-error' });
  assert.deepEqual(parseProjectFile('{"hello":1}'), { success: false, reason: 'not-a-project' });
  assert.deepEqual(parseProjectFile('{"version":"9.0.0","id":"a","title":"t","rootNodes":[]}'), {
    success: false,
    reason: 'unsupported-version',
    version: '9.0.0',
  });
});

test('프로젝트 파일: 예전 파일의 모르는 칸(연결 정보 등)은 버리지 않는다', () => {
  const ws = sampleWorkspace();
  const text = serializeProjectFile(ws.projects[MAIN_ID]);

  assert.equal(text.includes('targetProjectId'), true);
});

test('내보내기: 프로젝트 전체는 그 프로젝트 그대로 파일 하나가 된다', () => {
  const file = buildExportFile(sampleWorkspace(), {
    projectId: MAIN_ID,
    scope: { kind: 'project' },
  });
  assert.ok(file);

  assert.equal(file.fileName, '메인 기획.json');
  assert.equal(file.nodeCount, 12);
  const parsed = parseProjectFile(file.text);
  assert.ok(parsed.success);
  assert.equal(parsed.project.id, MAIN_ID);
});

test('내보내기: 줌인한 범위는 그 불릿을 제목으로 한 새 프로젝트가 된다', () => {
  const ws = sampleWorkspace();
  const file = buildExportFile(ws, {
    projectId: MAIN_ID,
    scope: { kind: 'subtree', nodeId: ZOOM_NODE_ID },
  });
  assert.ok(file);

  assert.equal(file.fileName, '메인 기획 개요.json');
  assert.equal(file.nodeCount, 9);

  const parsed = parseProjectFile(file.text);
  assert.ok(parsed.success);
  assert.notEqual(parsed.project.id, MAIN_ID, '떠낸 프로젝트는 새 id 를 받는다');
  assert.equal(parsed.project.title, '메인 기획 개요');
  // 원본은 건드리지 않는다
  assert.equal(ws.projects[MAIN_ID].rootNodes.length, 3);
});

test('내보내기: 고른 불릿은 맨 위 것만 뿌리가 되고 첫 불릿이 제목이 된다', () => {
  const file = buildExportFile(sampleWorkspace(), {
    projectId: MAIN_ID,
    scope: { kind: 'nodes', nodeIds: ['S0znniZITFQB', '8SFgAyc2rVDO', 'qnumESfSiuwt'] },
  });
  assert.ok(file);
  assert.deepEqual([file.fileName, file.nodeCount], ['신규 추가합니다.json', 3]);
});

test('내보내기: 없는 프로젝트나 불릿이면 파일이 없다', () => {
  const ws = sampleWorkspace();
  assert.equal(buildExportFile(ws, { projectId: 'nope', scope: { kind: 'project' } }), null);
  assert.equal(
    buildExportFile(ws, { projectId: MAIN_ID, scope: { kind: 'subtree', nodeId: 'nope' } }),
    null
  );
});

test('가져오기: 견본 폴더를 통째로 읽으면 통파일의 프로젝트까지 새 워크스페이스에 담긴다', () => {
  const result = readImport(readSampleVault(), { title: '가져온 것' });
  assert.ok(result.workspace);

  // 제목이 같은 "메인 기획"이 둘이지만 id 가 달라 둘 다 들어온다.
  assert.deepEqual(
    result.projects.map((p) => [p.title, p.path]).sort(),
    [
      ['메인 기획', '내 생각 워크스페이스.json'],
      ['메인 기획', '메인 기획.json'],
      ['여기는 급을 올립니다', '여기는 급을 올립니다.json'],
    ]
  );
  // .crswap 과 .outliner 안의 파일은 가져오기 대상이 아니라서 "받지 않은 파일"에도 없다.
  assert.deepEqual(result.skipped, []);
  assert.equal(result.workspace.title, '가져온 것');
});

test('가져오기: 읽지 못한 파일은 이유와 함께 건너뛰고 나머지는 받는다', () => {
  const sample = readSampleVault();
  const result = readImport(
    {
      'a.json': sample['여기는 급을 올립니다.json'],
      'sub/b.json': sample['여기는 급을 올립니다.json'],
      'broken.json': '{',
      'other.json': '[1,2,3]',
      'future.json': '{"version":"9.0.0","id":"x","title":"t","rootNodes":[]}',
      'note.txt': 'hello',
    },
    { title: 't' }
  );

  assert.equal(result.projects.length, 1);
  assert.deepEqual(
    result.skipped.sort((a, b) => a.path.localeCompare(b.path)),
    [
      { path: 'broken.json', reason: 'parse-error' },
      { path: 'future.json', reason: 'unsupported-version', version: '9.0.0' },
      { path: 'other.json', reason: 'not-a-project' },
      { path: 'sub/b.json', reason: 'duplicate-id' },
    ]
  );
});

test('가져오기: 아무것도 읽지 못하면 워크스페이스가 없다', () => {
  const result = readImport({ 'x.json': '{' }, { title: 't' });
  assert.equal(result.workspace, null);
  assert.equal(result.skipped.length, 1);
});

test('내보낸 파일을 그대로 가져오면 새 워크스페이스의 프로젝트 하나가 된다', () => {
  const file = buildExportFile(sampleWorkspace(), {
    projectId: MAIN_ID,
    scope: { kind: 'project' },
  });
  assert.ok(file);

  const result = readImport({ [file.fileName]: file.text }, { title: '되읽기' });
  assert.ok(result.workspace);
  assert.deepEqual(Object.keys(result.workspace.projects), [MAIN_ID]);
});

test('프로젝트 파일: 불릿에 딸린 파일은 그대로 남고, 주소가 없는 파일은 받지 않는다', () => {
  const ws = sampleWorkspace();
  const project = structuredClone(ws.projects[MAIN_ID]);
  project.rootNodes[0].file = {
    target: '자료/설계.pdf',
    options: { page: 3 },
  };

  const parsed = parseProjectFile(serializeProjectFile(project));
  assert.ok(parsed.success);
  assert.deepEqual(parsed.project.rootNodes[0].file, project.rootNodes[0].file);

  const broken = JSON.parse(serializeProjectFile(project));
  broken.rootNodes[0].file = { options: { page: 3 } };
  assert.deepEqual(parseProjectFile(JSON.stringify(broken)), {
    success: false,
    reason: 'not-a-project',
  });
});
