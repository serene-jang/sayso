# AGENT.md — SAYSO 개발 가이드

이 문서는 SAYSO 프로젝트에서 작업하는 AI 코딩 에이전트/개발자를 위한 규칙과 컨텍스트를 정의한다.
자세한 제품 요구사항은 [prd.md](prd.md) 참고.

## 프로젝트 개요
SAYSO는 상대방·상황에 맞는 메시지/이메일을 작성하고, 보내기 전 검사·개선하는
커뮤니케이션 특화 AI 웹앱이다. 핵심 흐름: **작성 → 검사 → 개선 → 관리**.

## 기술 스택 (고정)
- 프론트엔드: 순수 HTML/CSS/JavaScript (빌드 도구 없음, 프레임워크 임의 도입 금지)
- 백엔드: Node.js + Express (AI API 프록시 전용, 최소 구성)
- AI: OpenAI API (또는 호환 API), 서버에서만 호출
- 데이터 저장: MVP는 `localStorage` (대화 관리), 서버 DB 없음

## 폴더 구조 (권장)
```
SAYSO/
  prd.md
  AGENT.md
  server/
    index.js          # Express 서버, /api/* 라우트
    routes/
      generate.js
      inspect.js
      refine.js
    lib/
      aiClient.js      # AI API 호출 래퍼
      prompts.js       # 프롬프트 템플릿
    .env               # 절대 커밋 금지
    .env.example
  public/
    index.html
    css/
      style.css
    js/
      app.js           # 라우팅/화면 전환
      home.js
      compose.js
      result.js
      inspect.js
      contacts.js
      api.js           # fetch 래퍼
      storage.js       # localStorage 래퍼
  package.json
  .gitignore
```

## 개발 원칙 (반드시 준수)
1. **기존 코드 삭제 금지** — 기존 기능을 함부로 삭제하지 않는다.
2. **기존 기능 보호** — 새 기능 추가 시 기존 기능이 깨지지 않도록 한다.
3. **실제 동작 우선** — 버튼은 실제로 동작해야 한다. 화면만 만들어놓지 않는다.
4. **로딩/오류 처리 필수** — 모든 비동기(AI 호출) 동작에 로딩 상태와 사용자 친화적 오류 메시지를 구현한다.
5. **반응형 필수** — 모바일/태블릿/PC 모두 자연스럽게 동작해야 한다.
6. **API 키 보안** — API 키는 절대 프론트엔드 코드나 클라이언트로 전송되는 응답에 노출하지 않는다. `.env`는 서버에서만 읽고 `.gitignore`에 포함한다.
7. **과잉 구현 금지** — 요청되지 않은 기능을 임의로 추가하지 않는다. 디자인보다 실제 사용 흐름과 완성도를 우선한다.

## AI 동작 원칙 (프롬프트 설계 시 반드시 반영)
1. **의도 보존**: 사용자가 말하지 않은 사실(이유, 배경 등)을 임의로 만들어내지 않는다.
2. **과도한 격식 금지**: 모든 문장을 딱딱한 비즈니스 문체로 획일화하지 않는다. 관계·상황에 맞는 자연스러운 수준을 사용한다.
3. **불확실한 정보 표시**: 날짜/시간/이름 등 필요한 정보가 없으면 임의로 채우지 않고, 응답에 `missingInfo`로 명시해 사용자에게 알린다.
4. **사용자 말투 유지**: 원문의 어조와 의도를 최대한 보존하며 필요한 부분만 개선한다.

## API 계약 (서버)
- `POST /api/generate` — `{ recipient, situation, purpose, message, tone }` → `{ versions: [{label, text}], missingInfo? }`
- `POST /api/inspect` — `{ text }` → `{ status: {natural, info, politeness, ambiguity}, issues: [{category, quote, reason, suggestion}] }`
- `POST /api/refine` — `{ text, direction }` → `{ text }`

모든 라우트는:
- 입력 검증 (필수 필드 누락 시 400 응답)
- AI 호출 실패 시 502/500과 함께 `{ error: "사용자 친화적 한국어 메시지" }` 반환
- API 키는 `process.env`에서만 읽음

## 환경변수
`.env` (서버 루트, 커밋 금지):
```
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=sayso-gpt
AZURE_OPENAI_API_VERSION=2024-10-21
PORT=3000
```
`.env.example`은 값 없이 키만 제공하여 커밋한다.

## 화면 목록 (SPA, index.html 내 화면 전환)
1. 홈
2. 작성 화면 (상대방/상황/목적/말투 입력)
3. AI 결과 화면 (3버전: 추천/부드러운 표현/정중한 표현)
4. 검사 화면 (신호등 상태 + 상세 이슈)
5. 대화 관리 화면 (상대방별 리스트/상세)

## 개발 순서 (STEP)
1. 서버 뼈대 + 환경변수 구성
2. 홈 화면
3. 작성 화면 + 입력 폼
4. `/api/generate` 연결
5. AI 결과 화면
6. `/api/inspect` + 검사 화면
7. `/api/refine` + 개선 흐름
8. 복사 기능
9. 대화 관리 (localStorage)
10. 반응형/로딩/에러 처리 전체 점검
11. 최종 QA

## 디자인 톤
- 과도한 장식 금지, 충분한 여백, 둥근 카드 UI, 명확한 버튼, 읽기 쉬운 글자, 일관된 간격
- 전문적이지만 딱딱하지 않은 분위기

## 작업 시 체크리스트
- [ ] API 키가 프론트엔드나 응답에 노출되지 않는가?
- [ ] 로딩 상태가 구현되었는가?
- [ ] 오류 발생 시 한국어로 이해하기 쉬운 메시지를 보여주는가?
- [ ] 모바일 화면에서 레이아웃이 깨지지 않는가?
- [ ] 기존 기능이 그대로 동작하는가?
- [ ] AI가 사실을 임의로 지어내지 않는가?
