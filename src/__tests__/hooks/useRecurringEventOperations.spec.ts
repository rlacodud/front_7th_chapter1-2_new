import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useRecurringEventOperations } from '../../hooks/useRecurringEventOperations';
import { Event } from '../../types';

const mockEvents: Event[] = [
  {
    id: '1',
    title: '반복 일정',
    date: '2025-10-15',
    startTime: '09:00',
    endTime: '10:00',
    description: '매일 반복',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'daily', interval: 1 },
    notificationTime: 10,
  },
  {
    id: '2',
    title: '반복 일정',
    date: '2025-10-16',
    startTime: '09:00',
    endTime: '10:00',
    description: '매일 반복',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'daily', interval: 1 },
    notificationTime: 10,
  },
];

const mockUpdateEvents = vi.fn();

describe('useRecurringEventOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch response
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('예(단일 수정)를 선택하면 해당 일정만 업데이트하고 반복을 제거한다', async () => {
    const { result } = renderHook(() => useRecurringEventOperations(mockEvents, mockUpdateEvents));

    const updatedEvent: Event = {
      ...mockEvents[0],
      title: '수정된 제목',
    };

    await act(async () => {
      await result.current.handleRecurringEdit(updatedEvent, true); // editSingleOnly = true
    });

    // Should update only the target event and remove repeat
    expect(fetch).toHaveBeenCalledWith('/api/events/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updatedEvent, repeat: { type: 'none', interval: 0 } }),
    });

    expect(mockUpdateEvents).toHaveBeenCalledWith([]);
  });

  it('아니오(전체 수정)를 선택하면 모든 반복 일정을 업데이트한다', async () => {
    const { result } = renderHook(() => useRecurringEventOperations(mockEvents, mockUpdateEvents));

    const updatedEvent: Event = {
      ...mockEvents[0],
      title: '수정된 제목',
    };

    await act(async () => {
      await result.current.handleRecurringEdit(updatedEvent, false); // editSingleOnly = false
    });

    // Should update all related events with same title
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('/api/events/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mockEvents[0], title: '수정된 제목' }),
    });
    expect(fetch).toHaveBeenCalledWith('/api/events/2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mockEvents[1], title: '수정된 제목' }),
    });

    expect(mockUpdateEvents).toHaveBeenCalledWith([]);
  });

  it('반복 일정이 아닌 일정을 편집하는 경우 일반적인 업데이트를 수행한다', async () => {
    const nonRecurringEvents: Event[] = [
      {
        ...mockEvents[0],
        repeat: { type: 'none', interval: 0 },
      },
    ];

    const { result } = renderHook(() =>
      useRecurringEventOperations(nonRecurringEvents, mockUpdateEvents)
    );

    const updatedEvent: Event = {
      ...nonRecurringEvents[0],
      title: '수정된 제목',
    };

    await act(async () => {
      await result.current.handleRecurringEdit(updatedEvent, true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/events/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEvent),
    });

    expect(mockUpdateEvents).toHaveBeenCalledWith([]);
  });

  it('관련 반복 일정을 올바르게 찾는다', () => {
    const { result } = renderHook(() => useRecurringEventOperations(mockEvents, mockUpdateEvents));

    const relatedEvents = result.current.findRelatedRecurringEvents(mockEvents[0]);

    expect(relatedEvents).toHaveLength(2);
    expect(relatedEvents).toContain(mockEvents[0]);
    expect(relatedEvents).toContain(mockEvents[1]);
  });

  it('반복 일정이 없는 경우 빈 배열을 반환한다', () => {
    const nonRecurringEvents: Event[] = [
      {
        ...mockEvents[0],
        repeat: { type: 'none', interval: 0 },
      },
    ];

    const { result } = renderHook(() =>
      useRecurringEventOperations(nonRecurringEvents, mockUpdateEvents)
    );

    const relatedEvents = result.current.findRelatedRecurringEvents(nonRecurringEvents[0]);

    expect(relatedEvents).toHaveLength(0);
  });

  it('단일 반복 일정만 있는 경우 빈 배열을 반환한다', () => {
    const singleRecurringEvent: Event[] = [mockEvents[0]];

    const { result } = renderHook(() =>
      useRecurringEventOperations(singleRecurringEvent, mockUpdateEvents)
    );

    const relatedEvents = result.current.findRelatedRecurringEvents(singleRecurringEvent[0]);

    expect(relatedEvents).toHaveLength(0);
  });

  describe('반복 일정 삭제 기능 (P1 테스트)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock successful delete response
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
    });

    it('예(단일 삭제)를 선택하면 해당 일정만 삭제한다', async () => {
      const { result } = renderHook(() =>
        useRecurringEventOperations(mockEvents, mockUpdateEvents)
      );

      await act(async () => {
        await result.current.handleRecurringDelete(mockEvents[0], true); // deleteSingleOnly = true
      });

      // Should only delete the target event
      expect(fetch).toHaveBeenCalledWith('/api/events/1', {
        method: 'DELETE',
      });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(mockUpdateEvents).toHaveBeenCalledWith([]);
    });

    it('아니오(시리즈 삭제)를 선택하면 모든 관련 반복 일정을 삭제한다', async () => {
      const { result } = renderHook(() =>
        useRecurringEventOperations(mockEvents, mockUpdateEvents)
      );

      await act(async () => {
        await result.current.handleRecurringDelete(mockEvents[0], false); // deleteSingleOnly = false
      });

      // Should delete all related events
      expect(fetch).toHaveBeenCalledWith('/api/events/1', {
        method: 'DELETE',
      });
      expect(fetch).toHaveBeenCalledWith('/api/events/2', {
        method: 'DELETE',
      });
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(mockUpdateEvents).toHaveBeenCalledWith([]);
    });

    it('반복 일정이 아닌 일정을 삭제하는 경우 일반적인 삭제를 수행한다', async () => {
      const nonRecurringEvents: Event[] = [
        {
          ...mockEvents[0],
          repeat: { type: 'none', interval: 0 },
        },
      ];

      const { result } = renderHook(() =>
        useRecurringEventOperations(nonRecurringEvents, mockUpdateEvents)
      );

      await act(async () => {
        await result.current.handleRecurringDelete(nonRecurringEvents[0], true);
      });

      expect(fetch).toHaveBeenCalledWith('/api/events/1', {
        method: 'DELETE',
      });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(mockUpdateEvents).toHaveBeenCalledWith([]);
    });

    it('삭제할 일정이 존재하지 않는 경우 에러 없이 처리한다', async () => {
      const { result } = renderHook(() =>
        useRecurringEventOperations(mockEvents, mockUpdateEvents)
      );

      const nonExistentEvent: Event = {
        ...mockEvents[0],
        id: '999', // 존재하지 않는 ID
      };

      await act(async () => {
        await result.current.handleRecurringDelete(nonExistentEvent, true);
      });

      expect(fetch).toHaveBeenCalledWith('/api/events/999', {
        method: 'DELETE',
      });
      expect(mockUpdateEvents).toHaveBeenCalledWith([]);
    });

    it('네트워크 오류 시에도 updateEvents가 호출된다', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useRecurringEventOperations(mockEvents, mockUpdateEvents)
      );

      await act(async () => {
        await result.current.handleRecurringDelete(mockEvents[0], true);
      });

      expect(mockUpdateEvents).toHaveBeenCalledWith([]);
    });

    it('서버에서 404 응답을 받아도 updateEvents가 호출된다', async () => {
      // Mock 404 response
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

      const { result } = renderHook(() =>
        useRecurringEventOperations(mockEvents, mockUpdateEvents)
      );

      await act(async () => {
        await result.current.handleRecurringDelete(mockEvents[0], true);
      });

      expect(mockUpdateEvents).toHaveBeenCalledWith([]);
    });

    it('단일 반복 일정의 경우 일반 삭제로 처리된다', async () => {
      const singleRecurringEvent: Event[] = [mockEvents[0]];

      const { result } = renderHook(() =>
        useRecurringEventOperations(singleRecurringEvent, mockUpdateEvents)
      );

      await act(async () => {
        await result.current.handleRecurringDelete(singleRecurringEvent[0], false);
      });

      // Even though deleteSingleOnly=false, should only delete one event
      // because there are no related events
      expect(fetch).toHaveBeenCalledWith('/api/events/1', {
        method: 'DELETE',
      });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(mockUpdateEvents).toHaveBeenCalledWith([]);
    });
  });
});
