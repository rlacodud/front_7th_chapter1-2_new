/**
 * SpecAgent
 * 요구사항 → 전체 스택 명세 생성
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { AgentContext, AgentResult } from '../types.js';

/**
 * SpecAgent 구현
 */
export class SpecAgent extends BaseAgent {
  constructor(config: Omit<AgentConfig, 'stage'>) {
    super({ ...config, stage: 'SPEC' });
  }

  /**
   * SpecAgent 실행
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info('요구사항 분석 및 명세 생성 시작');

    // 1. 입력 파일 읽기
    const requirements = this.readRequirements();
    const testGuide = this.readTestGuide();

    // 2. 사용자 프롬프트 생성
    const userPrompt = this.getUserPrompt(context);

    // 3. AI 호출
    const specContent = await this.callAI(userPrompt);

    // 4. 출력 파일 쓰기
    const outputs = {
      'docs/spec.md': specContent,
    };

    this.writeOutputs(outputs);

    this.logger.success('명세 생성 완료: docs/spec.md');

    return {
      success: true,
      outputs,
    };
  }

  /**
   * 시스템 프롬프트
   */
  protected getSystemPrompt(): string {
    return `당신은 **SpecAgent**입니다.

## 역할
요구사항을 분석하여 **전체 스택(UI/훅/API/유틸) 명세**를 작성하는 꼼꼼하고 체계적인 비즈니스 애널리스트입니다.

## 성격 및 작업 원칙
- 요구사항의 완전성 보장
- 테스트 가능한 형태로 명세 작성
- 엣지 케이스 사전 고려 (31일 매월, 윤년 29일)
- UI, 훅, API, 유틸 각각의 명세 작성

## 출력 형식
다음 구조로 명세를 작성하세요:

# 기능: [기능 이름]

## 1. 기능 개요
- 기능 설명
- 비즈니스 가치

## 2. UI 명세
- 어떤 컴포넌트 추가/수정
- Material-UI 컴포넌트 사용 (Select, Dialog, Icon)
- 사용자 상호작용

**예시**:
- App.tsx에 반복 유형 Select 추가
- 반복 아이콘 표시 (RepeatIcon)
- "해당 일정만 수정하시겠어요?" Dialog 추가

## 3. 훅 명세
- 어떤 상태 관리 필요
- 어떤 훅 수정/생성

**예시**:
- useEventForm.ts: repeatType, endDate 상태 추가
- useEventOperations.ts: 반복 일정 CRUD 로직

## 4. API 명세
- 어떤 엔드포인트 추가/수정
- 요청/응답 형식

**예시**:
- POST /api/events: repeat 필드 추가
- PUT /api/events/:id: editAll 쿼리 파라미터
- DELETE /api/events/:id?deleteAll=true

## 5. 유틸 명세
- 어떤 순수 함수 필요
- 함수 시그니처

**예시**:
- generateRecurringEvents(baseEvent, endDate): Event[]
- 날짜 계산 헬퍼 함수

## 6. 엣지 케이스
**필수 포함**:
- 31일 매월 반복 (2월은 건너뛰기, 30일 달도 건너뛰기)
- 윤년 29일 매년 반복 (윤년에만 생성)
- 반복 종료 날짜 (2025-12-31 최대)

## 7. 데이터 모델
\`\`\`typescript
// 타입 정의 포함
\`\`\`

## 의사결정 기준
- IF 요구사항 모호 THEN 구체적 질문 생성
- IF 엣지 케이스 발견 THEN 명세에 추가
- IF 기존 기능과 충돌 THEN 충돌 사항 명시

## 말투
- "요구사항을 분석했습니다. X가지 기능과 Y가지 엣지 케이스를 식별했습니다."
- "명세 작성 완료. 총 Z개의 테스트 케이스가 예상됩니다."

**지금 시작합니다.**`;
  }

  /**
   * 사용자 프롬프트
   */
  protected getUserPrompt(context: AgentContext): string {
    const requirements = this.readRequirements();
    const testGuide = this.readTestGuide();

    return `## 프로젝트 정보
- 프로젝트: 반복 일정 기능 개발 (Calendar App)
- 언어: TypeScript
- 프레임워크: React 19, Express.js
- 테스트: Vitest ^3.2.4
- 패키지 매니저: pnpm
- 테스트 파일: *.spec.ts (*.spec.tsx for integration)

## 프로젝트 구조
- UI: src/App.tsx
- 훅: src/hooks/
- API: server.js
- 유틸: src/utils/
- 타입: src/types.ts
- 테스트: src/__tests__/

## 품질 기준
- Code Coverage ≥ 80%
- Mutation Score ≥ 70%
- AAA 패턴 필수
- Mock 사용 금지

---

## 요구사항

${requirements}

---

## 테스트 가이드 (참고)

${testGuide.substring(0, 2000)}

---

**위 요구사항을 바탕으로 전체 스택 명세를 작성해주세요.**`;
  }

  /**
   * 요구사항 읽기
   */
  private readRequirements(): string {
    try {
      return this.fileManager.read('docs/requirements.md');
    } catch (error) {
      this.logWarning('requirements.md not found, using default');
      return '기능 요구사항이 제공되지 않았습니다.';
    }
  }

  /**
   * 테스트 가이드 읽기
   */
  private readTestGuide(): string {
    try {
      return this.fileManager.read('docs/TEST_GUIDE.md');
    } catch (error) {
      this.logWarning('TEST_GUIDE.md not found');
      return '';
    }
  }
}
