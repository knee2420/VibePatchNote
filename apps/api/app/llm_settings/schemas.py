from pydantic import BaseModel, ConfigDict, Field


class GoogleApiKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=10, alias="apiKey")


class ProviderStatus(BaseModel):
    """공급자 하나의 설정 여부와 지금 쓸 수 있는지."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    configured: bool
    masked_key: str | None = Field(default=None, alias="maskedKey")
    role: str
    # 설정돼 있어도 쿼터 소진 등으로 지금은 못 쓸 수 있다.
    available: bool = True
    blocked_reason: str | None = Field(default=None, alias="blockedReason")
    blocked_until: str | None = Field(default=None, alias="blockedUntil")
    recovers_in: str | None = Field(default=None, alias="recoversIn")


class ProviderStatusResponse(BaseModel):
    providers: list[ProviderStatus]


class ModelOption(BaseModel):
    id: str
    label: str
    provider: str
    input_token_limit: int | None = Field(default=None, alias="inputTokenLimit")
    output_token_limit: int | None = Field(default=None, alias="outputTokenLimit")
    supports_structured_output: bool = Field(default=True, alias="supportsStructuredOutput")


class RuntimePolicy(BaseModel):
    primary_provider: str = Field(alias="primaryProvider")
    primary_model: str = Field(alias="primaryModel")
    primary_timeout_seconds: int = Field(alias="primaryTimeoutSeconds")
    fallback_provider: str = Field(alias="fallbackProvider")
    fallback_model: str = Field(alias="fallbackModel")
    fallback_timeout_seconds: int = Field(alias="fallbackTimeoutSeconds")


class RuntimeDashboardResponse(BaseModel):
    providers: list[ProviderStatus]
    models: list[ModelOption]
    policy: RuntimePolicy
    quota_notice: str = Field(alias="quotaNotice")
    agy_status: dict | None = Field(default=None, alias="agyStatus")
    agy_status_bridge_command: str = Field(alias="agyStatusBridgeCommand")
    agy_status_line_installed: bool = Field(alias="agyStatusLineInstalled")


class AgyStatusLineInstallResponse(BaseModel):
    settings_file: str = Field(alias="settingsFile")
    installed: bool


class AgyUsageBucket(BaseModel):
    id: str
    name: str
    description: str | None = None
    window: str
    disabled: bool = False
    remaining_fraction: float
    reset_time: str | None = None


class AgyUsageGroup(BaseModel):
    name: str
    description: str | None = None
    buckets: list[AgyUsageBucket]


class AgyUsageResponse(BaseModel):
    description: str = ""
    groups: list[AgyUsageGroup]


class GoogleApiModel(BaseModel):
    id: str
    label: str
    input_token_limit: int | None = Field(default=None, alias="inputTokenLimit")
    output_token_limit: int | None = Field(default=None, alias="outputTokenLimit")
    supports_generate_content: bool = Field(alias="supportsGenerateContent")


class GoogleApiModelResponse(BaseModel):
    models: list[GoogleApiModel]


class GoogleQuotaAuthorizationResponse(BaseModel):
    authorization_url: str = Field(alias="authorizationUrl")


class GoogleQuotaStatusResponse(BaseModel):
    connected: bool
    client_secret_configured: bool = Field(alias="clientSecretConfigured")
    project_id: str = Field(alias="projectId")
    project_number: str = Field(alias="projectNumber")
    scope: str


class GoogleModelUsage(BaseModel):
    """이 API 키로 쓸 수 있고 프로젝트 tier 에서 제공 중인 모델 하나. 한도 -1 은 무제한."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    category: str
    rpm: int | None = None
    tpm: int | None = None
    rpd: int | None = None
    recent_tokens: int = Field(default=0, alias="recentTokens")


class GoogleProjectUsageResponse(BaseModel):
    project_id: str = Field(alias="projectId")
    checked_at: int = Field(alias="checkedAt")
    tier: str
    billing_enabled: bool | None = Field(default=None, alias="billingEnabled")
    models: list[GoogleModelUsage]


class GoogleOAuthClientSecretRequest(BaseModel):
    client_secret: str = Field(alias="clientSecret", min_length=8)


class RuntimePolicyUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    primary_model: str = Field(alias="primaryModel", min_length=1)
    primary_timeout_seconds: int = Field(alias="primaryTimeoutSeconds", ge=15, le=600)
    fallback_model: str = Field(alias="fallbackModel", min_length=1)
    fallback_timeout_seconds: int = Field(alias="fallbackTimeoutSeconds", ge=15, le=600)
