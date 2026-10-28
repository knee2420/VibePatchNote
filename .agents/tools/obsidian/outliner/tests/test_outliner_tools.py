#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_outliner_tools.py
Obsidian Outliner 전용 4대 도구(seek, patch, lease, attachments) 종합 검증 테스트 스위트.
"""

import unittest
import os
import sys
import shutil
import json
import subprocess
import tempfile
import time

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TOOLS_DIR = os.path.dirname(CURRENT_DIR)
SEEK_SCRIPT = os.path.join(TOOLS_DIR, "01_seek_outline_tree.py")
PATCH_SCRIPT = os.path.join(TOOLS_DIR, "02_patch_outline_tree.py")
LEASE_SCRIPT = os.path.join(TOOLS_DIR, "03_lease_guard.py")
ATTACH_SCRIPT = os.path.join(TOOLS_DIR, "04_manage_attachments.py")

VALIDATOR_SCRIPT = os.path.normpath(
    os.path.join(TOOLS_DIR, "..", "outline_validator", "validate_outline.py")
)

ORIGINAL_OUTLINE_PATH = r"c:\AI_Projects\WebNovelAssistant\Tutorials\obsidian_tuning\outline-test\06_단축키_클립보드_실행취소_테스트.outline"


class TestOutlinerTools(unittest.TestCase):
    def setUp(self):
        # 각 테스트마다 격리된 임시 작업 디렉토리 생성
        self.test_dir = tempfile.mkdtemp(prefix="outliner_test_")
        self.sample_outline = os.path.join(self.test_dir, "test_target.outline")
        shutil.copy2(ORIGINAL_OUTLINE_PATH, self.sample_outline)

    def tearDown(self):
        # 테스트 임시 디렉토리 정리
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def run_cmd(self, cmd: list) -> tuple[int, str, str]:
        """subprocess 실행 헬퍼"""
        full_cmd = [sys.executable] + cmd
        proc = subprocess.run(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8"
        )
        return proc.returncode, proc.stdout, proc.stderr

    # =========================================================================
    # 1. 01_seek_outline_tree.py 테스트
    # =========================================================================
    def test_01_seek_basic(self):
        """기본 전체 트리 탐색 테스트"""
        code, out, err = self.run_cmd([SEEK_SCRIPT, self.sample_outline])
        self.assertEqual(code, 0, f"seek 실패: {err}")
        self.assertIn("06_단축키_클립보드_실행취소_테스트", out)
        self.assertIn("[test-copy-paste-root]", out)
        self.assertIn("[test-cut-root]", out)
        self.assertIn("[test-undo-redo-root]", out)

    def test_02_seek_depth_filter(self):
        """--depth 0 깊이 필터링 테스트: 루트 노드만 노출되어야 함"""
        code, out, err = self.run_cmd([SEEK_SCRIPT, self.sample_outline, "--depth", "0"])
        self.assertEqual(code, 0)
        self.assertIn("[test-copy-paste-root]", out)
        # 하위 자식 노드는 depth 0에 포함되지 않아야 함
        self.assertNotIn("[test-copy-child-1]", out)

    def test_03_seek_query_filter(self):
        """--query 검색 필터링 테스트"""
        code, out, err = self.run_cmd([SEEK_SCRIPT, self.sample_outline, "--query", "복사 대상 노드 B"])
        self.assertEqual(code, 0)
        self.assertIn("복사 대상 노드 B #todo", out)
        # 검색어와 관련 없는 노드는 제외되어야 함
        self.assertNotIn("잘라낼 대상 항목 1", out)

    def test_04_seek_upward(self):
        """--direction up 조상 역방향 족보 탐색 테스트"""
        code, out, err = self.run_cmd([
            SEEK_SCRIPT, self.sample_outline,
            "--node-id", "test-copy-child-1",
            "--direction", "up"
        ])
        self.assertEqual(code, 0)
        # 루트 -> 부모 -> 자식 순서로 족보가 출력되어야 함
        self.assertIn("[test-copy-paste-root]", out)
        self.assertIn("[test-copy-target-1]", out)
        self.assertIn("[test-copy-child-1]", out)

    def test_05_seek_json_format(self):
        """--format json 구조화된 출력 테스트"""
        code, out, err = self.run_cmd([SEEK_SCRIPT, self.sample_outline, "--format", "json"])
        self.assertEqual(code, 0)
        parsed = json.loads(out)
        self.assertIn("items", parsed)
        self.assertGreater(parsed["total"], 0)

    # =========================================================================
    # 2. 02_patch_outline_tree.py 테스트
    # =========================================================================
    def test_06_patch_replace(self):
        """노드 텍스트 및 메모 수정 테스트"""
        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--replace", "test-paste-destination:수정된 새로운 타깃 영역",
            "--note", "자동화 테스트 메모"
        ])
        self.assertEqual(code, 0, f"replace 실패: {err}")

        # 파일 검증
        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)

        def find_node(nodes, nid):
            for n in nodes:
                if n.get("id") == nid:
                    return n
                res = find_node(n.get("children", []), nid)
                if res:
                    return res
            return None

        node = find_node(doc["rootNodes"], "test-paste-destination")
        self.assertIsNotNone(node)
        self.assertEqual(node["text"], "수정된 새로운 타깃 영역")
        self.assertEqual(node.get("note"), "자동화 테스트 메모")

    def test_07_patch_insert_inside_and_after(self):
        """노드 자식 삽입(inside) 및 형제 삽입(after) 테스트"""
        # 1. inside 삽입
        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--insert", "test-workflowy-paste-root:새로운 파싱 하위 항목",
            "--position", "inside"
        ])
        self.assertEqual(code, 0, f"insert inside 실패: {err}")

        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)

        wf_node = doc["rootNodes"][3]
        self.assertEqual(len(wf_node["children"]), 1)
        new_child = wf_node["children"][0]
        self.assertEqual(new_child["text"], "새로운 파싱 하위 항목")
        self.assertEqual(len(new_child["id"]), 12)  # 난수 ID 자동 채번 확인

        # 2. after 삽입
        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--insert", f"{new_child['id']}:그 뒤에 추가된 형제 항목",
            "--position", "after"
        ])
        self.assertEqual(code, 0)

        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)
        wf_node = doc["rootNodes"][3]
        self.assertEqual(len(wf_node["children"]), 2)
        self.assertEqual(wf_node["children"][1]["text"], "그 뒤에 추가된 형제 항목")

    def test_08_patch_move_and_reparent(self):
        """⭐️ 서브트리 이동 (한 depth 밀어넣기 및 부모 변경) 테스트"""
        # test-cut-item-2 (하위에 test-cut-child-1 포함)를 test-paste-destination 밑으로 이동
        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--move", "test-cut-item-2:test-paste-destination"
        ])
        self.assertEqual(code, 0, f"move 실패: {err}")

        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)

        def find_parent_and_node(nodes, nid, parent=None):
            for n in nodes:
                if n.get("id") == nid:
                    return parent, n
                p, target = find_parent_and_node(n.get("children", []), nid, n)
                if target:
                    return p, target
            return None, None

        p, moved_node = find_parent_and_node(doc["rootNodes"], "test-cut-item-2")
        self.assertIsNotNone(moved_node)
        self.assertIsNotNone(p)
        self.assertEqual(p["id"], "test-paste-destination")  # 새 부모로 정상 이동
        # 하위 자식 노드가 유실되지 않고 함께 딸려왔는지 확인!
        self.assertEqual(len(moved_node["children"]), 1)
        self.assertEqual(moved_node["children"][0]["id"], "test-cut-child-1")

    def test_09_patch_prevent_circular_reference(self):
        """순환 참조 방지 가드: 부모를 자기 자식 밑으로 이동 시도 시 에러 차단 확인"""
        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--move", "test-copy-target-1:test-copy-child-1"
        ])
        self.assertNotEqual(code, 0)
        self.assertIn("순환 참조", err)

    def test_10_patch_delete(self):
        """노드 및 자손 재귀 삭제 테스트"""
        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--delete", "test-cut-item-2"
        ])
        self.assertEqual(code, 0)

        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)

        def exists(nodes, nid):
            for n in nodes:
                if n.get("id") == nid:
                    return True
                if exists(n.get("children", []), nid):
                    return True
            return False

        self.assertFalse(exists(doc["rootNodes"], "test-cut-item-2"))
        self.assertFalse(exists(doc["rootNodes"], "test-cut-child-1"))  # 자식도 삭제됨

    def test_11_patch_batch_transaction_and_rollback(self):
        """배치 트랜잭션 및 실패 시 자동 롤백(Rollback) 테스트"""
        with open(self.sample_outline, "r", encoding="utf-8") as f:
            original_content = f.read()

        # 정상 작업 + 마지막에 고의 에러 작업(존재하지 않는 노드 조작) 배치
        batch_payload = [
            {"op": "replace", "id": "test-undo-item-1", "text": "임시 변경본"},
            {"op": "delete", "id": "non-existent-id-99999"}  # 여기서 에러 발생
        ]

        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--batch", json.dumps(batch_payload)
        ])
        self.assertNotEqual(code, 0)
        self.assertIn("롤백 적용됨", err)

        # 롤백으로 인해 원본 내용이 그대로 보존되었는지 확인
        with open(self.sample_outline, "r", encoding="utf-8") as f:
            current_content = f.read()
        self.assertEqual(original_content, current_content)

    # =========================================================================
    # 3. 03_lease_guard.py 테스트
    # =========================================================================
    def test_12_lease_lifecycle(self):
        """동시성 락 수명주기 (inspect -> acquire -> conflict -> touch -> release)"""
        # 1. 초기 inspect: 락 없음
        code, out, err = self.run_cmd([LEASE_SCRIPT, self.sample_outline, "inspect"])
        self.assertEqual(code, 0)
        self.assertIn("활성 락 없음", out)

        # 2. acquire 획득
        code, out, err = self.run_cmd([LEASE_SCRIPT, self.sample_outline, "acquire", "--ttl", "10"])
        self.assertEqual(code, 0)
        self.assertIn("락 획득 성공", out)
        token = out.split("Token: ")[1].split(",")[0].strip()

        # 3. 중복 acquire 충돌 감지
        code, out, err = self.run_cmd([LEASE_SCRIPT, self.sample_outline, "acquire", "--ttl", "10"])
        self.assertNotEqual(code, 0)
        self.assertIn("CONFLICT", err)

        # 4. touch 연장
        code, out, err = self.run_cmd([LEASE_SCRIPT, self.sample_outline, "touch", "--token", token, "--ttl", "30"])
        self.assertEqual(code, 0)

        # 5. release 해제
        code, out, err = self.run_cmd([LEASE_SCRIPT, self.sample_outline, "release", "--token", token])
        self.assertEqual(code, 0)

        # 6. 해제 후 inspect: 락 없음 확인
        code, out, err = self.run_cmd([LEASE_SCRIPT, self.sample_outline, "inspect"])
        self.assertEqual(code, 0)
        self.assertIn("활성 락 없음", out)

    # =========================================================================
    # 4. 04_manage_attachments.py 테스트
    # =========================================================================
    def test_13_attachments_attach_and_pull(self):
        """첨부파일 attach 및 pull 테스트"""
        # 가상 테스트 이미지 파일 생성
        dummy_img = os.path.join(self.test_dir, "test_screenshot.png")
        with open(dummy_img, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...")

        # attach 실행
        code, out, err = self.run_cmd([
            ATTACH_SCRIPT, self.sample_outline, "attach",
            "--node-id", "test-undo-item-1",
            "--file", dummy_img
        ])
        self.assertEqual(code, 0, f"attach 실패: {err}")
        self.assertIn("첨부 완료", out)

        # pull 실행
        code, out, err = self.run_cmd([
            ATTACH_SCRIPT, self.sample_outline, "pull",
            "--node-id", "test-undo-item-1"
        ])
        self.assertEqual(code, 0, f"pull 실패: {err}")
        self.assertIn("FILE_PATH:", out)
        self.assertIn("test_screenshot.png", out)

        # detach 실행
        code, out, err = self.run_cmd([
            ATTACH_SCRIPT, self.sample_outline, "detach",
            "--node-id", "test-undo-item-1"
        ])
        self.assertEqual(code, 0)

    # =========================================================================
    # 5. 고난도 엣지 케이스 & 실전 시나리오 테스트 (Edge Cases & Advanced Scenarios)
    # =========================================================================
    def test_15_patch_move_to_root(self):
        """깊은 자식 노드를 최상위 루트 레벨로 승격(Outdent to root) 테스트"""
        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--move", "test-copy-child-1:root"
        ])
        self.assertEqual(code, 0, f"root 이동 실패: {err}")

        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)

        # rootNodes 배열 직속으로 이동되었는지 확인
        root_ids = [n["id"] for n in doc["rootNodes"]]
        self.assertIn("test-copy-child-1", root_ids)

    def test_16_patch_special_characters_and_emojis(self):
        """특수문자, 큰따옴표(\"), 백슬래시(\\), HTML 태그, 이모지 복합 문자열 무결성 테스트"""
        tricky_text = '특수문자 테스트: "큰따옴표" & \'작은따옴표\' \\백슬래시\\ <tag>HTML</tag> 🎯✨💡 #hashtag'
        tricky_note = "노트 메모: \n줄바꿈과 \"따옴표\" 포함"

        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--replace", f"test-undo-item-1:{tricky_text}",
            "--note", tricky_note
        ])
        self.assertEqual(code, 0, f"특수문자 수정 실패: {err}")

        # JSON 파서 파괴 없이 온전하게 읽히는지 확인
        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)

        for n in doc["rootNodes"]:
            for child in n.get("children", []):
                if child.get("id") == "test-undo-item-1":
                    self.assertEqual(child["text"], tricky_text)
                    self.assertEqual(child["note"], tricky_note)

    def test_17_patch_batch_multi_move(self):
        """복수 노드를 하나의 부모 아래로 순차 이동하는 실전 서브트리 래핑 시나리오"""
        batch_payload = [
            # 1. 새 부모 노드 생성
            {"op": "insert", "target_id": "test-workflowy-paste-root", "text": "📦 새로 묶은 그룹 컨테이너", "position": "inside"},
            # 2. test-cut-item-1 및 test-copy-child-2를 새 컨테이너 밑으로 일괄 이동
            {"op": "move", "source_id": "test-cut-item-1", "under": "test-workflowy-paste-root"},
            {"op": "move", "source_id": "test-copy-child-2", "under": "test-workflowy-paste-root"}
        ]
        code, out, err = self.run_cmd([
            PATCH_SCRIPT, self.sample_outline,
            "--batch", json.dumps(batch_payload)
        ])
        self.assertEqual(code, 0, f"다중 이동 배치 실패: {err}")

        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)

        wf_children = doc["rootNodes"][3]["children"]
        wf_child_ids = [c["id"] for c in wf_children]
        self.assertIn("test-cut-item-1", wf_child_ids)
        self.assertIn("test-copy-child-2", wf_child_ids)

    def test_18_seek_edge_cases(self):
        """존재하지 않는 노드 ID 탐색 시 에러 및 말줄임(truncate) 확인"""
        # 1. 존재하지 않는 노드
        code, out, err = self.run_cmd([
            SEEK_SCRIPT, self.sample_outline,
            "--node-id", "ghost-node-999"
        ])
        self.assertNotEqual(code, 0)
        self.assertIn("노드 ID를 찾을 수 없습니다", err)

        # 2. truncate 말줄임 확인
        code, out, err = self.run_cmd([
            SEEK_SCRIPT, self.sample_outline,
            "--truncate", "10"
        ])
        self.assertEqual(code, 0)
        self.assertIn("...", out)

    def test_19_lease_expired_cleaning(self):
        """만료된 락이 다음 요청 시 자동 청소되는지 확인"""
        # TTL 1초 락 생성
        code, out, err = self.run_cmd([LEASE_SCRIPT, self.sample_outline, "acquire", "--ttl", "1"])
        self.assertEqual(code, 0)

        # 1.5초 대기 후 만료 유도
        time.sleep(1.5)

        # 새 락 획득 시 충돌 없이 정상 획득되어야 함 (기존 락 자동 청소)
        code, out, err = self.run_cmd([LEASE_SCRIPT, self.sample_outline, "acquire", "--ttl", "10"])
        self.assertEqual(code, 0, f"만료 락 청소 실패: {err}")
        self.assertIn("락 획득 성공", out)

    def test_20_attachment_overwrite(self):
        """기존 첨부파일이 있는 노드에 신규 파일 재첨부 시 정상 갱신 확인"""
        img1 = os.path.join(self.test_dir, "img1.png")
        img2 = os.path.join(self.test_dir, "img2.png")
        with open(img1, "wb") as f:
            f.write(b"PNG1")
        with open(img2, "wb") as f:
            f.write(b"PNG2")

        # 1차 첨부
        self.run_cmd([ATTACH_SCRIPT, self.sample_outline, "attach", "--node-id", "test-undo-item-1", "--file", img1])
        # 2차 재첨부 (덮어쓰기)
        code, out, err = self.run_cmd([ATTACH_SCRIPT, self.sample_outline, "attach", "--node-id", "test-undo-item-1", "--file", img2])
        self.assertEqual(code, 0)

        with open(self.sample_outline, "r", encoding="utf-8") as f:
            doc = json.load(f)

        for n in doc["rootNodes"]:
            for c in n.get("children", []):
                if c.get("id") == "test-undo-item-1":
                    self.assertEqual(c["file"]["target"], "img2.png")

    # =========================================================================
    # 6. 통합 엔드투엔드(E2E) 및 스키마 검증
    # =========================================================================
    def test_21_e2e_schema_validation(self):
        """전체 변경 후 validate_outline.py 린터 통과 검증"""
        # 여러 작업을 수행하여 파일을 변형
        self.run_cmd([PATCH_SCRIPT, self.sample_outline, "--replace", "test-copy-target-1:수정된 복사 대상 A"])
        self.run_cmd([PATCH_SCRIPT, self.sample_outline, "--insert", "test-copy-target-1:새로운 하위 자식", "--position", "inside"])
        self.run_cmd([PATCH_SCRIPT, self.sample_outline, "--move", "test-cut-item-1:test-workflowy-paste-root"])

        # 최종 스키마 린터 실행
        if os.path.exists(VALIDATOR_SCRIPT):
            code, out, err = self.run_cmd([VALIDATOR_SCRIPT, self.sample_outline])
            self.assertEqual(code, 0, f"최종 아웃라인 린터 실패: {out}\n{err}")
            self.assertIn("[PASS]", out)


if __name__ == "__main__":
    unittest.main()
