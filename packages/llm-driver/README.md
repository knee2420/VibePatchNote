# LLM Driver (`@vibe/llm-driver`)

도메인 및 호스트에 독립적인(Domain-Agnostic & Host-Independent) 범용 다중 LLM 하네스 및 회복성(Resilient Execution) 커널입니다.

특정 HTTP 웹 프레임워크나 특정 비즈니스 도메인(문서, 캔버스 등)에 의존하지 않으며, 단일 표준 인터페이스(`BaseLlmHarness`)를 통해 다양한 공급자(CLI, SDK, Direct API)의 실행, 쿼터 감지, 에러 판정, 지능형 자동 폴백(Fallback)을 전담합니다.

## 모듈 구성

| 모듈 | 책임 |
| --- | --- |
| `base.py` | `BaseLlmHarness` (기저 추상 클래스), `LlmExecutionResult` (표준 실행 엔벨로프 및 토큰 메타) |
| `registry.py` | `ModelSpec`, 정적 모델 카탈로그 (`Gemini`, `Gemma`, `Claude` 등) |
| `parsing.py` | 모델 출력 JSON 안전 파싱 및 응답 정제 |
| `adapters/` | 공급자별 구체 어댑터 (`AgyCliHarness`, `GoogleGenAiHarness`, `LocalGemmaHarness`, 추후 `AgySdkHarness`, `ClaudeHarness`) |
| `availability.py` | `CliQuotaAvailability` (CLI 쿼터 소진 및 가용성 실측) |
| `provider_state.py` | `ProviderStateStore`, `ProviderStatus` (공급자 쿨다운 상태 파일 및 서킷브레이커) |
| `fallback.py` | `FallbackLlmHarness` (CLI 쿼터 소진 시 Direct API/SDK 무중단 자동 폴백) |
| `policy_harness.py` | `RuntimePolicyHarness` (런타임 정책 기반 동적 공급자 분기) |
| `factory.py` | `HarnessFactory` (프로바이더별 빌더 레지스트리) |
| `ports.py` | `ModelExecutor` Protocol 인터페이스 |

## 핵심 설계 원칙

1. **단일 필수 구현 계약 (`run_structured`)**:
   - 모든 어댑터는 `run_structured` 단 하나만 구현하면, 구상 메서드인 `run_text`와 `run_json`을 공통으로 상속받아 코드 중복과 인터페이스 파편화를 원천 차단합니다.
2. **지능형 폴백 & 쿨다운**:
   - 일시적 쿼터 한도(`429 Quota Exceeded`), 타임아웃, 인증 만료 시 공급자를 즉시 격리(cooldown)하고 대체 공급자로 안전하게 Failover 합니다.
3. **플러그형 어댑터 구조**:
   - 새로운 LLM 공급자(예: Anthropic Claude, Antigravity Python SDK)가 도입되어도 `adapters/`에 신규 하네스 클래스만 추가하면 전체 시스템에 즉시 통합됩니다.
