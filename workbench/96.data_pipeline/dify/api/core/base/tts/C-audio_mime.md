---
type: card
title: "Audio Mime"
description: "audio_mime.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/base/tts/audio_mime.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `audio_mime.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | normalize_audio_mime_type | normalize_audio_mime_type 핵심 로직 및 프로시저 | `## def normalize_audio_mime_type` |
| E2 | 규칙 | get_model_audio_mime_type | get_model_audio_mime_type 핵심 로직 및 프로시저 | `## def get_model_audio_mime_type` |
| E3 | 규칙 | sniff_audio_mime_type | sniff_audio_mime_type 핵심 로직 및 프로시저 | `## def sniff_audio_mime_type` |
| E4 | 규칙 | _normalize_reported_mime_type | _normalize_reported_mime_type 핵심 로직 및 프로시저 | `## def _normalize_reported_mime_type` |
| E5 | 규칙 | _extract_audio_chunk | _extract_audio_chunk 핵심 로직 및 프로시저 | `## def _extract_audio_chunk` |
| E6 | 규칙 | resolve_audio_mime_type | resolve_audio_mime_type 핵심 로직 및 프로시저 | `## def resolve_audio_mime_type` |
| E7 | 규칙 | inspect_audio_stream | inspect_audio_stream 핵심 로직 및 프로시저 | `## def inspect_audio_stream` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[audio_mime.py](../../../../../../99.archive/dify/api/core/base/tts/audio_mime.py)
