import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import { setupMockHandlerListCreation } from '../../__mocks__/handlersUtils';
import App from '../../App';
import { server } from '../../setupTests';

const theme = createTheme();

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

describe('반복 일정 회귀 테스트', () => {
  describe('검색 기능 호환성', () => {
    it('반복 일정도 검색 결과에 올바르게 포함된다', async () => {
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({
            events: [
              {
                id: '1',
                title: '반복 회의',
                date: '2025-10-15',
                startTime: '09:00',
                endTime: '10:00',
                description: '반복되는 회의',
                location: '회의실 A',
                category: '업무',
                repeat: { type: 'daily', interval: 1 },
                notificationTime: 10,
              },
              {
                id: '2',
                title: '반복 회의',
                date: '2025-10-16',
                startTime: '09:00',
                endTime: '10:00',
                description: '반복되는 회의',
                location: '회의실 A',
                category: '업무',
                repeat: { type: 'daily', interval: 1 },
                notificationTime: 10,
              },
              {
                id: '3',
                title: '단일 일정',
                date: '2025-10-15',
                startTime: '14:00',
                endTime: '15:00',
                description: '단일 일정',
                location: '회의실 B',
                category: '개인',
                repeat: { type: 'none', interval: 0 },
                notificationTime: 10,
              },
            ],
          });
        })
      );

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
      await user.type(searchInput, '반복 회의');

      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getAllByText('반복 회의')).toHaveLength(2);
      expect(eventList.queryByText('단일 일정')).not.toBeInTheDocument();
    });
  });

  describe('뷰 모드 호환성', () => {
    it('주별 뷰에서 반복 일정이 올바르게 표시된다', async () => {
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({
            events: [
              {
                id: '1',
                title: '이번주 반복 회의',
                date: '2025-10-01',
                startTime: '09:00',
                endTime: '10:00',
                description: '반복되는 회의',
                location: '회의실 A',
                category: '업무',
                repeat: { type: 'daily', interval: 1 },
                notificationTime: 10,
              },
              {
                id: '2',
                title: '이번주 반복 회의',
                date: '2025-10-02',
                startTime: '09:00',
                endTime: '10:00',
                description: '반복되는 회의',
                location: '회의실 A',
                category: '업무',
                repeat: { type: 'daily', interval: 1 },
                notificationTime: 10,
              },
            ],
          });
        })
      );

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // 주별 뷰로 변경
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));
      expect(weekView.getAllByText('이번주 반복 회의')).toHaveLength(2);
    });

    it('월별 뷰에서 반복 일정이 올바르게 표시된다', async () => {
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({
            events: [
              {
                id: '1',
                title: '이번달 반복 회의',
                date: '2025-10-01',
                startTime: '09:00',
                endTime: '10:00',
                description: '반복되는 회의',
                location: '회의실 A',
                category: '업무',
                repeat: { type: 'daily', interval: 1 },
                notificationTime: 10,
              },
              {
                id: '2',
                title: '이번달 반복 회의',
                date: '2025-10-02',
                startTime: '09:00',
                endTime: '10:00',
                description: '반복되는 회의',
                location: '회의실 A',
                category: '업무',
                repeat: { type: 'daily', interval: 1 },
                notificationTime: 10,
              },
            ],
          });
        })
      );

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      expect(monthView.getAllByText('이번달 반복 회의')).toHaveLength(2);
    });
  });

  describe('알림 기능 호환성', () => {
    it('반복 일정의 각 인스턴스에 대해 개별 알림이 작동한다', async () => {
      vi.setSystemTime(new Date('2025-10-15 08:49:59'));

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({
            events: [
              {
                id: '1',
                title: '반복 회의',
                date: '2025-10-15',
                startTime: '09:00',
                endTime: '10:00',
                description: '반복되는 회의',
                location: '회의실 A',
                category: '업무',
                repeat: { type: 'daily', interval: 1 },
                notificationTime: 10,
              },
              {
                id: '2',
                title: '반복 회의',
                date: '2025-10-16',
                startTime: '09:00',
                endTime: '10:00',
                description: '반복되는 회의',
                location: '회의실 A',
                category: '업무',
                repeat: { type: 'daily', interval: 1 },
                notificationTime: 10,
              },
            ],
          });
        })
      );

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      expect(screen.queryByText('10분 후 반복 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

      // 1초 후 알림 확인
      vi.advanceTimersByTime(1000);
      expect(await screen.findByText('10분 후 반복 회의 일정이 시작됩니다.')).toBeInTheDocument();
    });
  });

  describe('충돌 감지 호환성', () => {
    it('반복 일정 생성시 충돌을 감지하지 않는다', async () => {
      setupMockHandlerListCreation([
        {
          id: '1',
          title: '기존 단일 일정',
          date: '2025-10-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '기존 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // 겹치는 시간대에 반복 일정 생성
      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '새 반복 일정');
      await user.type(screen.getByLabelText('날짜'), '2025-10-15');
      await user.type(screen.getByLabelText('시작 시간'), '09:30');
      await user.type(screen.getByLabelText('종료 시간'), '10:30');
      await user.type(screen.getByLabelText('설명'), '반복 일정');
      await user.type(screen.getByLabelText('위치'), '회의실 B');
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      await user.click(screen.getByLabelText('반복 일정'));
      await user.click(within(screen.getByLabelText('반복 유형')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'daily-option' }));

      await user.click(screen.getByTestId('event-submit-button'));

      expect(screen.queryByText('일정 겹침 경고')).not.toBeInTheDocument();
    });
  });
});
