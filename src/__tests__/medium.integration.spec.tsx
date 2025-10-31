import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within, act } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';

const theme = createTheme();

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

// ! Hard 여기 제공 안함
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('새 회의')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
    expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeInTheDocument();
    expect(eventList.getByText('회의실 A')).toBeInTheDocument();
    expect(eventList.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const { user } = setup(<App />);

    setupMockHandlerUpdating();

    await user.click(await screen.findByLabelText('Edit event'));

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
    expect(eventList.getByText('회의 내용 변경')).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('삭제할 이벤트')).toBeInTheDocument();

    // 삭제 버튼 클릭
    const allDeleteButton = await screen.findAllByLabelText('Delete event');
    await user.click(allDeleteButton[0]);

    expect(eventList.queryByText('삭제할 이벤트')).not.toBeInTheDocument();
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    // ! 현재 시스템 시간 2025-10-01
    const { user } = setup(<App />);

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번주 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번주 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('이번주 팀 회의')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.setSystemTime(new Date('2025-01-01'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번달 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번달 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('이번달 팀 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    setup(<App />);

    const monthView = screen.getByTestId('month-view');

    // 1월 1일 셀 확인
    const januaryFirstCell = within(monthView).getByText('1').closest('td')!;
    expect(within(januaryFirstCell).getByText('신정')).toBeInTheDocument();
  });
});

describe('반복 일정 표시', () => {
  it('반복 일정은 캘린더 뷰에서 반복 아이콘으로 구분되어 표시된다', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 'r1',
              title: '반복 회의',
              date: '2025-10-01',
              startTime: '09:00',
              endTime: '10:00',
              description: '반복',
              location: '회의실',
              category: '업무',
              repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    setup(<App />);

    expect(await screen.findByTestId('repeat-icon')).toBeInTheDocument();
  });

  it('단일 일정은 캘린더 뷰에서 반복 아이콘이 표시되지 않는다', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 's1',
              title: '단일 일정',
              date: '2025-10-02',
              startTime: '11:00',
              endTime: '12:00',
              description: '단일',
              location: '회의실',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    setup(<App />);

    expect(screen.queryByTestId('repeat-icon')).not.toBeInTheDocument();
  });
});

describe('반복 종료', () => {
  it('특정 종료일을 지정하면 종료일 이전 발생분만 달력에 표시된다', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 'e1',
              title: '주간 반복',
              date: '2025-10-01',
              startTime: '09:00',
              endTime: '10:00',
              description: 'weekly',
              location: '회의실',
              category: '업무',
              repeat: { type: 'weekly', interval: 1, endDate: '2025-10-15' },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    setup(<App />);

    // 10월 1일, 8일, 15일까지 표시되고 이후(22일)는 표시되지 않아야 함
    const monthView = await screen.findByTestId('month-view');
    // 종료일(10/15) 이전 주차 발생(1, 8, 15)이 모두 존재하는지 확인 (총 3개)
    const items = await within(monthView).findAllByText('주간 반복');
    expect(items.length).toBe(3);
  });

  it('종료일이 없으면 2025-12-31까지만 전개되어 다음 해 발생분은 달력에 표시되지 않는다', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 'd1',
              title: '일일 반복(무종료)',
              date: '2025-12-30',
              startTime: '09:00',
              endTime: '10:00',
              description: 'daily',
              location: '회의실',
              category: '업무',
              repeat: { type: 'daily', interval: 1 },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    vi.setSystemTime(new Date('2025-12-01'));
    setup(<App />);

    const monthView = await screen.findByTestId('month-view');
    // 12월 내 발생분만 있어야 하며, 2026-01-01 발생분은 표시되지 않아야 함
    const items = await within(monthView).findAllByText('일일 반복(무종료)');
    expect(items.length).toBe(2); // 12/30, 12/31
  });
});

describe('검색 기능', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 1,
              title: '팀 회의',
              date: '2025-10-15',
              startTime: '09:00',
              endTime: '10:00',
              description: '주간 팀 미팅',
              location: '회의실 A',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
            {
              id: 2,
              title: '프로젝트 계획',
              date: '2025-10-16',
              startTime: '14:00',
              endTime: '15:00',
              description: '새 프로젝트 계획 수립',
              location: '회의실 B',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
          ],
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');
    await user.clear(searchInput);

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 계획')).toBeInTheDocument();
  });
});

describe('일정 충돌', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '설명',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    const editButton = (await screen.findAllByLabelText('Edit event'))[1];
    await user.click(editButton);

    // 시간 수정하여 다른 일정과 충돌 발생
    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '08:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '10:30');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  vi.setSystemTime(new Date('2025-10-15 08:49:59'));

  setup(<App />);

  // ! 일정 로딩 완료 후 테스트
  await screen.findByText('일정 로딩 완료!');

  expect(screen.queryByText('10분 후 기존 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(screen.getByText('10분 후 기존 회의 일정이 시작됩니다.')).toBeInTheDocument();
});

describe('반복 일정 삭제', () => {
  const setupMockHandlerRecurringEvent = () => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: '매주 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '주간 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { id: 'repeat-1', type: 'weekly', interval: 1, endDate: '2025-12-31' },
        notificationTime: 10,
      },
    ];

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: [...mockEvents] });
      }),
      http.delete('/api/events/:id', async ({ params }) => {
        const { id } = params;
        const index = mockEvents.findIndex((event) => event.id === id);
        if (index !== -1) {
          mockEvents.splice(index, 1);
          return HttpResponse.json({}, { status: 200 });
        }
        return HttpResponse.json({}, { status: 404 });
      }),
      http.delete('/api/recurring-events/:repeatId', async ({ params }) => {
        const { repeatId } = params;
        const initialLength = mockEvents.length;
        const filtered = mockEvents.filter((event) => event.repeat.id !== repeatId);
        mockEvents.length = 0;
        mockEvents.push(...filtered);
        return HttpResponse.json({ deleted: initialLength - mockEvents.length }, { status: 200 });
      })
    );
  };

  beforeEach(() => {
    vi.setSystemTime(new Date('2025-10-15'));
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('반복 일정을 삭제하려고 할 때 "해당 일정만 삭제하시겠어요?" 다이얼로그가 노출된다', async () => {
    setupMockHandlerRecurringEvent();
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const deleteButtons = await screen.findAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    expect(await screen.findByText('해당 일정만 삭제하시겠어요?')).toBeInTheDocument();
  });

  it('예를 선택하면 단일 삭제되어 해당 일정만 삭제된다', async () => {
    setupMockHandlerRecurringEvent();
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const deleteButtons = await screen.findAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    const dialog = await screen.findByText('해당 일정만 삭제하시겠어요?');
    expect(dialog).toBeInTheDocument();

    const yesButton = screen.getByRole('button', { name: '예' });
    await user.click(yesButton);

    await screen.findByText('일정이 삭제되었습니다.');

    await screen.findByText('일정 로딩 완료!');

    const monthView = within(screen.getByTestId('month-view'));
    const eventsAfter = monthView.queryAllByText('매주 회의');
    // 단일 삭제이므로 일부 일정은 여전히 남아있어야 함 (전체 삭제가 아니므로)
    expect(eventsAfter.length).toBeGreaterThan(0);
  });

  it('아니오를 선택하면 전체 삭제되어 반복 일정의 모든 일정이 삭제된다', async () => {
    setupMockHandlerRecurringEvent();
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const deleteButtons = await screen.findAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    const dialog = await screen.findByText('해당 일정만 삭제하시겠어요?');
    expect(dialog).toBeInTheDocument();

    const noButton = screen.getByRole('button', { name: '아니오' });
    await user.click(noButton);

    await screen.findByText('일정이 삭제되었습니다.');

    await screen.findByText('일정 로딩 완료!');

    const monthView = within(screen.getByTestId('month-view'));
    const eventsAfter = monthView.queryAllByText('매주 회의');
    // 전체 삭제이므로 모든 일정이 삭제되어야 함
    expect(eventsAfter.length).toBe(0);
  });
});
