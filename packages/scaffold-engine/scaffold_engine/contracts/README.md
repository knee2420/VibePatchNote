# Engine Contracts (planned)

호스트와 엔진이 공유하는 요청, 결과, 실패, 모델 실행 계약의 정본을 둘 위치다.

계약은 FastAPI, React, OS 자격증명, 특정 공급자 구현을 import하지 않는다. 앱은 이 패키지의 Public API를 통해서만 계약을 사용한다.
