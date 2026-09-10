# Documents Agents (planned)

아웃라인 추출과 스캐폴드 생성처럼 모델 폴백, 재시도, 승인 대기 또는 Run 관측이 필요한 문서 업무의 Agent 정의를 둔다.

이곳의 Agent는 문서 업무를 정의할 뿐 공통 실행 상태·공급자 선택·자격증명을 직접 구현하지 않는다. 그 책임은 `core/agent_runtime`과 `core/llm`에 있다.
