# AGENTS.md

## Operational Commands

패키지 매니저와 런타임은 `bun` 고정이다. npm/yarn/pnpm 사용 금지.

```bash
bun install            # 의존성 설치
bun run dev            # API 서버(:3002) + Vite(:5173) 동시 실행
bun run server         # API 서버만 실행 (bun --watch)
bun run test           # vitest run (src/**, server/** 테스트)
bun run test:watch     # vitest watch
bun run lint           # eslint .
bun run build          # tsc -b && vite build
```

- 테스트는 반드시 `bun run test`로 실행한다. `bun test`는 Bun 내장 러너를 호출하며 jsdom/setup 설정(`vite.config.ts:17-22`)을 거치지 않아 실패한다.
- 변경 후 최소 `bun run lint`와 `bun run test`를 통과시킨다. 프론트엔드 변경은 `bun run build`도 확인한다.

## Golden Rules

### Immutable

- 실제 API 키를 코드, 테스트, 커밋에 넣지 않는다. 키는 `.env`(gitignore 대상, `.gitignore`)에만 둔다.
- 서버 환경변수 키 값을 클라이언트 응답에 실어 보내지 않는다. `/api/config`는 `!!ENV_KEYS.x` 불리언만 반환한다(`server/index.ts:147-157`). 이 형태를 유지한다.
- `.env`를 읽거나 출력하지 않는다. 값이 필요하면 키 이름만 확인한다.

### 프로젝트 고유 규칙 (코드 근거)

- **Hard Constraint: 생성 코드는 `render(<Name />)` 호출로 끝나야 한다.** `LivePreview`가 react-live `noInline`으로 실행하므로(`src/components/LivePreview.tsx:11`) render 호출이 없으면 미리보기가 그려지지 않는다. 서버가 `ensureRenderCall`로 보정하지만(`server/generator.ts:16-24`) 시스템 프롬프트의 형식 지시(`server/index.ts:12`)도 함께 유지한다. 둘 중 하나만 바꾸지 않는다.
- **Hard Constraint: 생성 코드는 import 없는 순수 JavaScript다.** react-live 스코프에서 React는 전역이고 TypeScript 문법은 실행되지 않는다(`server/index.ts:11`, `server/index.ts:20`). 시스템 프롬프트를 수정할 때 이 두 규칙을 지운다면 미리보기가 깨진다.
- **Double Defense: 코드펜스 제거.** 프롬프트로 펜스를 금지하면서(`server/index.ts:16`) 응답 후처리로도 제거한다(`server/generator.ts:5-10`). 한쪽만 남기지 않는다.
- **Asymmetry: 프로바이더 간 방어 수준이 다르다.** Google만 모델 폴백(`server/index.ts:134-136`)과 `MAX_TOKENS` 절단 검사(`server/index.ts:123-125`)가 있고, Anthropic 경로(`server/index.ts:68-96`)에는 없다. 이는 의도된 차이인지 미해결 격차인지 코드로 알 수 없으므로, 한쪽을 수정할 때 다른 쪽에 같은 처리가 필요한지 사용자에게 확인한다.
- **Test Boundary: 순수 함수만 테스트되어 있다.** 테스트 대상은 `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`뿐이다. 서버 라우팅/프로바이더 호출(`server/index.ts`), `useComponentGenerator`, `App.tsx`에는 테스트가 없다. 새 로직은 `server/index.ts`에 직접 쓰지 말고 `generator.ts`/`fallback.ts`처럼 부수효과 없는 모듈로 분리해 테스트를 붙인다(`server/generator.ts:1-2`가 이 분리의 의도를 명시한다).
- **Hard Constraint: `server/`는 타입 체크 대상이 아니다.** `tsconfig.app.json`은 `src`만, `tsconfig.node.json`은 `vite.config.ts`만 include한다. `bun run build`가 통과해도 `server/*.ts`의 타입 오류는 잡히지 않는다. 서버 변경 시 타입은 직접 주의하고 테스트로 동작을 검증한다.
- **Duplication: `Provider` 타입이 두 곳에 있다.** `server/index.ts:57`와 `src/types/index.ts:1`. 프로바이더를 추가/삭제하면 두 곳과 `ENV_KEYS`, `PROVIDER_CONFIG`(`src/App.tsx:9-12`)를 함께 수정한다.

### Do's and Don'ts

- Do: UI 문자열, 에러 메시지, 테스트 설명은 기존처럼 한국어로 작성한다.
- Do: 프론트엔드는 `/api/*` 상대 경로로만 호출한다. 개발 시 Vite 프록시가 `localhost:3002`로 전달한다(`vite.config.ts:9-14`). 서버 포트를 바꾸면 프록시도 같이 바꾼다.
- Do: 테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 둔다(`vite.config.ts:21`의 include 패턴).
- Don't: 서버 파일에서 `src/`를 import하거나 그 반대로 import하지 않는다. 공유 코드가 없는 구조이며 `server/`는 Bun, `src/`는 브라우저 환경이다.
- Don't: `erasableSyntaxOnly`가 켜져 있으므로 `enum`, `namespace`, 파라미터 프로퍼티를 쓰지 않는다(`tsconfig.app.json:23`).

## Project Context

프롬프트로 React 컴포넌트를 생성하고 실시간 미리보기와 코드를 제공하는 웹 앱.

- Stack: React 19, TypeScript, Vite 8, react-live, Bun(서버/패키지 매니저), Vitest, ESLint 9

## Standards and References

- 설치/실행/기능 설명은 `README.md`를 따른다. `README.md`가 언급하는 `.env.example`은 저장소에 없으며, 로컬 `.env`에 `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`를 둔다.
- 커밋: 한국어 `type: 요약` 형식, type은 `feat`, `fix`, `refactor`, `chore` 중 선택. 요약은 50자 내외, 마침표 없음. 푸시는 사용자가 요청할 때만 한다.
- `.claude/skills/commit` 스킬이 커밋 절차를 정의한다. 커밋 요청 시 이를 따른다.

## Maintenance Policy

이 파일의 규칙과 실제 코드 사이에 괴리(파일 이동, 라인 변경, 규칙 위반 사례)를 발견하면 작업을 마친 뒤 AGENTS.md 업데이트를 사용자에게 제안한다. 근거 라인 번호는 코드 변경 시 어긋날 수 있으므로 인용된 파일과 심볼 이름을 기준으로 다시 확인한다.
