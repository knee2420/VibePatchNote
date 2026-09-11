from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from agent_telemetry.contracts.enums import ExecutionProtocol, FailureReason


class SpanError(BaseModel):
    """장애 발생 시 에러 상세 구조"""
    code: str = Field(..., description="에러 식별 코드 (예: CLI_TIMEOUT, HTTP_429)")
    message: str = Field(..., description="에러 메시지")
    failure_reason: FailureReason = Field(FailureReason.UNKNOWN, description="장애 원인 분류")
    stack_trace: Optional[str] = Field(None, description="파이썬 예외 트레이스백")
    stderr: Optional[str] = Field(None, description="CLI stderr 표준 에러 버퍼")


class SpanMetadata(BaseModel):
    """코딩 에이전트 및 CLI 환경 메타데이터"""
    agent_runtime: str = Field("custom-engine", description="런타임 식별자 (예: agy-cli 2.0, google-genai-sdk)")
    execution_protocol: ExecutionProtocol = Field(ExecutionProtocol.CLI_SUBPROCESS, description="실행 프로토콜")
    provider: str = Field("unknown", description="하네스 공급자 (agy_cli, google_api, local_serving)")
    model_name: str = Field("unknown", description="실행 모델명")
    thread_id: Optional[str] = Field(None, description="문서 또는 세션 ID")
    git_branch: Optional[str] = Field(None, description="현재 Git 브랜치")
    git_commit_sha: Optional[str] = Field(None, description="현재 Git 커밋 해시")
    working_directory: Optional[str] = Field(None, description="실행 작업 디렉터리")
    cli_command: Optional[List[str]] = Field(None, description="실행된 CLI 인자 배열")
    exit_code: Optional[int] = Field(None, description="프로세스 종료 코드")
    extra: Dict[str, Any] = Field(default_factory=dict, description="기타 임의 메타데이터")
