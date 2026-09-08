"""
⚠️ [EXPERIMENTAL / PENDING SPEC]
본 모듈은 메인 아웃라인 파이프라인과 분리된 실험/과도기적 세그먼트 스캔(Segment Scan) 프롬프트입니다.
PDF 문서 상의 시각적 컬러 마스크 오버레이 및 수동 조절(HITL) 검증 목적으로 보존됩니다.
"""
from pathlib import Path


def build_segment_scan_prompt(file_path: Path) -> str:
    """문서의 표/목록/섹션 영역과 정규화 Bounding Box 를 추출하도록 지시합니다."""
    return (
        f"당신은 고정밀 문서 구조 분석 엔진입니다.\n"
        f"다음 문서 파일의 내용을 정밀 분석하세요: {file_path.resolve()}\n\n"
        f"목표:\n"
        f"1. 문서의 페이지별로 표(table), 개조식 목록(list), 섹션/제목(section), 핵심 본문(paragraph) 영역을 분할하세요.\n"
        f"2. 각 영역의 페이지 번호(page, 1부터 시작), 블록 타입(type), 블록 제목/라벨(label), 핵심 요약(content_summary)을 추출하세요.\n"
        f"3. 각 영역의 상대 위치 Bounding Box(box_2d)를 [ymin, xmin, ymax, xmax] 형식의 0~1000 사이 정수 비율로 추정하세요.\n"
        f"   (예: 상단 5%~25%, 좌측 8%~92%면 [50, 80, 250, 920])\n\n"
        f"반드시 다음 JSON 형식으로만 응답하고, 마크다운 코드블록이나 불필요한 서술은 일체 제외하세요:\n"
        f'{{\n'
        f'  "document_title": "{file_path.name}",\n'
        f'  "total_pages": 1,\n'
        f'  "segments": [\n'
        f'    {{\n'
        f'      "id": "seg-1",\n'
        f'      "page": 1,\n'
        f'      "type": "table",\n'
        f'      "label": "회의비 사용 내역 표",\n'
        f'      "box_2d": [150, 80, 750, 920],\n'
        f'      "content_summary": "일시, 장소, 참석자, 안건, 회의내용, 지출금액 등이 포함된 사용 내역 표"\n'
        f'    }}\n'
        f'  ]\n'
        f'}}\n'
    )
