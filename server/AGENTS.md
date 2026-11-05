# server/AGENTS.md

## Module Context

Bun 런타임에서 실행되는 AI API 프록시 서버. `index.ts`가 `Bun.serve`로 라우팅과 프로바이더 호출을 담당하고, `generator.ts`와 `fallback.ts`는 부수효과 없는 순수 함수 모듈이다.

## Tech Stack and Constraints

- 런타임은 Bun이다. 서버 코드에서 `Bun.serve`, `process.env`, 전역 `fetch`를 사용한다. 외부 HTTP 클라이언트(axios 등)나 Express 같은 프레임워크를 추가하지 않는다.
- 서버 라우트는 `/api/config`(GET), `/api/generate`(POST) 둘뿐이며 포트는 3002다(`index.ts:138-139`). 포트 변경 시 `vite.config.ts`의 프록시도 수정한다.
- 모든 응답에 `CORS_HEADERS`를 붙인다. 새 응답 분기를 추가할 때 헤더를 빠뜨리지 않는다(`index.ts:51-55`).

## Implementation Patterns

- 프로바이더 호출은 `callAnthropic`, `callGoogleModel` 형태로 "프롬프트와 키를 받아 텍스트를 반환"하는 함수로 만든다. 응답 정규화는 호출 함수 안에서 하지 않고 라우트에서 `ensureRenderCall(stripCodeFences(text))`로 한 번만 한다(`index.ts:188`).
- 에러 분류는 에러 메시지 문자열의 `'503'`, `'429'` 포함 여부로 한다(`index.ts:194-206`). 새 프로바이더 에러는 `Xxx API error: ${status}` 형식을 지켜 이 분기에 걸리도록 한다.
- 순수 로직은 `generator.ts`/`fallback.ts`처럼 별도 파일로 두고 같은 이름의 `*.test.ts`를 옆에 둔다.

## Testing Strategy

```bash
bun run test server    # server/** 테스트만 실행 (vitest, 프로젝트 루트에서)
```

- `bun test`를 쓰지 않는다. vitest의 `describe/it/expect`를 `vitest`에서 import한다(`generator.test.ts:1`).
- `index.ts`는 import 시점에 `Bun.serve`가 실행되는 부수효과 모듈이라 테스트에서 import하지 않는다. 테스트가 필요한 로직은 순수 모듈로 분리한다.

## Local Golden Rules

- Security Boundary: Google 호출은 API 키를 URL 쿼리(`?key=`)에 넣는다(`index.ts:99`). 이 URL을 로그, 에러 메시지, 응답에 출력하지 않는다. 현재 에러 메시지는 상태 코드만 담으며(`index.ts:112`), 이를 유지한다.
- Security Boundary: 키 우선순위는 클라이언트 입력 키, 그다음 서버 환경변수다(`index.ts:64-66`). 환경변수 키 값은 `/api/config` 불리언 이외의 경로로 클라이언트에 노출하지 않는다.
- Do: 새 Google 모델은 `GOOGLE_MODELS`에 우선순위 순서로 추가한다. 앞 모델 실패 시 다음 모델로 폴백하고 모두 실패하면 마지막 에러를 던진다(`index.ts:5`, `fallback.ts:3-20`). 단일 모델 호출로 되돌리지 않는다.
- Don't: `MAX_TOKENS` 절단 에러는 사용자 안내 문구다(`index.ts:123-125`). 폴백이 이를 삼키지 않도록 `withModelFallback`의 "마지막 에러 전파" 동작을 유지한다(`fallback.test.ts`가 이를 검증한다).
- Don't: `SYSTEM_PROMPT`(`index.ts:7-49`)의 "import 금지", "TypeScript 문법 금지", "`render(...)` 호출로 끝낼 것" 지시를 제거하지 않는다. 클라이언트 미리보기 실행 방식과 직결된다(루트 AGENTS.md 참고).
