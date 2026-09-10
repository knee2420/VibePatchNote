"""저장 위치의 단일 게이트 (XDG Base Directory Specification 준용).

수명주기가 다른 데이터를 한 폴더에 섞지 않는다. 최상위 네 갈래가 곧
"지워도 되는가 / 백업해야 하는가"의 답이다.

    config/   설정              지우면 사용자 선택이 초기화된다
    data/     원본·산출물·실행상태  지우면 복구 불가. 백업 대상
    cache/    결정적 파생         지워도 재계산으로 복구된다
    state/    운영 상태·로그       지워도 무해. 백업 불필요

판정 규칙은 두 줄이다.

    ① 같은 입력으로 다시 돌려 바이트가 같은가?
       예 → cache/   ·   아니오 → data/
       LLM 이 개입했으면 자동으로 data/ 다. 재현되지 않고 비용이 든다.

    ② 프로세스가 죽었을 때 잃으면 안 되는가?
       예 → data/    ·   아니오 → state/

`data/` 안은 아키텍처의 층 이름을 그대로 쓴다(Knowledge · Runtime · Memory ·
Agreement · Observation). 디렉터리 이름만 보고 어느 층의 데이터인지 알 수 있어야 한다.

이 모듈은 **등급과 층까지만** 안다. `documents` `scaffolds` 같은 도메인 이름은
각 도메인 어댑터가 인자로 넘긴다. core 가 도메인 이름을 알면 그 순간
"core 는 도메인을 모른다"는 계약이 깨진다.
"""
from __future__ import annotations

from pathlib import Path

from .ids import safe_segment

# 저장 레이아웃 버전. 마이그레이션이 끝난 저장소만 이 값을 갖는다.
STORAGE_VERSION = 2


class StorageRoots:
    """등급 루트와 층 디렉터리를 소유하는 유일한 객체."""

    def __init__(
        self,
        base_dir: Path,
        *,
        config_dir: Path | None = None,
        data_dir: Path | None = None,
        cache_dir: Path | None = None,
        state_dir: Path | None = None,
    ) -> None:
        self.base_dir = base_dir
        self.config = config_dir or base_dir / "config"
        self.data = data_dir or base_dir / "data"
        self.cache = cache_dir or base_dir / "cache"
        self.state = state_dir or base_dir / "state"

    # --- data/ : 층 (6층 + 2레일) -------------------------------------

    @property
    def knowledge(self) -> Path:
        """[4 Knowledge] 원본과 LLM 산출물."""
        return self.data / "knowledge"

    @property
    def runs(self) -> Path:
        """[2 Runtime] 재개 가능한 실행 상태."""
        return self.data / "runs"

    @property
    def agreements(self) -> Path:
        """[B Agreement] 사람이 내린 결정. 불변."""
        return self.data / "agreements"

    @property
    def ledger(self) -> Path:
        """[A Observation·집계] 토큰·비용 원장. 영구."""
        return self.data / "ledger"

    @property
    def memory(self) -> Path:
        """[3 Memory] 세션과 에피소드."""
        return self.data / "memory"

    @property
    def sessions(self) -> Path:
        return self.memory / "sessions"

    @property
    def episodes(self) -> Path:
        return self.memory / "episodes"

    def knowledge_of(self, domain: str) -> Path:
        """도메인별 지식 루트. 도메인 이름은 호출한 어댑터가 소유한다."""
        return self.knowledge / safe_segment(domain)

    # --- cache/ : 결정적 파생만 ----------------------------------------

    def cache_of(self, domain: str) -> Path:
        return self.cache / safe_segment(domain)

    # --- state/ : 죽어도 되는 것 ----------------------------------------

    @property
    def log(self) -> Path:
        return self.state / "log"

    @property
    def traces(self) -> Path:
        return self.log / "traces"

    @property
    def provider_state_file(self) -> Path:
        """공급자 차단 상태. 원장에서 재계산할 수 있으므로 state/ 다."""
        return self.state / "provider-state.json"

    @property
    def agy_status_file(self) -> Path:
        """외부 CLI 브리지가 기록하는 상태 스냅샷."""
        return self.state / "agy-status.json"

    # --- config/ --------------------------------------------------------

    @property
    def llm_runtime_policy_file(self) -> Path:
        return self.config / "llm-runtime-policy.json"

    # --- 마이그레이션 --------------------------------------------------

    @property
    def version_file(self) -> Path:
        return self.data / ".storage_version"

    def read_version(self) -> int | None:
        """저장소 레이아웃 버전. 파일이 없으면 None(=미마이그레이션)."""
        try:
            return int(self.version_file.read_text(encoding="utf-8").strip())
        except (OSError, ValueError):
            return None

    def write_version(self, version: int) -> None:
        self.version_file.parent.mkdir(parents=True, exist_ok=True)
        self.version_file.write_text(str(version), encoding="utf-8")

    def is_empty(self) -> bool:
        """아직 아무것도 저장되지 않은 새 설치인지 판정한다."""
        return not any(root.exists() for root in (self.data, self.cache, self.state))

    # --- 준비 -----------------------------------------------------------

    def ensure(self) -> None:
        """부팅 시 필요한 디렉터리를 만든다.

        `cache/` 와 `state/` 는 언제든 통째로 지워질 수 있으므로 여기서 다시 만든다.
        그 두 곳이 없어도 앱이 뜬다는 것이 등급 규칙의 실제 계약이다.
        """
        for directory in (
            self.config,
            self.knowledge,
            self.runs,
            self.agreements,
            self.ledger,
            self.sessions,
            self.episodes,
            self.cache,
            self.log,
            self.traces,
        ):
            directory.mkdir(parents=True, exist_ok=True)
