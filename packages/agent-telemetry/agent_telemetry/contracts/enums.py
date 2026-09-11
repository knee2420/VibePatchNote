from enum import Enum


class SpanType(str, Enum):
    PIPELINE = "pipeline"
    CHAIN = "chain"
    LLM = "llm"
    TOOL = "tool"
    PARSER = "parser"


class SpanPhase(str, Enum):
    PRE_LLM = "pre_llm"
    LLM = "llm"
    POST_LLM = "post_llm"


class SpanStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


class ExecutionProtocol(str, Enum):
    CLI_SUBPROCESS = "cli_subprocess"
    DIRECT_REST_API = "direct_rest_api"
    LOCAL_SERVING = "local_serving"


class FailureReason(str, Enum):
    TIMEOUT = "timeout"
    RATE_LIMIT_429 = "rate_limit_429"
    PROCESS_CRASH = "process_crash"
    AUTH_ERROR = "auth_error"
    SCHEMA_VALIDATION_ERROR = "schema_validation_error"
    UNKNOWN = "unknown"
