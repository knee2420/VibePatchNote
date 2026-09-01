# VibePatchNote

React, TypeScript, Vite, ShadCN UI 프론트엔드와 FastAPI 백엔드로 구성된 풀스택 프로젝트입니다.

---

## 📁 프로젝트 구조

```text
VibePatchNote/
├── frontend/                # React + TypeScript + Vite + ShadCN UI (Tailwind CSS v4)
│   ├── src/
│   │   ├── components/ui/   # ShadCN UI 컴포넌트 (Button, Card, Input, Badge 등)
│   │   ├── lib/             # 유틸리티 (cn 등)
│   │   ├── App.tsx          # 메인 애플리케이션 화면 (백엔드 연동 테스트 포함)
│   │   ├── index.css        # Tailwind CSS 및 ShadCN 테마 스타일
│   │   └── main.tsx
│   ├── components.json      # ShadCN UI 설정 파일
│   ├── package.json
│   └── vite.config.ts       # Vite 설정 (Path alias: @/*, Tailwind Vite Plugin)
│
├── backend/                 # FastAPI + Python 백엔드
│   ├── venv/                # Python 가상환경
│   ├── main.py              # FastAPI 메인 진입점 (CORS 및 헬스체크 API)
│   └── requirements.txt     # Python 패키지 의존성 목록
│
├── .gitignore               # 통합 Git 무시 목록
└── README.md
```

---

## 🚀 실행 가이드

### 1. 백엔드 (FastAPI) 실행

```powershell
cd backend
# 가상환경 활성화 및 Uvicorn 실행
.\venv\Scripts\uvicorn main:app --reload --port 8000
```
- **API 서버 주소**: `http://localhost:8000`
- **Swagger API 문서**: `http://localhost:8000/docs`
- **헬스체크 엔드포인트**: `http://localhost:8000/api/health`

---

### 2. 프론트엔드 (React + Vite) 실행

```powershell
cd frontend
# 개발 서버 실행
npm run dev
```
- **프론트엔드 로컬 주소**: `http://localhost:5173`

---

## 🎨 ShadCN UI 컴포넌트 추가 방법

새로운 ShadCN 컴포넌트가 필요할 때는 `frontend` 디렉토리에서 아래 명령어로 간편하게 추가할 수 있습니다:

```powershell
cd frontend
npx shadcn@latest add [컴포넌트이름]
# 예: npx shadcn@latest add dialog dropdown-menu table
```
