# LLM Settings Domain

Google API 보조 경로의 자격증명 등록, 상태 조회, 삭제를 소유하는 도메인이다.

키 원문은 작업공간, JSON 아카이브, 로그, trace, API 조회 응답에 저장하지 않는다. `core.llm.credentials.OsCredentialStore`가 운영체제 자격증명 저장소를 사용하며 bootstrap에서 조립한다.

## Google 프로젝트 사용량·한도

`GET /api/v1/llm-settings/google-usage` 는 두 출처를 합친다 (`use_cases/read_google_project_usage.py`).

- 저장된 API 키의 모델 목록 — 이 키로 generateContent 를 부를 수 있는 모델
- OAuth(`cloud-platform` scope)로 읽은 Cloud Quotas 한도 — 프로젝트 tier 의 RPM·TPM·RPD

API 키의 모델 목록이 돌려준 현재 generateContent 모델을 보여 준다. RPM·TPM·RPD는 서로 독립된 한도이므로 RPD가 0이거나 비었다는 사실만으로 서비스 종료를 추측하지 않는다. 다른 tier의 한도로 빈칸을 메우지도 않는다.

실시간 사용량은 Cloud Monitoring 이 **결제가 연결된 프로젝트에만** 제공한다. 무료(AI Studio) 프로젝트에서는 한도만 표시하고, 그 거절 응답을 무료 tier 판정에 쓴다. 조회 결과는 저장하지 않는다.
