---
title: Secure Credential Storage
status: candidate
related_feature: F-02
---

# Secure Credential Storage

## 원칙

API 키는 OS 자격증명 저장소에만 보관한다. 작업공간 JSON, 아카이브, trace, 감사 로그, 브라우저 localStorage에는 원문을 남기지 않는다.

## 후보 검토

- Windows Credential Manager를 사용하는 Python keyring 어댑터
- 개발 환경의 명시적 환경 변수 주입

설정 조회 API는 키 원문이 아닌 `configured`, `lastTestedAt`, `available`만 반환한다.
