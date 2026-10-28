---
type: card
title: "Database Schema Node"
description: "테이블 명칭, 키 타입 및 다중 필드 행 목록을 표시하는 스키마/데이터 테이블 전용 노드"
resource: "../../../99.archive/react-flow-ui/components/database-schema-node.tsx"
timestamp: "2026-09-06"
---

# summary
테이블이나 문서 세그먼트 매핑에 최적화된 복합 노드. DatabaseSchemaNode, DatabaseSchemaNodeHeader, DatabaseSchemaNodeField 구조를 가지며, 왼쪽/오른쪽 연결 핸들과 필드 타입 뱃지를 기본 지원한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Schema Node Header | 테이블 아이콘과 테이블 명칭을 표현하는 상단 헤더 슬롯 | `export function DatabaseSchemaNode` |
| E2 | 구조 | Field Row Architecture | 필드명, 데이터 타입 뱃지, 좌우 연결 핸들이 결합된 레코드 행 구조 | `export function DatabaseSchemaNodeField` |
| E3 | 규칙 | Handle Alignment | 필드 행 높이와 완벽히 일치하도록 배치된 포트 정렬 규칙 | `BaseHandle` |

# 밖으로
- 기본 카드 뼈대는 [C-base-node.md](C-base-node.md)를 상속합니다.
- 연결 포트는 [C-base-handle.md](C-base-handle.md)를 사용합니다.

# 원문
[database-schema-node.tsx](../../../99.archive/react-flow-ui/components/database-schema-node.tsx)
