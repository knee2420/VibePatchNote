import { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Presentation,
  Sparkles,
} from 'lucide-react';
import type { ResourceItem } from '../model/types';

export interface A4DocumentViewerProps {
  resource: ResourceItem;
  onOpenInEditor?: (resource: ResourceItem) => void;
}

export function A4DocumentViewer({ resource, onOpenInEditor }: A4DocumentViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const name = resource.name.toLowerCase();
  const isPptOrPdf = name.includes('ppt') || name.includes('발표') || resource.format.toLowerCase() === 'pdf';
  const isMeetingNote = name.includes('회의록');
  const isReport = name.includes('결과보고') || name.includes('종합보고');

  const totalPages = isPptOrPdf ? 2 : isReport ? 2 : 1;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 140));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 70));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-lg overflow-hidden border border-slate-800">
      {/* 1. 상단 헵타베이스 스타일 문서 뷰어 제어 툴바 */}
      <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0 select-none">
        <div className="flex items-center gap-2">
          {isPptOrPdf ? (
            <Presentation className="w-4 h-4 text-rose-400" />
          ) : (
            <FileText className="w-4 h-4 text-emerald-400" />
          )}
          <span className="font-semibold text-slate-200 truncate max-w-[200px]">
            {resource.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {isPptOrPdf ? 'SLIDE DECK' : 'A4 DOCUMENT'}
          </span>
        </div>

        {/* 줌 및 페이지 제어 */}
        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-mono mr-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="hover:text-white disabled:opacity-30 cursor-pointer"
                title="이전 페이지"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="hover:text-white disabled:opacity-30 cursor-pointer"
                title="다음 페이지"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-[11px] font-mono">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:text-white cursor-pointer"
              title="축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              onClick={handleResetZoom}
              className="px-1.5 cursor-pointer hover:text-indigo-300"
              title="100%로 리셋"
            >
              {zoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:text-white cursor-pointer"
              title="확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onOpenInEditor && (
            <button
              type="button"
              onClick={() => onOpenInEditor(resource)}
              className="ml-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 text-[11px] cursor-pointer shadow-xs transition-colors"
              title="중앙 편집 캔버스로 보내기"
            >
              <ExternalLink className="w-3 h-3" />
              <span>에디터 열기</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 문서 시트 캔버스 영역 (헵타베이스 A4 프리뷰) */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 flex justify-center items-start custom-scrollbar bg-slate-900/60">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="shrink-0"
        >
          {/* A. 프레젠테이션 슬라이드 (16:9 와이드) */}
          {isPptOrPdf ? (
            <div className="w-[620px] aspect-[16/9] bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 p-8 flex flex-col justify-between relative overflow-hidden select-text">
              {/* 슬라이드 1: 표지 */}
              {currentPage === 1 ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                        ACE+ Creative Future Design Project
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">2018. 11. 28</span>
                  </div>

                  <div className="my-auto space-y-4">
                    <div className="inline-block px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-xs font-mono font-semibold">
                      최종 성과 발표회
                    </div>
                    <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-snug">
                      딥러닝 기반 실내외 자율주행 및<br />
                      충돌회피 쿼드콥터 드론 플랫폼 개발
                    </h1>
                    <p className="text-sm text-slate-400">
                      Vision & LiDAR Sensor Fusion-based Autonomous Obstacle Avoidance Drone
                    </p>
                  </div>

                  <div className="flex items-end justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-200">팀 딥드론 (DeepDrone)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">부산대학교 공과대학 전기컴퓨터공학부</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-300 font-medium">발표자: 김진우 팀장</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">지도교수: ACE 디딤돌 사업단</p>
                    </div>
                  </div>
                </>
              ) : (
                /* 슬라이드 2: 주요 성과 요약 */
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>02. 핵심 개발 성과 및 실증 테스트 결과</span>
                    </h2>
                    <span className="text-[11px] font-mono text-slate-500">Page 2 / 2</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-auto">
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <h3 className="text-xs font-bold text-slate-200">1. 자율 장애물 회피 알고리즘</h3>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                        <li>실내 GPS 음영지역 비전 오도메트리 구동</li>
                        <li>초음파 + 2D LiDAR 센서 퓨전 (0.1m 정밀도)</li>
                        <li>회피 성공률 94.2% 달성 (실내 테스트 50회)</li>
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <h3 className="text-xs font-bold text-slate-200">2. 하드웨어 및 전시 성과</h3>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                        <li>경진대회 18번 부스 시제품 실물 전시 완료</li>
                        <li>배터리 런타임 18분 안정적 호버링 확보</li>
                        <li>예산 집행률 98.4% (3,440,000원 정산 완료)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                    <span>DeepDrone Autonomous Quadcopter Project</span>
                    <span>부산대학교 ACE 사업단</span>
                  </div>
                </>
              )}
            </div>
          ) : isMeetingNote ? (
            /* B. 정기 회의록 A4 서식 */
            <div className="w-[560px] min-h-[780px] bg-white text-slate-900 shadow-2xl border border-slate-300 p-8 sm:p-10 flex flex-col justify-between select-text font-serif">
              <div>
                <div className="text-right text-[11px] text-slate-500 font-sans mb-1">[별지 제3호 서식]</div>
                <h1 className="text-xl font-bold text-center text-slate-950 mb-6 tracking-wide underline underline-offset-4 decoration-slate-400">
                  디딤돌 사업 정기 활동 회의록
                </h1>

                <table className="w-full border-collapse border border-slate-800 text-xs font-sans mb-6">
                  <tbody>
                    <tr>
                      <th className="border border-slate-800 bg-slate-100 p-2 w-24 text-center font-bold text-slate-800">
                        일 시
                      </th>
                      <td className="border border-slate-800 p-2">2018년 11월 15일 (목) 16:00 ~ 18:30</td>
                      <th className="border border-slate-800 bg-slate-100 p-2 w-20 text-center font-bold text-slate-800">
                        장 소
                      </th>
                      <td className="border border-slate-800 p-2">공학관 304호 프로젝트실</td>
                    </tr>
                    <tr>
                      <th className="border border-slate-800 bg-slate-100 p-2 text-center font-bold text-slate-800">
                        참석자
                      </th>
                      <td colSpan={3} className="border border-slate-800 p-2">
                        김진우(팀장), 박성민, 이다은, 최영훈 (총 4명 참석, 전원 참석)
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-slate-800 bg-slate-100 p-2 text-center font-bold text-slate-800">
                        안 건
                      </th>
                      <td colSpan={3} className="border border-slate-800 p-2 font-semibold">
                        최종 성과발표회 발표 슬라이드 점검 및 시제품 부스 배치 계획
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-slate-800 bg-slate-100 p-2 text-center font-bold text-slate-800 align-top h-52">
                        회의 내용<br />및 결과
                      </th>
                      <td colSpan={3} className="border border-slate-800 p-3 align-top leading-relaxed text-slate-800">
                        1. <strong>발표자료 구성 확정</strong>: 딥러닝 기반 센서 퓨전 결과 중심으로 15분 발표 대본 확정.<br />
                        2. <strong>부스 시연 준비</strong>: 18번 부스 규격에 맞춰 안전 그물망 및 예비 배터리 3팩 완충 배치.<br />
                        3. <strong>정산 영수증 검토</strong>: 모듈 구입비 및 다과비 영수증 풀 첨부 완료 확인.<br />
                        4. <strong>역할 분담</strong>: 발표(김진우), 비행 시연(박성민, 최영훈), 부스 포스터 안내(이다은).
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-slate-800 bg-slate-100 p-2 text-center font-bold text-slate-800">
                        지출 내역
                      </th>
                      <td colSpan={3} className="border border-slate-800 p-2">
                        회의 다과비: 24,000원 (영수증 증빙 첨부 완료)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-center font-sans text-xs space-y-4 pt-4 border-t border-slate-300">
                <p>위와 같이 정기 회의를 진행하고 결과를 기록합니다.</p>
                <div className="flex justify-between items-center px-8 text-slate-700 font-mono">
                  <span>작성일자: 2018. 11. 15</span>
                  <span>작성자(팀장): 김진우 (인)</span>
                </div>
              </div>
            </div>
          ) : (
            /* C. [서식 1] 지원신청서 실물 A4 서식 (첨부 2 헵타베이스 화면 100% 일치 구현) */
            <div className="w-[560px] min-h-[780px] bg-white text-slate-900 shadow-2xl border border-slate-300 p-8 sm:p-10 flex flex-col justify-between select-text font-serif">
              <div>
                {/* [서식 1] 헤더 */}
                <div className="text-left text-xs font-bold text-slate-900 mb-2 font-sans">
                  [서식 1]
                </div>

                {/* 타이틀 */}
                <h1 className="text-xl font-bold text-center text-slate-950 mb-6 tracking-tight font-sans">
                  [ACE+] 창의미래설계 디딤돌 사업 지원신청서
                </h1>

                {/* 정밀 표 (첨부 2 헵타베이스 서식 완전 일치) */}
                <table className="w-full border-collapse border border-slate-800 text-xs font-sans mb-4">
                  <tbody>
                    <tr>
                      <th className="border border-slate-800 bg-slate-50 p-2 w-24 text-center font-medium text-slate-800">
                        팀명
                      </th>
                      <td colSpan={4} className="border border-slate-800 p-2 font-bold text-slate-900">
                        딥드론 (DeepDrone)
                      </td>
                    </tr>

                    <tr>
                      <th className="border border-slate-800 bg-slate-50 p-2 text-center font-medium text-slate-800">
                        지원유형
                      </th>
                      <td colSpan={4} className="border border-slate-800 p-2 text-[11px] text-slate-700">
                        ex) 학생연구, 공모전, <span className="font-bold text-indigo-700 underline">창업</span>, 사회봉사, 문화예술
                      </td>
                    </tr>

                    <tr>
                      <th className="border border-slate-800 bg-slate-50 p-2 text-center font-medium text-slate-800">
                        과제명
                      </th>
                      <td colSpan={4} className="border border-slate-800 p-2 font-semibold text-slate-900">
                        딥러닝 기반 실내외 자율주행 및 충돌회피 드론 플랫폼 개발
                      </td>
                    </tr>

                    {/* 팀장 인적사항 복합 행 */}
                    <tr>
                      <th rowSpan={2} className="border border-slate-800 bg-slate-50 p-2 text-center font-medium text-slate-800 align-middle">
                        팀장
                      </th>
                      <th className="border border-slate-800 bg-slate-50 p-1.5 w-16 text-center text-[11px]">
                        이름
                      </th>
                      <td className="border border-slate-800 p-1.5 text-center font-medium">
                        김진우
                      </td>
                      <th className="border border-slate-800 bg-slate-50 p-1.5 w-16 text-center text-[11px]">
                        연락처
                      </th>
                      <td className="border border-slate-800 p-1.5 text-[11px]">
                        전화번호: 010-1234-5678<br />
                        전자우편: deepdrone@pusan.ac.kr
                      </td>
                    </tr>

                    <tr>
                      <th className="border border-slate-800 bg-slate-50 p-1.5 text-center text-[11px]">
                        소속
                      </th>
                      <td colSpan={3} className="border border-slate-800 p-1.5 text-[11px]">
                        대학: 공과대학 &nbsp;|&nbsp; 학과(부): 전기컴퓨터공학부 &nbsp;|&nbsp; 학년: 4 &nbsp;|&nbsp; 학번: 201824201
                      </td>
                    </tr>

                    <tr>
                      <th className="border border-slate-800 bg-slate-50 p-2 text-center font-medium text-slate-800">
                        과제수행 기간
                      </th>
                      <td colSpan={4} className="border border-slate-800 p-2 text-center text-[11px]">
                        2018년 04월 01일 ~ 2018년 11월 30일 (총 8개월)
                      </td>
                    </tr>

                    {/* 과제수행 계획 요약 - 첨부 2의 노란색 강조 박스 완벽 재현 */}
                    <tr>
                      <th className="border border-slate-800 bg-slate-50 p-2 text-center font-medium text-slate-800 align-middle h-40">
                        과제수행 계획<br />요약
                      </th>
                      <td colSpan={4} className="border border-slate-800 p-3 align-top relative">
                        {/* 헵타베이스 노란색 바운딩 박스 하이라이트 */}
                        <div className="w-full h-full p-2.5 rounded-sm border-2 border-amber-400/90 bg-amber-50/40 text-[11px] leading-relaxed text-slate-800 font-sans">
                          본 과제는 실내 GPS 음영 지역에서도 비전 센서와 초음파/라이다 센서 퓨전을 통해 장애물을 자율적으로 회피하고 지정된 웨이포인트로 안정적으로 비행하는 쿼드콥터 드론 시스템을 구현하는 것을 목표로 함.
                          <br /><br />
                          1. 비전 기반 실시간 SLAM 및 위치 추정 알고리즘 탑재<br />
                          2. 3D 프린팅을 통한 경량화 기체 설계 및 충돌 완화 프레임 제작<br />
                          3. 성과발표회 현장 자율비행 시연 및 부스 전시 진행
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="border border-slate-800 bg-slate-50 p-2 text-center font-medium text-slate-800">
                        지원요청금액
                      </th>
                      <td colSpan={4} className="border border-slate-800 p-2 font-mono font-bold text-slate-900">
                        3,500,000 원
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 첨부 서류 안내 */}
                <div className="text-[11px] text-slate-700 font-sans space-y-0.5 mb-6 pl-1">
                  <p>※ 붙임 : 1. [서식 1-1]의 팀 활동계획서 1부</p>
                  <p className="pl-9">2. 통장사본 1부</p>
                </div>
              </div>

              {/* 하단 결재/제출 선언문 */}
              <div className="text-center font-sans space-y-4 pt-2">
                <p className="text-xs text-slate-900 font-medium">
                  위와 같이 부산대학교 창의미래설계 디딤돌 사업 지원신청서를 제출합니다.
                </p>

                <p className="text-xs text-slate-800 font-mono tracking-widest my-3">
                  2018 년 &nbsp; 04 월 &nbsp; 05 일
                </p>

                <div className="flex justify-end items-center pr-6 text-xs text-slate-900 font-sans">
                  <span>제출자 : 팀장 김진우 (서명/인)</span>
                </div>

                <h2 className="text-base font-bold tracking-widest text-slate-950 pt-3">
                  부산대학교 ACE사업단장 귀하
                </h2>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
