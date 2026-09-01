# 📚 추가 보충 레퍼런스 (Supplementary Practices)

기존 `97.reference/best-practices-and-references.md`에서 누락된 모노레포, 플러그인 아키텍처, 로깅, LLM 통신, 성능 및 라우팅 관리에 대한 추가 모범 사례와 레퍼런스 모음입니다.

## 1. 모노레포 및 Headless 플러그인 아키텍처

### 🌐 Turborepo & Nx (Monorepo Standard)
* **출처**: [turbo.build](https://turbo.build/) / [nx.dev](https://nx.dev/)
* **분야**: TS/JS 풀스택 모노레포 아키텍처
* **핵심 내용**:
  - `apps/` (실제 구동되는 서비스)와 `packages/` (공통 UI, 유틸, ESLint 설정 등)로 관심사 분리.
  - 헤드리스(Headless) 코어나 플러그인 모듈을 `packages/` 패키지로 독립시켜, 여러 앱에서 재사용 가능하게 구성.

### 🌐 Hexagonal Architecture (Ports and Adapters)
* **출처**: [Netflix TechBlog - Hexagonal Architecture](https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec9677dc)
* **분야**: 플러그인 형태의 유연한 시스템 설계
* **핵심 내용**:
  - 비즈니스 로직(Core)을 중심에 두고, 외부 기술(UI, DB, 외부 API)을 포트(Port)와 어댑터(Adapter)를 통해 플러그인처럼 탈부착하는 설계.

---

## 2. 로그 관리 및 관측성 (Observability)

### 🌐 The Twelve-Factor App: Logs
* **출처**: [12factor.net/ko/logs](https://12factor.net/ko/logs)
* **분야**: 클라우드 네이티브 앱 로깅 표준
* **핵심 내용**:
  - 로그를 파일로 저장하지 않고, 이벤트 스트림(stdout)으로 취급.
  - 외부 실행 환경(ELK, Datadog 등)이 스트림을 수집하여 중앙 집중식으로 분석하고 관리.

### 🌐 OpenTelemetry
* **출처**: [opentelemetry.io](https://opentelemetry.io/)
* **분야**: 분산 시스템 추적 및 로깅 표준
* **핵심 내용**:
  - 마이크로서비스나 플러그인 간의 호출(Trace), 로그(Log), 메트릭(Metric)을 통합적으로 추적하기 위한 글로벌 오픈소스 표준.

---

## 3. LLM API 통신 가이드

### 🌐 OpenAI Cookbook & Vercel AI SDK
* **출처**: [OpenAI Cookbook](https://cookbook.openai.com/) / [Vercel AI SDK](https://sdk.vercel.ai/docs)
* **분야**: LLM 통합 및 프롬프트/스트리밍 엔지니어링
* **핵심 내용**:
  - **Rate Limit & Retry**: 지수 백오프(Exponential Backoff)를 통한 API 제한 대응 및 재시도 로직.
  - **Streaming**: Vercel AI SDK 등을 활용해 긴 생성 응답을 청크 단위로 클라이언트에 스트리밍(UX 최적화).
  - **Tool Calling(Function Calling)**: 모델이 외부 API나 플러그인을 호출할 수 있도록 명세서(Schema)를 제공하는 패턴.

---

## 4. 페이지 라우팅, 성능 및 기능 관리

### 🌐 Next.js App Router & Core Web Vitals
* **출처**: [Next.js Docs](https://nextjs.org/docs) / [web.dev/vitals](https://web.dev/vitals/)
* **분야**: 라우팅 및 웹 성능 최적화
* **핵심 내용**:
  - 서버 컴포넌트(RSC)를 활용해 클라이언트로 전송되는 JS 번들 크기를 최소화하고 성능(LCP, FID) 극대화.
  - 라우트 단위의 Code Splitting 및 Prefetching으로 쾌적한 페이지 이동 경험 제공.

### 🌐 Feature Toggles (Martin Fowler)
* **출처**: [martinfowler.com/articles/feature-toggles.html](https://martinfowler.com/articles/feature-toggles.html)
* **분야**: 기능 관리(Feature Management) 및 점진적 배포
* **핵심 내용**:
  - 코드를 브랜치로 나누는 대신, 환경 변수나 설정값을 통해 기능(Feature)의 On/Off를 제어.
  - 무중단 배포, A/B 테스트, 카나리(Canary) 릴리즈를 위한 필수 아키텍처.
