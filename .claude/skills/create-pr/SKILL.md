---
name: create-pr
description: |
  현재 브랜치의 커밋을 분석해 GitHub Pull Request를 생성한다. 서브 에이전트(fork)에서 실행되어 메인 대화를 오염시키지 않는다.
  프로젝트 언어를 판별해 한국어 또는 영문 PR 템플릿(references/)을 자동 선택한다. 해외 오픈소스는 영문, 국내 프로젝트는 한국어를 쓴다.
  "PR 만들어줘", "PR 생성", "풀리퀘스트 올려줘", "create pr", "open a PR", "make a pull request", "/create-pr" 같은 요청에 반드시 이 스킬을 사용한다.
  사용자가 "이 브랜치 올려줘", "리뷰 요청할 수 있게 해줘"처럼 PR이라는 단어 없이 요청해도, 작업이 끝난 브랜치를 리뷰에 올리려는 의도면 사용한다.
  `--lang ko|en`으로 언어를, `--draft`로 초안 PR을, `--base <branch>`로 대상 브랜치를 지정할 수 있다.
argument-hint: "[--lang ko|en] [--draft] [--base <branch>]"
context: fork
agent: general-purpose
allowed-tools: Bash(git *), Bash(gh *), Read, Grep, Glob
---

# create-pr: 브랜치 분석 → 언어 판별 → PR 생성

현재 브랜치의 변경을 분석해 PR 제목과 본문을 작성하고 GitHub에 PR을 만든다.

이 스킬은 `context: fork`로 서브 에이전트에서 실행된다. 서브 에이전트는 사용자에게 질문할 수 없으므로 중간에 묻지 않고 끝까지 진행한다. 판단이 모호하면 아래에 정해 둔 안전한 기본값을 쓰고, 어떤 선택을 했는지 마지막 보고에 남긴다. 메인 대화는 마지막 보고만 받는다.

## 인자

| 인자 | 의미 | 기본값 |
|------|------|--------|
| `--lang ko\|en` | 템플릿 언어 강제 지정 | 자동 판별 |
| `--draft` | 초안 PR로 생성 | 일반 PR |
| `--base <branch>` | PR 대상 브랜치 | 저장소 기본 브랜치 |

## 워크플로우

### Step 1: 사전 점검

아래를 병렬로 실행해 상태를 파악한다.

```bash
git branch --show-current
git status --short
gh repo view --json nameWithOwner,defaultBranchRef,isFork,parent,visibility
gh auth status
```

다음 경우에는 PR을 만들지 않고 이유와 해결 방법을 보고하며 종료한다. 억지로 진행하면 잘못된 PR이 남기 때문이다.

- 현재 브랜치가 대상(base) 브랜치와 같다. PR은 브랜치 간 차이로 만들어진다. 작업 브랜치를 먼저 만들라고 안내한다.
- base 대비 커밋이 0개다.
- `gh` 인증이 안 되어 있다.
- 이미 같은 head 브랜치로 열린 PR이 있다 (`gh pr list --head <branch> --state open`). 기존 PR URL을 알려 준다.

커밋되지 않은 변경(`git status`에 항목이 있음)은 PR에 들어가지 않는다. 대신 커밋하지 않고 진행하되, 최종 보고에 "미커밋 변경 N개는 PR에 포함되지 않음"을 경고로 남긴다. 사용자의 작업물을 임의로 커밋하면 의도치 않은 내용이 공개될 수 있다.

### Step 2: 변경 분석

base 브랜치는 `--base` 값, 없으면 저장소 기본 브랜치다. fork 저장소라면 upstream(parent)이 아니라 현재 저장소의 기본 브랜치를 기본값으로 쓴다. upstream으로 보내려면 사용자가 `--base`와 별도 요청으로 명시해야 한다.

```bash
git fetch origin <base>            # 실패해도 로컬 ref로 계속 진행
git log --oneline origin/<base>..HEAD
git diff --stat origin/<base>...HEAD
git diff origin/<base>...HEAD      # 큰 경우 파일별로 나눠 읽는다
```

- 커밋 메시지는 의도를, diff는 실제 변경을 보여 준다. 둘이 어긋나면 diff를 믿는다.
- 변경 내용에 없는 것은 쓰지 않는다. 추측으로 목적이나 효과를 지어내면 리뷰어를 오도한다.
- 테스트 파일 변경 여부, 설정/의존성 변경, 공개 API 변경 여부를 확인해 템플릿의 해당 항목에 반영한다.
- 비밀 정보(`.env`, 키, 토큰)가 diff에 들어 있으면 PR을 만들지 않고 보고한다. 공개 저장소에 올라가면 회수할 수 없다.

### Step 3: 템플릿 언어 판별

우선순위 순서대로 적용하고 처음 결정되는 규칙에서 멈춘다.

1. **명시 지정:** `--lang`이 있으면 그 값을 쓴다.
2. **저장소 자체 PR 템플릿:** `.github/PULL_REQUEST_TEMPLATE.md` (또는 `.github/PULL_REQUEST_TEMPLATE/`, 루트의 `pull_request_template.md`)가 있으면 그 구조를 따라 채운다. 이 경우 `references/` 템플릿은 쓰지 않는다. 저장소 관리자가 정한 형식이 우선이다.
3. **프로젝트 언어 신호:** 아래 신호를 모아 한글 비중으로 판단한다.
   - 최근 커밋 메시지 제목 10개 (`git log -10 --format=%s`)
   - 최근 PR 제목 (`gh pr list --state all --limit 10 --json title`)
   - `README.md` 첫 40줄, `CONTRIBUTING.md` 존재 및 언어
   - 신호 중 과반이 한글이면 `ko`, 과반이 영문이면 `en`.
4. **판단 불가(신호가 없거나 반반):** 한국어를 기본값으로 쓰고 보고에 "언어 신호 부족으로 ko 기본값 적용"이라고 남긴다.

해외 오픈소스는 보통 커밋, PR, README가 영문이라 규칙 3에서 `en`이 되고, 국내 프로젝트는 `ko`가 된다. 저장소 소유자 이름이나 국적으로 추정하지 않는다. 신호가 불확실하고 틀리기 쉽기 때문이다.

판별 후 해당 파일을 읽는다.

- 한국어: `references/pr-template-ko.md`
- 영문: `references/pr-template-en.md`

### Step 4: 제목과 본문 작성

- 제목은 템플릿의 규칙을 따른다. 70자 이내로 쓰고 마침표를 붙이지 않는다.
- 저장소의 기존 커밋 컨벤션(`type: 요약` 등)이 보이면 PR 제목도 같은 형식을 쓴다.
- 템플릿의 모든 섹션을 채운다. 해당 사항이 없는 섹션은 지우지 말고 "해당 없음"(en: "N/A")으로 남겨 리뷰어가 누락이 아님을 알 수 있게 한다.
- 이슈 번호가 브랜치명이나 커밋 메시지에 있으면 `Closes #N` 형태로 연결한다. 없는 번호를 만들지 않는다.
- 테스트 체크리스트는 실제로 확인한 것만 체크한다. 실행하지 않은 테스트를 통과했다고 쓰지 않는다. 확인이 필요하면 `package.json` 등에서 테스트 명령을 찾아 실행해도 된다.
- 본문은 파일로 저장하지 않고 `--body-file -`나 HEREDOC으로 전달해 임시 파일이 저장소에 남지 않게 한다.

### Step 5: push 및 PR 생성

현재 브랜치가 원격에 없거나 뒤처져 있으면 push한다. PR 생성에 필수인 동작이고, 이 스킬을 호출한 것이 PR 생성에 대한 사용자의 요청이기 때문이다.

```bash
git push -u origin <branch>

gh pr create \
  --base <base> \
  --head <branch> \
  --title "<제목>" \
  --body "$(cat <<'EOF'
<본문>
EOF
)" \
  [--draft]
```

- `--force`, `--force-with-lease` push는 하지 않는다. push가 거부되면 원인을 보고하고 종료한다.
- push나 `gh pr create`가 네트워크 오류로 실패하면 한 번만 재시도하고, 그래도 실패하면 오류 전문과 함께 보고한다. 같은 명령을 반복해 두들기지 않는다.
- 시스템 컨텍스트에 PR attribution 지침이 있으면 본문 끝에 따른다.
- 라벨, 리뷰어, 머지는 건드리지 않는다. 요청받지 않은 일이다.

### Step 6: 최종 보고

메인 대화에 돌아가는 유일한 출력이다. 간결하게 아래를 포함한다.

- PR URL, 제목, base ← head
- 선택한 템플릿 언어와 그 근거 (예: "ko, 최근 커밋 10개 중 10개가 한글")
- 경고 (미커밋 변경, 언어 기본값 적용, 이슈 연결 없음 등)
- PR을 만들지 않았다면 사유와 해결 방법

## 하지 말아야 할 것

- 사용자 확인을 기다리며 멈추지 않는다. fork에서는 대답을 받을 수 없다.
- 미커밋 변경을 임의로 커밋하거나 stash하지 않는다.
- force push, 브랜치 삭제, 다른 PR 수정을 하지 않는다.
- 비밀 정보로 의심되는 변경이 있는 상태로 PR을 만들지 않는다.
- 한 PR에 두 언어를 섞어 쓰지 않는다. 코드 식별자와 고유명사만 원문을 허용한다.
