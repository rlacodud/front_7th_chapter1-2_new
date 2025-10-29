# AI Agent 자동화 시스템

> 전체 스택 TDD 워크플로우 자동화

## 🚀 빠른 시작

### 1. 환경 변수 설정

루트 디렉토리에 `.env` 파일을 생성하고 API 키를 설정하세요:

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LOG_LEVEL=info
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 워크플로우 실행

```bash
# 전체 워크플로우 실행 (RED → GREEN → REFACTOR → COMMIT)
pnpm agent:run

# 상태 확인
pnpm agent:status

# 워크플로우 초기화
pnpm agent:reset
```

---

## 📁 디렉토리 구조

```
automation/
├── types.ts                    # TypeScript 타입 정의
├── run.ts                      # 메인 실행 파일
├── status.ts                   # 상태 확인 스크립트
├── reset.ts                    # 초기화 스크립트
├── core/
│   ├── orchestrator.ts         # 워크플로우 오케스트레이터
│   ├── workflow-manager.ts     # 단계 관리
│   └── event-emitter.ts        # 이벤트 시스템
├── agents/
│   ├── base-agent.ts           # Agent 베이스 클래스
│   ├── spec-agent.ts           # SpecAgent 구현
│   ├── test-agent.ts           # TestAgent 구현
│   ├── code-agent.ts           # CodeAgent 구현
│   ├── refactor-agent.ts       # RefactorReviewAgent 구현
│   └── git-agent.ts            # GitAgent 구현
└── utils/
    ├── config-loader.ts        # YAML 설정 로더
    ├── ai-client.ts            # AI API 클라이언트
    ├── file-manager.ts         # 파일 읽기/쓰기
    ├── status-tracker.ts       # 상태 추적
    ├── command-runner.ts       # 명령어 실행
    └── logger.ts               # 로거
```

---

## 🔧 사용 방법

### 기본 워크플로우

```bash
# 1. 요구사항 파일 준비
# docs/requirements.md에 기능 요구사항 작성

# 2. 워크플로우 실행
pnpm agent:run

# 3. 진행 상황 모니터링
# - 터미널에서 실시간 로그 확인
# - state/workflow-status.json에서 상태 확인
# - logs/에서 상세 로그 확인

# 4. COMMIT 단계에서 대화형 승인
# ⏸️  RED 단계 커밋 승인 요청
# 이 커밋을 실행하시겠습니까? (y/n): y  ← 사용자 입력
# origin/main로 푸시하시겠습니까? (y/n): n  ← 사용자 입력

# 5. 결과 확인
# - docs/spec.md: 생성된 명세
# - src/__tests__/: 생성된 테스트
# - src/: 구현된 코드
# - docs/test-guides/execution-log.md: 품질 평가 로그
```

### 대화형 커밋/푸시 데모

```bash
# GitAgent 대화형 승인 프로세스 테스트
pnpm agent:commit

# 실행 결과:
# 1. RED, GREEN, REFACTOR 각 단계의 커밋 메시지 표시
# 2. 변경된 파일 목록 표시
# 3. 각 커밋마다 승인 요청 (y/n)
# 4. 마지막 커밋 후 푸시 승인 요청 (y/n)
# 5. 거부 시 수동 커밋/푸시 안내
```

### 단계별 실행

```typescript
// automation/run.ts에서 단계 지정
const result = await orchestrator.run({
  startStage: 'RED',
  endStage: 'GREEN',
  skipStages: [],
});
```

---

## 📊 워크플로우 단계

| 단계         | Agent         | 입력             | 출력                           |
| ------------ | ------------- | ---------------- | ------------------------------ |
| **SPEC**     | SpecAgent     | requirements.md  | spec.md, test-scope.json       |
| **RED**      | TestAgent     | spec.md          | \*.spec.ts (failing tests)     |
| **GREEN**    | CodeAgent     | tests + failures | implementation                 |
| **REFACTOR** | RefactorAgent | code + tests     | execution-log.md, improvements |
| **COMMIT**   | GitAgent      | execution-log    | git commits                    |

---

## 🤖 Agent 설정

각 Agent는 `config/agent-config.yml`에서 설정:

```yaml
agents:
  spec_agent:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.2
    max_tokens: 4000
```

Agent 프롬프트는 `docs/test-guides/prompt-templates.md`에서 자동 로드됩니다.

---

## 📝 상태 추적

워크플로우 상태는 `state/workflow-status.json`에 실시간 기록:

```json
{
  "current_phase": {
    "name": "GREEN",
    "status": "in_progress",
    "progress_percent": 65
  },
  "quality_metrics": {
    "coverage": {
      "statements": 87
    }
  }
}
```

---

## ⚙️ 고급 설정

### 재시도 정책

```yaml
error_handling:
  retry_strategy: 'exponential_backoff'
  max_retries: 3
```

### 병렬 실행

```yaml
performance:
  parallel_execution:
    enabled: true
    max_concurrent_agents: 2
```

### 품질 게이트

```yaml
workflow:
  quality_gates:
    coverage_min: 80
    mutation_min: 70
```

---

## 🔍 트러블슈팅

### Agent 실행 실패

```bash
# 로그 확인
cat logs/orchestrator.log

# 상태 확인
pnpm agent:status

# 워크플로우 초기화 후 재시도
pnpm agent:reset
pnpm agent:run
```

### API 제한

- OpenAI: RPM (Requests Per Minute) 제한
- Anthropic: TPM (Tokens Per Minute) 제한

환경 변수로 조절:

```bash
TIMEOUT_SECONDS=180
MAX_RETRIES=5
```

---

## 🔒 안전 장치

### 2단계 승인 프로세스

GitAgent는 **메시지만 생성**하고, 실제 Git 작업은 **사용자 승인 후 실행**됩니다:

1. **커밋 승인**: 커밋 메시지 + 변경 파일 확인 후 `y/n`
2. **푸시 승인**: 원격 저장소 푸시 여부 최종 확인 `y/n`

### 거부 시 안내

```bash
# 커밋 거부
❌ 커밋이 취소되었습니다.
💡 나중에 수동으로 커밋하려면:
   git add <files>
   git commit -m "..."

# 푸시 거부
⏭️  푸시를 건너뛰었습니다.
   (수동으로 푸시하려면: git push origin main)
```

### 설정

```yaml
# config/agent-config.yml
git_agent:
  role: "commit_message_generator"  # 메시지만 생성
  approval_required:
    commit: true  # 커밋 실행 전 승인 필요 ✅
    push: true    # 푸시 실행 전 승인 필요 ✅

workflow:
  transitions:
    manual_gates: ["COMMIT"]  # COMMIT 단계는 수동 승인 ✅
```

---

## 📚 관련 문서

- [대화형 커밋/푸시 예시](./examples/README.md)
- [Agent 프롬프트 템플릿](../docs/test-guides/prompt-templates.md)
- [워크플로우 가이드](../docs/test-guides/workflow-agents.md)
- [테스트 메트릭](../docs/test-guides/test-metrics.md)

---

## 🎯 다음 단계

실제 Agent 구현체 작성 예정:

1. ✅ types.ts - 완료
2. ⏳ utils/ - 진행 중
3. ⏳ agents/ - 대기 중
4. ⏳ core/ - 대기 중
5. ⏳ run.ts - 대기 중
