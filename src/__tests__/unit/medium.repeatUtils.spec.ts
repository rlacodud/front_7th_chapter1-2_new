import { generateRecurringEvents } from '../../utils/repeatUtils';
import type { EventForm } from '../../types';

// RED 단계: 반복 일정 생성 유틸 테스트 (타입 안전 버전)
describe('generateRecurringEvents (반복 일정 생성 유틸)', () => {
  it('매일 반복 일정은 시작일부터 종료일까지 연속된 날짜로 생성된다', () => {
    const baseEvent: EventForm = {
      title: 'Daily',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-05' },
      notificationTime: 10,
    };

    const events = generateRecurringEvents(baseEvent);

    expect(events).toHaveLength(5);
    expect(events[0].date).toBe('2025-10-01');
    expect(events[4].date).toBe('2025-10-05');
  });

  it('매주 반복 일정은 7일 간격으로 생성된다', () => {
    const baseEvent: EventForm = {
      title: 'Weekly',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29' },
      notificationTime: 10,
    };

    const events = generateRecurringEvents(baseEvent);

    expect(events.map((e: EventForm) => e.date)).toEqual([
      '2025-10-01',
      '2025-10-08',
      '2025-10-15',
      '2025-10-22',
      '2025-10-29',
    ]);
  });

  it('31일에 시작된 반복 일정은 31일이 존재하는 달에만 생성된다', () => {
    const baseEvent: EventForm = {
      title: 'Monthly31',
      date: '2025-01-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    const events = generateRecurringEvents(baseEvent);

    expect(events.map((e: EventForm) => e.date)).toEqual([
      '2025-01-31',
      '2025-03-31',
      '2025-05-31',
      '2025-07-31',
      '2025-08-31',
      '2025-10-31',
      '2025-12-31',
    ]);
  });

  it('2월 29일에 시작된 반복 일정은 윤년에만 생성된다', () => {
    const baseEvent: EventForm = {
      title: 'YearlyLeap',
      date: '2024-02-29',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2032-12-31' },
      notificationTime: 10,
    };

    const events = generateRecurringEvents(baseEvent);
    expect(events.map((e: EventForm) => e.date)).toEqual([
      '2024-02-29',
      '2028-02-29',
      '2032-02-29',
    ]);
  });

  it('반복 일정 생성 시 일정 겹침은 고려되지 않는다', () => {
    const baseEvent: EventForm = {
      title: 'NoOverlapCheck',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-03' },
      notificationTime: 10,
    };

    const events = generateRecurringEvents(baseEvent);
    expect(events).toHaveLength(3);
  });

  it('종료일이 시작일보다 빠르면 반복 일정을 생성하지 않는다', () => {
    const baseEvent: EventForm = {
      title: 'InvalidRange',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-09-30' },
      notificationTime: 10,
    };

    const events = generateRecurringEvents(baseEvent);
    expect(events).toHaveLength(0);
  });
});
