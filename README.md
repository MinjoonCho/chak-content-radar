# CHAK Content Radar + Card News Generator

한국 수험생/고등학생 콘텐츠를 위한 CHAK 내부 마케팅 툴입니다. Radar에서 주제 신호를 확인하고, 출처 상태를 유지한 채 1080×1350 카드뉴스 초안을 만들고, 편집·PNG 다운로드·Archive 저장까지 이어집니다.

## 바로 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 연결 설정 없이도 직접 주제로 빠른 초안을 만들고 편집·저장·내보내기할 수 있습니다. Radar는 연결된 공급자에서 수집한 원문과 링크를 표시합니다.

## 환경변수

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
PEXELS_API_KEY=
UNSPLASH_ACCESS_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
YOUTUBE_API_KEY=
INSTAGRAM_ACCOUNT_ID=
INSTAGRAM_ACCESS_TOKEN=
META_GRAPH_VERSION=v22.0
N8N_WEBHOOK_URL=
```

- `GEMINI_API_KEY`: 입력하면 `/api/generate`가 JSON schema를 강제한 Gemini 생성으로 전환됩니다.
- `PEXELS_API_KEY`: 입력하면 카드 편집기에서 한국어 검색어로 세로 이미지 후보를 가져옵니다.
- `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`, `YOUTUBE_API_KEY`: 해당 Radar 공급자를 활성화합니다.
- `INSTAGRAM_ACCOUNT_ID`/`INSTAGRAM_ACCESS_TOKEN`: `config/watch_accounts.yaml`에 검수 계정이 있을 때 게시물·릴스와 공개 반응을 수집합니다.
- `N8N_WEBHOOK_URL`: 게시 준비 검수를 통과한 프로젝트를 사용자가 명시적으로 전달할 때만 호출합니다.
- 키는 서버 Route Handler에서만 읽고 브라우저 번들에 포함하지 않습니다.

## 구현 범위

- **Radar**: Google News RSS와 설정된 Naver·YouTube·Instagram API에서 실제 원문 수집, 주제 군집화, 코드 기반 점수, 공식 원문 배지, 검색
- **근거 링크**: 화면의 근거 수는 실제로 열 수 있는 URL 개수에서 계산하며, 한 신호에 여러 링크를 표시
- **Instagram 탐색**: 감시 계정의 실제 게시물·릴스와 공개 좋아요·댓글을 수집하고, 서로 다른 원문 두 개 이상에서 반복된 설명 가능한 포맷만 Format Radar에 표시
- **Generate**: 콘텐츠 유형, 템플릿 A–D, 장수, 이미지 밀도, structured generation, 글자 수 제한
- **Editor**: 1080×1350 자유 캔버스, 텍스트·이미지·도형 레이어, 직접 이동·크기·회전, 글꼴·정렬·색상·자르기, 실행 취소, 캡션·해시태그, 검수 체크리스트, PNG/ZIP/n8n
- **Archive**: IndexedDB 자동 저장, 정확한 프로젝트 재개, 검색·필터·삭제 취소, `.chak` 가져오기/내보내기
- **Safety**: 입시·일정·규정성 주제의 공식 출처 미확인 상태를 `needs_review`로 강제
- **Design**: `design/tokens.ts`에 CHAK 토큰을 분리하고 네 템플릿이 같은 토큰을 사용

## 주요 구조

```text
app/
  radar/                 Topic / Format Radar
  generate/              생성 설정과 편집기
  archive/               브라우저 로컬 아카이브
  api/generate/           구조화된 문구 생성 + 빠른 초안
  api/images/search/      Pexels 공급자 어댑터
  api/render/             공통 SVG 기반 1080×1350 PNG와 ZIP
components/               앱 셸, 공통 카드 캔버스, 생성·검수 워크스페이스
config/watch_accounts.yaml
design/tokens.ts
lib/                      타입, 장면 모델, 생성·저장 규칙
```

## 저장과 공유 방식

- 프로젝트·업로드 이미지·Radar 마지막 결과는 현재 브라우저 프로필의 IndexedDB에만 저장됩니다. 계정이나 팀 공용 서버 저장소는 없습니다.
- 다른 브라우저/팀원과 공유할 때는 `.chak` 파일을 내보내고 Archive에서 가져옵니다. 가져오기는 기존 ID를 덮지 않고 복사본을 만듭니다.
- 브라우저가 닫혀 있을 때 자동 수집은 실행되지 않습니다. 화면이 열린 동안 `끔/30분/1시간/3시간` 간격을 선택할 수 있습니다.
- 서버 API는 무상태이며 외부 키를 서버에서만 사용합니다. 원문 추출은 사설망 URL, 리다이렉트, 과대 응답을 거부합니다.

Instagram은 설정한 감시 계정의 게시물·릴스만 수집합니다. 인증이 없거나 검수 계정이 비어 있는 공급자는 `설정 필요`로 표시됩니다. 공개 반응 지표가 없는 원문은 반응 점수를 `데이터 없음`으로 표시합니다.

## 검증

```bash
npm run typecheck
npm test
npm run build
```
