#!/usr/bin/env python3
"""
04_generate_hub_reference_card.py
==================================
외부 볼트('What-s-in-my-head')의 '📑 문서_서식_수집_파이프라인' 상위 디렉터리에
검증된 서식 수급처 허브의 독립 레퍼런스 카드('(web)<허브명>.md')를 자동 생성하는 공식 CLI 도구.

[핵심 규칙]
1. 접두사: '(web)<허브명>.md' 엄격 준수 ('(web&강추)' 등 임의의 강조 구분자 사용 금지).
2. 위치: 반드시 '1.collection' 외부인 상위 '📑 문서_서식_수집_파이프라인/' 에 생성.
3. 이미지: 각 허브의 실측 캡처 이미지를 본문 최상단 및 프론트매터 '커버:' 에 1:1로 반드시 임베드 (paste).
4. 통합 카탈로그: Microsoft Create, 예스폼, Jotform 등 동일 플랫폼 다중 카탈로그는 '대표 카드 1장' 으로 통합.
5. 8대 분류 속성: 4번 노드 38개 정규 어휘 1:1 파싱 바인딩.

[사용법]
# 1. 특정 카드(Top 10)에 수록된 신규 실측 허브 카드 일괄 생성
python 04_generate_hub_reference_card.py --card "17. (포맷) 고정 인쇄형 서식 수급처 Top 10.md"

# 2. 마스터 아웃라인 5번 노드 기준 전체 허브 카드 일괄 동기화/재생성
python 04_generate_hub_reference_card.py --all-outline
"""

import argparse
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

DEFAULT_VAULT_PIPELINE_DIR = r"c:\망고독 관련 자료\프로젝트_매니지먼트\What-s-in-my-head\3.📦(Resource) 자료\📑 문서_서식_수집_파이프라인"
DEFAULT_COLLECTION_DIR = os.path.join(DEFAULT_VAULT_PIPELINE_DIR, "1.collection")
DEFAULT_OUTLINE_PATH = os.path.join(DEFAULT_VAULT_PIPELINE_DIR, "디지털_문서_서식_플랫폼_정의_및_글로벌_벤치마크.outline")
VALIDATOR_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "validator", "validate_obsidian_note.py"))

def parse_tags_bullet(tag_text: str) -> dict:
    tags = re.findall(r'【(.*?)】', tag_text)
    keys = ['과금모델', '도메인', '출처유형', '파일포맷', '서식형태', '적용시장']
    res = {}
    for i, k in enumerate(keys):
        if i < len(tags):
            res[k] = tags[i].strip()
        else:
            res[k] = ""
    return res

def extract_section_data(doc_path: str, sec_name: str) -> dict:
    if not os.path.exists(doc_path):
        return None
    
    with open(doc_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    core_name = re.sub(r'^\d+\.\s*', '', sec_name).strip()
    escaped_core = re.escape(core_name)
    pattern = rf'(?:^|\n)#{{2,3}}\s+(?:\d+\.\s*)?{escaped_core}[^\n]*\n(.*?)(?=\n#{{2,3}}\s+|\Z)'
    m = re.search(pattern, content, re.DOTALL)
    if not m:
        escaped_sec = re.escape(sec_name.strip())
        pattern_sec = rf'(?:^|\n)#{{2,3}}\s+{escaped_sec}[^\n]*\n(.*?)(?=\n#{{2,3}}\s+|\Z)'
        m = re.search(pattern_sec, content, re.DOTALL)
    
    if not m:
        return None
    
    block = m.group(1).strip()
    
    img_match = re.search(r'!\[\[(.*?)\]\]', block)
    img_name = img_match.group(1) if img_match else ""
    
    link_m = re.search(r'\*\s+\*\*허브 링크\*\*:\s*(\S+)', block)
    link = link_m.group(1) if link_m else ""
    
    what_m = re.search(r'\*\s+\*\*무엇이 있나\*\*:\s*(.*?)(?=\n\*|\Z)', block, re.DOTALL)
    what_val = what_m.group(1).strip().replace('\n', ' ') if what_m else ""
    
    terms_m = re.search(r'\*\s+\*\*이용 조건\*\*:\s*(.*?)(?=\n\*|\Z)', block, re.DOTALL)
    terms_val = terms_m.group(1).strip().replace('\n', ' ') if terms_m else ""
    
    pipe_m = re.search(r'\*\s+\*\*파이프라인 관점\*\*:\s*(.*?)(?=\n\*|\n!|\n---|\Z)', block, re.DOTALL)
    pipe_val = pipe_m.group(1).strip().replace('\n', ' ') if pipe_m else ""
    pipe_val = re.sub(r'!\[\[.*?\]\]', '', pipe_val).replace('---', '').strip()
    
    return {
        'img': img_name,
        'link': link,
        'what': what_val,
        'terms': terms_val,
        'pipe': pipe_val,
        'raw_block': block
    }

def create_single_card(output_dir: str, clean_name: str, doc_name: str, sec_name: str,
                       hub_url: str, tags: dict, sec_data: dict) -> str:
    safe_name = re.sub(r'[\\/:*?"<>|]', '', clean_name).strip()
    filename = f"(web){safe_name}.md"
    filepath = os.path.join(output_dir, filename)
    
    cover_img = sec_data['img'] if sec_data and sec_data['img'] else ""
    if not hub_url and sec_data and sec_data['link']:
        hub_url = sec_data['link']
    
    topics = ["서식 수급처"]
    if tags.get('도메인'):
        for d in tags['도메인'].split(' · '):
            d = d.strip()
            if d and d not in topics:
                topics.append(d)
    if tags.get('출처유형'):
        for c in tags['출처유형'].split(' · '):
            c = c.strip()
            if c and c not in topics:
                topics.append(c)
    
    if sec_data and sec_data['what']:
        what_clean = re.sub(r'\s+', ' ', sec_data['what']).strip()
        summary = f"{clean_name} — {what_clean[:80]}"
    else:
        summary = f"{clean_name} 서식 수급처 허브"
    safe_summary = summary.replace('"', "'").strip()
    
    what_text = sec_data['what'] if sec_data and sec_data['what'] else "서식 목록 및 다운로드 제공."
    terms_text = sec_data['terms'] if sec_data and sec_data['terms'] else "공식 페이지 정책 준수."
    pipe_text = sec_data['pipe'] if sec_data and sec_data['pipe'] else "문서 구조화 및 파싱 벤치마크 데이터로 활용."
    
    md_lines = [
        "---",
        "유형: 레퍼런스",
        "구역: 3.resource",
        "분류:",
        "  - 📑 문서_서식_수집_파이프라인",
        "주제:"
    ]
    for t in topics:
        md_lines.append(f"  - {t}")
    md_lines.extend([
        "상태: 정리",
        f'요약: "{safe_summary}"',
        "작성일: 2026-10-26",
        "마감:",
        f'커버: "[[{cover_img}]]"' if cover_img else "커버:",
        '상위: "[[디지털_문서_서식_플랫폼_정의_및_글로벌_벤치마크]]"',
        "링크:",
        f"  - {hub_url}" if hub_url else "링크:",
        "담당:",
        '  - "[[민규 서]]"',
        '  - "[[Rin]]"',
        "작성자:",
        '  - "[[Antigravity]]"',
        "# ── 이외 속성 (유형별 고유값 · 통일 대상 아님) ──",
        "평가:"
    ])
    for prop_key in ['과금모델', '도메인', '출처유형', '파일포맷', '서식형태', '적용시장']:
        v = tags.get(prop_key, '')
        items = [x.strip() for x in v.split(' · ') if x.strip()] if v else []
        if not items:
            md_lines.append(f"{prop_key}:")
        else:
            md_lines.append(f"{prop_key}:")
            for it in items:
                md_lines.append(f"  - {it}")
    md_lines.append("---")
    
    if cover_img:
        md_lines.append(f"![[{cover_img}]]\n")
    
    md_lines.append(f"{clean_name} 공식 서식 수급처 허브.")
    md_lines.append(f"{what_text}\n")
    
    md_lines.append("## 1. 허브 뷰 및 서식 카탈로그 구조")
    md_lines.append(f"* **보유 서식 건수 및 카테고리**: {what_text}")
    md_lines.append(f"* **공식 사이트 링크**: {hub_url}\n")
    
    md_lines.append("## 2. 제공 포맷 및 다운로드 인터페이스")
    md_lines.append(f"* **지원 파일 포맷**: {tags.get('파일포맷', '문서 텍스트형')}")
    md_lines.append(f"* **다운로드 및 제공 방식**: {tags.get('수집방식', '공개 다운로드형')}\n")
    
    md_lines.append("## 3. 이용 조건 및 라이선스 (공공/상업적 이용 범위)")
    md_lines.append(f"* **공식 라이선스/정책**: {tags.get('라이선스', '개인 이용 한정형')}")
    md_lines.append(f"* **이용 조건 상세**: {terms_text}\n")
    
    md_lines.append("## 4. 파이프라인 수집·파싱 기술 관점")
    md_lines.append(f"* **파이프라인 활용 가이드**: {pipe_text}\n")
    
    md_lines.append("## 5. 원천 레퍼런스 연동")
    md_lines.append("* 상위 정의: [[디지털_문서_서식_플랫폼_정의_및_글로벌_벤치마크.outline]]")
    md_lines.append(f"* 원천 수급처 카드: [[{doc_name}#{sec_name}]]")
    
    with open(filepath, 'w', encoding='utf-8', newline='\n') as fp:
        fp.write("\n".join(md_lines) + "\n")
    
    return filename

def create_group_card(output_dir: str, col_dir: str, group_name: str, main_url: str,
                      group_desc: str, sub_nodes: list) -> str:
    filename = f"(web){group_name}.md"
    filepath = os.path.join(output_dir, filename)
    
    sub_catalogs = []
    all_tags = []
    cover_img = ""
    
    for sc in sub_nodes:
        sc_txt = sc.get('text', '')
        sc_subs = sc.get('children', [])
        sc_m = re.match(r'\[\[(.*?)#(.*?)\|(.*?)\]\]', sc_txt)
        if sc_m:
            sc_doc, sc_sec, sc_alias = sc_m.groups()
            doc_file = os.path.join(col_dir, f"{sc_doc}.md")
            sc_data = extract_section_data(doc_file, sc_sec)
            sc_url = sc_subs[0].get('text', '') if len(sc_subs) > 0 else ""
            sc_tag_str = sc_subs[1].get('text', '') if len(sc_subs) > 1 else ""
            sc_tags = parse_tags_bullet(sc_tag_str)
            all_tags.append(sc_tags)
            
            if not cover_img and sc_data and sc_data['img']:
                cover_img = sc_data['img']
            
            sub_catalogs.append({
                'doc': sc_doc,
                'sec': sc_sec,
                'alias': sc_alias,
                'url': sc_url,
                'data': sc_data,
                'tags': sc_tags
            })
    
    merged_tags = {}
    for k in ['과금모델', '도메인', '출처유형', '파일포맷', '서식형태', '적용시장']:
        vals = []
        for t in all_tags:
            v = t.get(k, '')
            if v:
                for sub_v in v.split(' · '):
                    sub_v = sub_v.strip()
                    if sub_v and sub_v not in vals:
                        vals.append(sub_v)
        merged_tags[k] = " · ".join(vals)
    
    topic_list = ["서식 수급처"]
    if merged_tags.get('도메인'):
        for d in merged_tags['도메인'].split(' · '):
            d = d.strip()
            if d and d not in topic_list:
                topic_list.append(d)
    
    summary = f"{group_name} 공식 서식 플랫폼. {len(sub_catalogs)}대 세부 카탈로그를 단일 카드로 통합 관리"
    safe_summary = summary.replace('"', "'").strip()
    
    md_lines = [
        "---",
        "유형: 레퍼런스",
        "구역: 3.resource",
        "분류:",
        "  - 📑 문서_서식_수집_파이프라인",
        "주제:"
    ]
    for t in topic_list:
        md_lines.append(f"  - {t}")
    md_lines.extend([
        "상태: 정리",
        f'요약: "{safe_summary}"',
        "작성일: 2026-10-26",
        "마감:",
        f'커버: "[[{cover_img}]]"' if cover_img else "커버:",
        '상위: "[[디지털_문서_서식_플랫폼_정의_및_글로벌_벤치마크]]"',
        "링크:",
        f"  - {main_url}"
    ])
    for sc in sub_catalogs:
        if sc['url'] and sc['url'] != main_url:
            md_lines.append(f"  - {sc['url']}")
    md_lines.extend([
        "담당:",
        '  - "[[민규 서]]"',
        '  - "[[Rin]]"',
        "작성자:",
        '  - "[[Antigravity]]"',
        "# ── 이외 속성 (유형별 고유값 · 통일 대상 아님) ──",
        "평가:"
    ])
    for prop_key in ['과금모델', '도메인', '출처유형', '파일포맷', '서식형태', '적용시장']:
        v = merged_tags.get(prop_key, '')
        items = [x.strip() for x in v.split(' · ') if x.strip()] if v else []
        if not items:
            md_lines.append(f"{prop_key}:")
        else:
            md_lines.append(f"{prop_key}:")
            for it in items:
                md_lines.append(f"  - {it}")
    md_lines.append("---")
    
    if cover_img:
        md_lines.append(f"![[{cover_img}]]\n")
    
    md_lines.append(f"{group_desc}\n")
    
    md_lines.append("## 1. 대표 포털 개요 및 메인 정보")
    md_lines.append(f"* **공식 대표 사이트**: {main_url}")
    md_lines.append(f"* **보유 세부 서브 카탈로그 수**: {len(sub_catalogs)}개 허브\n")
    
    md_lines.append("## 2. 세부 서브 카탈로그 카탈로그 및 이미지")
    for sc_idx, sc in enumerate(sub_catalogs, 1):
        sc_core = re.sub(r'^\d+\.\s*', '', sc['sec']).strip()
        md_lines.append(f"### 2.{sc_idx}. {sc_core}")
        if sc['data'] and sc['data']['img']:
            md_lines.append(f"![[{sc['data']['img']}]]\n")
        if sc['url']:
            md_lines.append(f"* **서브 카탈로그 URL**: {sc['url']}")
        if sc['data']:
            if sc['data']['what']:
                md_lines.append(f"* **보유 서식 및 기능**: {sc['data']['what']}")
            if sc['data']['terms']:
                md_lines.append(f"* **이용 조건 및 라이선스**: {sc['data']['terms']}")
            if sc['data']['pipe']:
                md_lines.append(f"* **파이프라인 관점**: {sc['data']['pipe']}")
        md_lines.append(f"* **원천 카드 섹션**: [[{sc['doc']}#{sc['sec']}]]\n")
    
    md_lines.append("## 3. 원천 레퍼런스 연동")
    md_lines.append("* 상위 정의: [[디지털_문서_서식_플랫폼_정의_및_글로벌_벤치마크.outline]]")
    for sc in sub_catalogs:
        md_lines.append(f"* 연계 수급처 카드: [[{sc['doc']}#{sc['sec']}]]")
    
    with open(filepath, 'w', encoding='utf-8', newline='\n') as fp:
        fp.write("\n".join(md_lines) + "\n")
    
    return filename

def generate_from_card(card_path: str, output_dir: str, outline_path: str) -> list:
    if not os.path.exists(card_path):
        print(f"[ERROR] Card path does not exist: {card_path}")
        return []
    
    with open(card_path, 'r', encoding='utf-8') as f:
        card_content = f.read()
    
    # Read outline node 5 to map badges
    with open(outline_path, 'r', encoding='utf-8') as f:
        outline_data = json.load(f)
    
    node5 = None
    for r in outline_data.get('rootNodes', []):
        if '실제 조사 완료된 수급처 허브 목록' in r.get('text', ''):
            node5 = r
            break
    
    outline_children = node5.get('children', []) if node5 else []
    
    # Extract sections: ### N. <허브명>
    sections = re.findall(r'(?:^|\n)###\s+(\d+\.\s*[^\n]+)\n(.*?)(?=\n###|\Z)', card_content, re.DOTALL)
    card_doc_name = os.path.splitext(os.path.basename(card_path))[0]
    
    created_files = []
    
    for sec_header, sec_block in sections:
        clean_name = re.sub(r'^\d+\.\s*', '', sec_header).strip()
        
        # Check if this belongs to a group platform
        if 'Microsoft Create' in clean_name:
            # Locate Microsoft Create group node in outline
            ms_node = next((c for c in outline_children if 'Microsoft Create' in c.get('text', '')), None)
            if ms_node:
                fname = create_group_card(output_dir, os.path.dirname(card_path), "Microsoft Create",
                                          "https://create.microsoft.com",
                                          "마이크로소프트 공식 통합 템플릿 포털.", ms_node.get('children', []))
                created_files.append(fname)
            continue
        elif '예스폼' in clean_name:
            yf_node = next((c for c in outline_children if '예스폼' in c.get('text', '')), None)
            if yf_node:
                fname = create_group_card(output_dir, os.path.dirname(card_path), "예스폼",
                                          "https://www.yesform.com",
                                          "국내 최대 비즈니스·법률 서식 유료 플랫폼.", yf_node.get('children', []))
                created_files.append(fname)
            continue
        elif 'Jotform' in clean_name:
            jf_node = next((c for c in outline_children if 'Jotform' in c.get('text', '')), None)
            if jf_node:
                fname = create_group_card(output_dir, os.path.dirname(card_path), "Jotform",
                                          "https://www.jotform.com",
                                          "글로벌 대표 노코드 웹폼 및 인쇄용 PDF 서식 디렉터리 플랫폼.", jf_node.get('children', []))
                created_files.append(fname)
            continue
        
        # Single hub
        sec_data = extract_section_data(card_path, sec_header)
        
        # Search URL and tags from outline node 5
        hub_url = ""
        tags = {}
        for oc in outline_children:
            if clean_name in oc.get('text', ''):
                sub_c = oc.get('children', [])
                if len(sub_c) > 0:
                    hub_url = sub_c[0].get('text', '')
                if len(sub_c) > 1:
                    tags = parse_tags_bullet(sub_c[1].get('text', ''))
                break
        
        if not tags and sec_data:
            # Fallback default tags if not in outline yet
            tags = {'과금모델': '무료', '도메인': '경영·전략', '출처유형': '공식 플랫폼', '파일포맷': '문서 텍스트형'}
        
        fname = create_single_card(output_dir, clean_name, card_doc_name, sec_header, hub_url, tags, sec_data)
        created_files.append(fname)
    
    return created_files

def generate_all_from_outline(outline_path: str, col_dir: str, output_dir: str) -> list:
    with open(outline_path, 'r', encoding='utf-8') as f:
        outline_data = json.load(f)
    
    node5 = None
    for r in outline_data.get('rootNodes', []):
        if '실제 조사 완료된 수급처 허브 목록' in r.get('text', ''):
            node5 = r
            break
    
    if not node5:
        print("[ERROR] Node 5 not found in outline!")
        return []
    
    children = node5.get('children', [])
    created_files = []
    
    for idx, child in enumerate(children, 1):
        txt = child.get('text', '')
        subs = child.get('children', [])
        
        # Group hubs
        if 'Microsoft Create' in txt:
            fname = create_group_card(output_dir, col_dir, "Microsoft Create", "https://create.microsoft.com",
                                      "마이크로소프트 공식 통합 템플릿 포털.", subs)
            created_files.append(fname)
            continue
        elif '예스폼' in txt:
            fname = create_group_card(output_dir, col_dir, "예스폼", "https://www.yesform.com",
                                      "국내 최대 비즈니스·법률 서식 유료 플랫폼.", subs)
            created_files.append(fname)
            continue
        elif 'Jotform' in txt:
            fname = create_group_card(output_dir, col_dir, "Jotform", "https://www.jotform.com",
                                      "글로벌 대표 노코드 웹폼 및 인쇄용 PDF 서식 디렉터리 플랫폼.", subs)
            created_files.append(fname)
            continue
        
        # Single hubs
        m = re.match(r'\[\[(.*?)#(.*?)\|(.*?)\]\]', txt)
        if not m:
            continue
        
        doc_name, sec_name, alias = m.groups()
        clean_name = re.sub(r'^\d+\.\s*', '', sec_name).strip()
        doc_path = os.path.join(col_dir, f"{doc_name}.md")
        sec_data = extract_section_data(doc_path, sec_name)
        
        hub_url = subs[0].get('text', '') if len(subs) > 0 else ""
        tag_str = subs[1].get('text', '') if len(subs) > 1 else ""
        tags = parse_tags_bullet(tag_str)
        
        fname = create_single_card(output_dir, clean_name, doc_name, sec_name, hub_url, tags, sec_data)
        created_files.append(fname)
    
    return created_files

def main():
    parser = argparse.ArgumentParser(description="Generate individual hub reference cards ((web)<Hub>.md).")
    parser.add_argument("--card", help="Path to Top 10 card markdown file (e.g. 17. (포맷) 고정 인쇄형...)")
    parser.add_argument("--all-outline", action="store_true", help="Sync all hubs registered in Outline Node 5")
    parser.add_argument("--out-dir", default=DEFAULT_VAULT_PIPELINE_DIR, help="Destination directory (default: pipeline root)")
    parser.add_argument("--col-dir", default=DEFAULT_COLLECTION_DIR, help="Source 1.collection directory")
    parser.add_argument("--outline", default=DEFAULT_OUTLINE_PATH, help="Master outline path")
    
    args = parser.parse_args()
    
    if not args.card and not args.all_outline:
        parser.print_help()
        sys.exit(1)
    
    os.makedirs(args.out_dir, exist_ok=True)
    
    print("=== 04_generate_hub_reference_card: Starting Generation ===")
    print(f"Destination: {args.out_dir}")
    
    if args.card:
        card_full_path = args.card if os.path.isabs(args.card) else os.path.join(args.col_dir, args.card)
        created = generate_from_card(card_full_path, args.out_dir, args.outline)
    elif args.all_outline:
        created = generate_all_from_outline(args.outline, args.col_dir, args.out_dir)
    
    print(f"\n[DONE] Successfully generated {len(created)} reference cards.")
    for c in created[:10]:
        print(f"  - {c}")
    if len(created) > 10:
        print(f"  ... and {len(created)-10} more cards.")

if __name__ == "__main__":
    main()
