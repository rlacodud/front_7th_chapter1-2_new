import { Event } from '../types';

/**
 * 전개된 이벤트에서 원본 이벤트 ID를 추출
 */
export function getOriginalEventId(event: Event): string | undefined {
  return (event as unknown as { originalId?: string })?.originalId;
}

/**
 * 반복 일정인지 확인
 */
export function isRecurringEventType(event: Event): boolean {
  return event.repeat.type !== 'none';
}

/**
 * 반복 일정의 repeat.id를 안전하게 추출
 */
export function getRepeatId(event: Event): string | undefined {
  return (event.repeat as { id?: string }).id;
}

/**
 * 원본 이벤트 찾기
 */
export function findOriginalEvent(event: Event, events: Event[]): Event {
  const originalId = getOriginalEventId(event);
  if (!originalId) {
    return event;
  }
  return events.find((e) => e.id === originalId) || event;
}
