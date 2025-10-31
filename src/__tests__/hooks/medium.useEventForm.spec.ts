import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '../../hooks/useEventForm';
import type { Event, RepeatType } from '../../types';

// RED 단계: 반복 유형 선택 상태 테스트 (타입 안전 버전)
describe('useEventForm - 반복 설정 상태', () => {
  it('초기 상태에서 repeatType은 "none", isRepeating은 false이다', () => {
    const { result } = renderHook(() => useEventForm());
    expect(result.current.repeatType).toBe('none');
    expect(result.current.isRepeating).toBe(false);
  });

  it("'반복 일정' 활성화 시 반복 유형, 간격, 종료일을 설정할 수 있다", () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setIsRepeating(true);
      result.current.setRepeatType('daily' satisfies RepeatType);
      result.current.setRepeatInterval(1);
      result.current.setRepeatEndDate('2025-12-31');
    });

    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('daily');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('2025-12-31');
  });

  it('초기 이벤트가 매월 또는 매년인 경우 해당 반복 상태로 초기화된다', () => {
    const initialEvent: Event = {
      id: '1',
      title: '반복',
      date: '2025-01-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    const { result, rerender } = renderHook(({ ev }: { ev?: Event }) => useEventForm(ev), {
      initialProps: { ev: undefined },
    });

    act(() => {
      rerender({ ev: initialEvent });
      result.current.editEvent(initialEvent);
    });

    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('monthly');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('2025-12-31');
  });

  it('resetForm 호출 시 반복 설정은 초기 상태로 복구된다', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setIsRepeating(true);
      result.current.setRepeatType('weekly');
      result.current.setRepeatInterval(2);
      result.current.setRepeatEndDate('2025-11-01');
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.isRepeating).toBe(false);
    expect(result.current.repeatType).toBe('none');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('');
  });

  it('유효하지 않은 repeatType 입력 시 기본값으로 복구된다', () => {
    const { result } = renderHook(() => useEventForm());

    // 비정상 입력을 명시적 단언으로 테스트
    act(() => result.current.setRepeatType('invalid' as RepeatType));

    expect(result.current.repeatType).toBe('none');
  });
});
