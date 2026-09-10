# LLM Settings Domain

Google API 보조 경로의 자격증명 등록, 상태 조회, 삭제를 소유하는 도메인이다.

키 원문은 작업공간, JSON 아카이브, 로그, trace, API 조회 응답에 저장하지 않는다. `core.llm.credentials.OsCredentialStore`가 운영체제 자격증명 저장소를 사용하며 bootstrap에서 조립한다.
