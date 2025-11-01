import { Event } from '../types';
import { generateRecurringEvents as generateRecurringEventsFromForm } from './repeatUtils';

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

/**
 * 반복 일정 생성 (Event 형식으로 반환)
 * @param baseEvent 원본 이벤트
 * @returns 생성된 반복 일정들의 배열 (ID는 baseId-date 형식)
 */
export function generateRecurringEvents(baseEvent: Event): Event[] {
  const { id: baseId, ...baseForm } = baseEvent;

  // repeat.type이 'none'인 경우 단일 일정만 반환
  if (baseEvent.repeat.type === 'none') {
    return [baseEvent];
  }

  const generatedForms = generateRecurringEventsFromForm(baseForm);

  // 각 생성된 EventForm에 ID를 부여하여 Event로 변환
  return generatedForms.map((form) => ({
    ...form,
    id: `${baseId}-${form.date}`,
  }));
}

/**
 * 이벤트들이 같은 반복 그룹에 속하는지 확인
 * @param eventId 확인할 이벤트 ID
 * @param baseEventId 비교할 기준 이벤트 ID
 */
function isSameRecurringGroup(eventId: string, baseEventId: string): boolean {
  // eventId가 baseEventId-date 형식인지 확인
  return eventId.startsWith(`${baseEventId}-`);
}

/**
 * 반복 일정 수정
 * @param events 전체 이벤트 배열
 * @param eventId 수정할 이벤트 ID
 * @param updates 수정할 내용
 * @param editSingle true: 단일 수정 (repeat.type을 'none'으로), false: 전체 수정 (repeat.type 유지)
 * @returns 수정된 이벤트 배열
 */
export function updateRecurringEvent(
  events: Event[],
  eventId: string,
  updates: Partial<Event>,
  editSingle: boolean
): Event[] {
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    return events;
  }

  // 단일 수정인 경우
  if (editSingle) {
    return events.map((e) => {
      if (e.id === eventId) {
        return { ...e, ...updates, repeat: { type: 'none', interval: 0 } };
      }
      return e;
    });
  }

  // 전체 수정인 경우: 같은 그룹의 모든 이벤트 수정
  // eventId에서 baseId 추출 (예: '1-2024-07-02' -> '1')
  const baseId = eventId.split('-')[0];

  return events.map((e) => {
    if (isSameRecurringGroup(e.id, baseId)) {
      return { ...e, ...updates };
    }
    return e;
  });
}

/**
 * 반복 일정 삭제
 * @param events 전체 이벤트 배열
 * @param eventId 삭제할 이벤트 ID
 * @param deleteSingle true: 단일 삭제, false: 전체 삭제
 * @returns 삭제 후 이벤트 배열
 */
export function deleteRecurringEvent(
  events: Event[],
  eventId: string,
  deleteSingle: boolean
): Event[] {
  // 단일 삭제인 경우
  if (deleteSingle) {
    return events.filter((e) => e.id !== eventId);
  }

  // 전체 삭제인 경우: 같은 그룹의 모든 이벤트 삭제
  // eventId에서 baseId 추출 (예: '1-2024-07-02' -> '1')
  const baseId = eventId.split('-')[0];

  return events.filter((e) => !isSameRecurringGroup(e.id, baseId));
}
