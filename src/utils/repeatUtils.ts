import { EventForm, RepeatType } from '../types';

// 반복 종료 상한 (요구사항: 2025-12-31까지 전개)
const MAX_END_DATE = '2025-12-31' as const;

function getEffectiveEndDate(repeatEndDate?: string): Date {
  // 명시적 종료일이 있으면 그대로 사용, 없으면 상한 적용
  if (repeatEndDate) return new Date(repeatEndDate);
  return new Date(MAX_END_DATE);
}

/**
 * 윤년 여부를 판별
 * - 4로 나누어떨어지고, 100으로는 나누어떨어지지 않거나 400으로 나누어떨어질 경우 윤년
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Date 객체를 'YYYY-MM-DD' 문자열로 변환
 */
function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 일 단위로 날짜를 더함
 */
function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * 주 단위로 날짜를 더함
 */
function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, 7 * weeks);
}

/**
 * 해당 연도와 월의 마지막 날짜를 반환 (예: 2024년 2월 → 29)
 */
function getDaysInMonth(year: number, monthIndex0Based: number): number {
  return new Date(year, monthIndex0Based + 1, 0).getDate();
}

/**
 * 월 단위로 날짜를 더하되, 기준일과 같은 일이 존재하지 않으면 null 반환
 * (예: 1월 31일 → 2월 31일은 없으므로 null)
 */
function addMonthsExactFromBase(base: Date, months: number, baseDay?: number): Date | null {
  const desiredDay = baseDay ?? base.getDate();
  const target = new Date(base);
  const targetMonthIndex = base.getMonth() + months;

  target.setMonth(targetMonthIndex, 1); // 먼저 1일로 설정해서 월 오버플로 방지
  const year = target.getFullYear();
  const monthIndex = target.getMonth();
  const daysInTarget = getDaysInMonth(year, monthIndex);

  // 대상 월에 같은 일이 존재하지 않으면 null 반환
  if (desiredDay > daysInTarget) {
    return null;
  }

  target.setDate(desiredDay);
  return target;
}

/**
 * 연 단위로 날짜를 더하되, 윤년 2월 29일과 같이 평년에는 존재하지 않는 날짜면 null 반환
 */
function addYearsExactFromBase(
  base: Date,
  years: number,
  baseMonth?: number,
  baseDay?: number
): Date | null {
  const monthIndex = baseMonth ?? base.getMonth();
  const day = baseDay ?? base.getDate();
  const year = base.getFullYear() + years;

  // 윤년이 아닌데 2월 29일이면 존재하지 않음
  if (monthIndex === 1 && day === 29 && !isLeapYear(year)) {
    return null;
  }

  const target = new Date(base);
  target.setFullYear(year, monthIndex, 1);
  const daysInTarget = getDaysInMonth(year, monthIndex);

  if (day > daysInTarget) return null;
  target.setDate(day);
  return target;
}

/**
 * 반복 간격을 보정 (1보다 작은 값, NaN 등은 1로 처리)
 */
function clampInterval(interval: number): number {
  return Number.isFinite(interval) && interval >= 1 ? Math.floor(interval) : 1;
}

/**
 * 유효한 반복 유형인지 검사
 */
function isValidRepeatType(value: unknown): value is RepeatType {
  return (
    value === 'none' ||
    value === 'daily' ||
    value === 'weekly' ||
    value === 'monthly' ||
    value === 'yearly'
  );
}

/**
 * 반복 일정 생성 함수
 * - 반복 유형(daily, weekly, monthly, yearly)에 따라 일정을 생성
 * - 종료일(endDate)이 없을 경우 2025-12-31까지만 전개
 * - 31일, 윤년 등 실제 존재하지 않는 날짜는 자동으로 건너뜀
 */
export function generateRecurringEvents(baseEvent: EventForm): EventForm[] {
  const interval = clampInterval(baseEvent.repeat.interval);
  const start = new Date(baseEvent.date);
  const end: Date | null = getEffectiveEndDate(baseEvent.repeat.endDate);

  // 종료일보다 시작일이 늦으면 잘못된 입력 → 빈 배열
  if (end && start > end) {
    return [];
  }

  const type = baseEvent.repeat.type;
  if (!isValidRepeatType(type) || type === 'none') {
    return [];
  }

  const results: EventForm[] = [];

  // 주어진 날짜가 유효 범위 내라면 결과 배열에 추가
  const pushIfInRange = (d: Date) => {
    if (!end || d <= end) {
      results.push({ ...baseEvent, date: formatDateYmd(d) });
      return true;
    }
    return false;
  };

  // 시작일은 종료일이 없거나 종료일 이내인 경우 추가
  if (!pushIfInRange(start)) return results;

  // ① 매일 반복
  if (type === 'daily') {
    let cursor = new Date(start);
    while (true) {
      cursor = addDays(cursor, interval);
      if (!pushIfInRange(cursor)) break;
    }
    return results;
  }

  // ② 매주 반복
  if (type === 'weekly') {
    let cursor = new Date(start);
    while (true) {
      cursor = addWeeks(cursor, interval);
      if (!pushIfInRange(cursor)) break;
    }
    return results;
  }

  // ③ 매월 반복 (31일 예외 처리)
  if (type === 'monthly') {
    const baseDay = start.getDate();
    let monthsAhead = 0;
    while (true) {
      monthsAhead += interval;
      const next = addMonthsExactFromBase(start, monthsAhead, baseDay);
      if (!next) {
        // 해당 월에 같은 일이 없으면 건너뛰되 종료일은 확인
        const bound = new Date(start);
        bound.setMonth(start.getMonth() + monthsAhead, 1);
        if (end && bound > end) break;
        continue;
      }
      if (!pushIfInRange(next)) break;
    }
    return results;
  }

  // ④ 매년 반복 (윤년 2월 29일 처리 포함)
  if (type === 'yearly') {
    const baseMonth = start.getMonth();
    const baseDay = start.getDate();
    let cursor = new Date(start);

    while (true) {
      // 매년 interval 만큼 증가
      cursor.setFullYear(cursor.getFullYear() + interval);

      // 종료일 초과 시 중단
      if (end && cursor > end) break;

      // 2월 29일인데 평년이면 건너뜀
      if (baseMonth === 1 && baseDay === 29 && !isLeapYear(cursor.getFullYear())) {
        continue;
      }

      // 존재하지 않는 날짜(예: 4월 31일)면 건너뜀
      const next = new Date(cursor.getFullYear(), baseMonth, baseDay);
      if (next.getMonth() !== baseMonth) continue;

      if (!pushIfInRange(next)) break;
    }

    return results;
  }

  return results;
}

export type { EventForm };
