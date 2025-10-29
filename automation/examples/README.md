# 대화형 커밋/푸시 예시

## 🎯 개요

GitAgent는 **커밋 메시지만 생성**하고, 실제 커밋/푸시는 **대화형 승인 프로세스**를 통해 실행됩니다.

---

## 🚀 빠른 시작

### 1. 예시 실행

```bash
# 대화형 커밋/푸시 데모
tsx automation/examples/commit-example.ts
```

### 2. 실행 화면

```
🚀 대화형 커밋/푸시 프로세스 시작

TDD 3단계 (RED, GREEN, REFACTOR)를 순차적으로 커밋합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏸️  RED 단계 커밋 승인 요청
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 생성된 커밋 메시지:

  ┌────────────────────────────────────────┐
  │  test: RED - 반복 일정 테스트 추가      │
  │                                          │
  │  - 유닛 테스트: 12개                     │
  │  - 훅 테스트: 5개                        │
  │  - 통합 테스트: 5개                      │
  │                                          │
  │  총 22개 테스트, 모두 FAIL ✅            │
  └────────────────────────────────────────┘

📁 변경된 파일:

  - src/__tests__/unit/repeatUtils.spec.ts
  - src/__tests__/hooks/useEventForm.spec.ts
  - src/__tests__/integration/repeatEvent.spec.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이 커밋을 실행하시겠습니까? (y/n): y

✅ 커밋이 승인되었습니다.

📦 파일 스테이징 중...
  ✓ src/__tests__/unit/repeatUtils.spec.ts
  ✓ src/__tests__/hooks/useEventForm.spec.ts
  ✓ src/__tests__/integration/repeatEvent.spec.tsx

✅ 파일 스테이징 완료

💾 커밋 실행 중...

✅ 커밋 완료
   Commit SHA: a1b2c3d

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏸️  GREEN 단계 커밋 승인 요청
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏸️  원격 저장소 푸시 승인 요청
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 푸시 정보:

  Remote: origin
  Branch: main

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

origin/main로 푸시하시겠습니까? (y/n): n

⏭️  푸시를 건너뛰었습니다.
   (수동으로 푸시하려면: git push origin main)
```

---

## 🔧 사용 방법

### Option 1: 전체 워크플로우와 통합

```typescript
// automation/run.ts
import { getGitExecutor } from './core/git-executor.js';

async function runWorkflow() {
  // ... RED, GREEN, REFACTOR 단계 실행 ...

  // COMMIT 단계: GitAgent가 메시지 생성
  const commitMessages = await gitAgent.generateMessages();

  // 대화형 커밋/푸시
  const gitExecutor = getGitExecutor();
  await gitExecutor.commitMultipleStages(commitMessages, true);
}
```

### Option 2: 단일 커밋

```typescript
import { getGitExecutor } from './core/git-executor.js';
import { closeApprovalManager } from './utils/approval-manager.js';

async function singleCommit() {
  const gitExecutor = getGitExecutor();

  const result = await gitExecutor.commitWithApproval(
    {
      stage: 'GREEN',
      message: 'feat: 기능 구현',
      files: [], // 빈 배열 = 자동 감지
    },
    true // enablePush
  );

  console.log('커밋:', result.committed ? '✅' : '❌');
  console.log('푸시:', result.pushed ? '✅' : '⏭️');

  closeApprovalManager();
}
```

### Option 3: 수동 제어

```typescript
import { getGitExecutor } from './core/git-executor.js';
import { getApprovalManager } from './utils/approval-manager.js';

async function manualControl() {
  const gitExecutor = getGitExecutor();
  const approvalManager = getApprovalManager();

  // 1. 변경 파일 확인
  const files = gitExecutor.getChangedFiles();
  console.log('변경된 파일:', files);

  // 2. 커밋 승인만 요청
  const approval = await approvalManager.requestCommitApproval(
    'GREEN',
    '커밋 메시지',
    files
  );

  if (approval.approved) {
    // 3. 수동으로 커밋 실행
    // ...
  }
}
```

---

## 🎨 커스터마이징

### 승인 메시지 수정

```typescript
// automation/utils/approval-manager.ts

// 커밋 승인 질문 변경
const approved = await this.askYesNo(
  chalk.bold.yellow('정말 커밋하시겠습니까? (yes/no): ')
);

// 푸시 승인 질문 변경
const approved = await this.askYesNo(
  chalk.bold.red('⚠️  원격 저장소에 푸시할까요? (y/n): ')
);
```

### 자동 승인 모드 (CI/CD용)

```typescript
// 환경 변수로 자동 승인
const AUTO_APPROVE = process.env.AUTO_APPROVE === 'true';

if (AUTO_APPROVE) {
  // 승인 건너뛰고 자동 실행
  return { approved: true, action: 'commit' };
}
```

---

## ⚙️ 설정

### config/agent-config.yml

```yaml
git_agent:
  role: "commit_message_generator"  # 메시지만 생성
  
  approval_required:
    commit: true  # 커밋 실행 전 승인 필요
    push: true    # 푸시 실행 전 승인 필요

workflow:
  transitions:
    manual_gates: ["COMMIT"]  # COMMIT 단계는 수동 승인
```

---

## 🔒 안전 장치

### 1. 2단계 승인

1. **커밋 승인**: 커밋 메시지 + 파일 목록 확인 후 승인
2. **푸시 승인**: 원격 저장소로 푸시 여부 최종 확인

### 2. 거부 시 안내

```bash
# 커밋 거부 시
❌ 커밋이 취소되었습니다.

💡 나중에 수동으로 커밋하려면:
   git add <files>
   git commit -m "..."

# 푸시 거부 시
⏭️  푸시를 건너뛰었습니다.
   (수동으로 푸시하려면: git push origin main)
```

### 3. 단계별 중단

```typescript
// 한 단계라도 커밋 실패하면 전체 프로세스 중단
if (!result.committed) {
  console.log('❌ RED 단계 커밋 실패. 프로세스를 중단합니다.');
  break;
}
```

---

## 📝 로그

### 커밋 로그 자동 생성

```markdown
# Git Commit Log

Generated: 2025-10-29T16:30:00.000Z

## Commits

### Commit 1
- Committed: ✅
- Pushed: ❌
- SHA: a1b2c3d

### Commit 2
- Committed: ✅
- Pushed: ❌
- SHA: d4e5f6g

### Commit 3
- Committed: ✅
- Pushed: ✅
- SHA: h7i8j9k
```

---

## 🐛 트러블슈팅

### Q: 승인 프롬프트가 안 뜨는 경우

**A**: TTY(터미널) 환경인지 확인

```bash
# 올바른 실행
tsx automation/examples/commit-example.ts

# 잘못된 실행 (stdin 없음)
tsx automation/examples/commit-example.ts < /dev/null
```

### Q: Git 명령 실패

**A**: Git 상태 확인

```bash
git status
git log --oneline
```

### Q: 푸시 권한 오류

**A**: 원격 저장소 설정 확인

```bash
git remote -v
git config user.name
git config user.email
```

---

## 🎯 다음 단계

1. ✅ 대화형 승인 시스템 완료
2. ⏳ 전체 워크플로우와 통합
3. ⏳ GitAgent AI 구현 (메시지 생성)
4. ⏳ 실제 TDD 사이클 테스트

