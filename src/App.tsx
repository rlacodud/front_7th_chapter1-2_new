import { Notifications, ChevronLeft, ChevronRight, Delete, Edit, Close } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useMemo, useState } from 'react';

import { RepeatIcon } from './components/RepeatIcon';
import { useCalendarView } from './hooks/useCalendarView.ts';
import { useEventForm } from './hooks/useEventForm.ts';
import { useEventOperations } from './hooks/useEventOperations.ts';
import { useNotifications } from './hooks/useNotifications.ts';
import { useSearch } from './hooks/useSearch.ts';
import { Event, EventForm, RepeatType } from './types';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from './utils/dateUtils';
import { findOverlappingEvents } from './utils/eventOverlap';
import {
  findOriginalEvent as findOriginalEventUtil,
  getRepeatId,
  isRecurringEventType,
} from './utils/recurringEventUtils';
import { generateRecurringEvents } from './utils/repeatUtils';
import { getTimeErrorMessage } from './utils/timeValidation';

const categories = ['업무', '개인', '가족', '기타'];

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

function App() {
  const {
    title,
    setTitle,
    date,
    setDate,
    startTime,
    endTime,
    description,
    setDescription,
    location,
    setLocation,
    category,
    setCategory,
    isRepeating,
    setIsRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    setRepeatInterval,
    repeatEndDate,
    setRepeatEndDate,
    notificationTime,
    setNotificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    setEditingEvent,
    handleStartTimeChange,
    handleEndTimeChange,
    resetForm,
    editEvent,
  } = useEventForm();

  const { events, saveEvent, deleteEvent, fetchEvents } = useEventOperations(
    Boolean(editingEvent),
    () => setEditingEvent(null)
  );

  const { notifications, notifiedEvents, setNotifications } = useNotifications(events);
  const { view, setView, currentDate, holidays, navigate } = useCalendarView();

  const getViewRange = () => {
    if (view === 'week') {
      const week = getWeekDates(currentDate);
      return { start: week[0], end: week[6] };
    }
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return { start: monthStart, end: monthEnd };
  };

  const formatYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 삭제된 반복 일정 날짜를 추적 (단일 삭제 시 해당 날짜의 인스턴스만 필터링)
  const [deletedRecurringDates, setDeletedRecurringDates] = useState<Map<string, Set<string>>>(
    new Map()
  );

  // 단일 수정된 반복 일정 날짜를 추적 (단일 수정 시 해당 날짜의 인스턴스만 필터링)
  const [editedRecurringDates, setEditedRecurringDates] = useState<Map<string, Set<string>>>(
    new Map()
  );

  const expandEventsForView = useCallback(
    (source: Event[], start: Date, end: Date): Event[] => {
      const endYmd = formatYmd(end);
      return source.flatMap((ev) => {
        if (ev.repeat.type === 'none') return [ev];
        const cappedEnd =
          ev.repeat.endDate && ev.repeat.endDate < endYmd ? ev.repeat.endDate : endYmd;
        const baseForm: EventForm = {
          title: ev.title,
          date: ev.date,
          startTime: ev.startTime,
          endTime: ev.endTime,
          description: ev.description,
          location: ev.location,
          category: ev.category,
          notificationTime: ev.notificationTime,
          repeat: {
            type: ev.repeat.type,
            interval: ev.repeat.interval,
            endDate: cappedEnd,
          },
        };
        const deletedDates = deletedRecurringDates.get(ev.id) || new Set();
        const editedDates = editedRecurringDates.get(ev.id) || new Set();
        const occurrences = generateRecurringEvents(baseForm)
          .filter((o) => new Date(o.date) >= start && new Date(o.date) <= end)
          .filter((o) => !deletedDates.has(o.date)) // 단일 삭제된 날짜 필터링
          .filter((o) => !editedDates.has(o.date)) // 단일 수정된 날짜 필터링 (해당 날짜의 반복 이벤트 제외)
          .map((o, idx) => ({
            ...ev,
            id: `${ev.id}-${o.date}-${idx}`,
            date: o.date,
            originalId: ev.id,
          }));
        return occurrences;
      });
    },
    [deletedRecurringDates, editedRecurringDates]
  );

  const viewRange = getViewRange();
  const expandedEvents = useMemo(
    () => expandEventsForView(events, viewRange.start, viewRange.end),
    [events, viewRange.start, viewRange.end, expandEventsForView]
  );
  const { searchTerm, filteredEvents, setSearchTerm } = useSearch(
    expandedEvents,
    currentDate,
    view
  );

  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const [pendingEventData, setPendingEventData] = useState<Event | EventForm | null>(null);

  // 반복 일정 삭제 확인 다이얼로그 상태
  const [isRecurringDeleteDialogOpen, setIsRecurringDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null);

  // 반복 일정 수정 확인 다이얼로그 상태
  const [isRecurringEditDialogOpen, setIsRecurringEditDialogOpen] = useState(false);
  const [editingRecurringEvent, setEditingRecurringEvent] = useState<Event | null>(null);
  const [editingRecurringEventDate, setEditingRecurringEventDate] = useState<string | null>(null);
  const [isSingleEdit, setIsSingleEdit] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  // 원본 이벤트 찾기 유틸리티 함수
  const findOriginalEvent = useCallback(
    (event: Event): Event => {
      return findOriginalEventUtil(event, events);
    },
    [events]
  );

  // 반복 일정인지 확인하는 함수
  const isRecurringEvent = useCallback((event: Event): boolean => {
    return isRecurringEventType(event);
  }, []);

  // 삭제된 반복 일정 날짜 추적 정보 정리 헬퍼 함수
  const clearDeletedRecurringDates = useCallback((eventId: string) => {
    setDeletedRecurringDates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(eventId);
      return newMap;
    });
  }, []);

  // 단일 삭제된 날짜 추가 헬퍼 함수
  const addDeletedRecurringDate = useCallback((eventId: string, date: string) => {
    setDeletedRecurringDates((prev) => {
      const newMap = new Map(prev);
      const dates = new Set(newMap.get(eventId) || []);
      dates.add(date);
      newMap.set(eventId, dates);
      return newMap;
    });
  }, []);

  // 단일 수정된 날짜 추가 헬퍼 함수
  const addEditedRecurringDate = useCallback((eventId: string, date: string) => {
    setEditedRecurringDates((prev) => {
      const newMap = new Map(prev);
      const dates = new Set(newMap.get(eventId) || []);
      dates.add(date);
      newMap.set(eventId, dates);
      return newMap;
    });
  }, []);

  // 단일 수정된 날짜 정리 헬퍼 함수
  const clearEditedRecurringDates = useCallback((eventId: string) => {
    setEditedRecurringDates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(eventId);
      return newMap;
    });
  }, []);

  // 반복 일정 삭제 핸들러
  const handleRecurringDeleteClick = useCallback(
    (event: Event) => {
      const originalEvent = findOriginalEvent(event);
      if (isRecurringEvent(originalEvent)) {
        setSelectedEvent(originalEvent);
        setSelectedEventDate(event.date);
        setIsRecurringDeleteDialogOpen(true);
      } else {
        deleteEvent(event.id);
      }
    },
    [findOriginalEvent, isRecurringEvent, deleteEvent]
  );

  // 반복 일정 수정 핸들러
  const handleRecurringEditClick = useCallback(
    (event: Event) => {
      const originalEvent = findOriginalEvent(event);
      if (isRecurringEvent(originalEvent)) {
        setEditingRecurringEvent(originalEvent);
        setEditingRecurringEventDate(event.date);
        setIsRecurringEditDialogOpen(true);
      } else {
        editEvent(event);
      }
    },
    [findOriginalEvent, isRecurringEvent, editEvent]
  );

  // 단일 수정 처리
  const handleSingleEdit = useCallback(() => {
    setIsRecurringEditDialogOpen(false);
    if (editingRecurringEvent && editingRecurringEventDate) {
      setIsSingleEdit(true);
      // 해당 날짜를 수정된 날짜로 추적하여 반복 인스턴스 필터링
      addEditedRecurringDate(editingRecurringEvent.id, editingRecurringEventDate);

      // 해당 날짜의 이벤트만 수정하기 위해 editEvent 호출
      // 단일 수정이므로 반복 설정을 해제한 이벤트를 생성
      const eventToEdit: Event = {
        ...editingRecurringEvent,
        date: editingRecurringEventDate,
        repeat: { type: 'none', interval: 1 },
      };
      editEvent(eventToEdit);
      // editingRecurringEvent는 addOrUpdateEvent에서 사용되므로 유지
      // setEditingRecurringEvent(null);
      // setEditingRecurringEventDate(null);
    }
  }, [editingRecurringEvent, editingRecurringEventDate, editEvent, addEditedRecurringDate]);

  // 전체 수정 처리
  const handleEditAll = useCallback(() => {
    setIsRecurringEditDialogOpen(false);
    if (editingRecurringEvent) {
      setIsSingleEdit(false);
      // 전체 수정이므로 수정된 날짜 추적 정보 초기화
      clearEditedRecurringDates(editingRecurringEvent.id);
      // 전체 수정이므로 원본 이벤트로 editEvent 호출
      editEvent(editingRecurringEvent);
      setEditingRecurringEvent(null);
      setEditingRecurringEventDate(null);
    }
  }, [editingRecurringEvent, editEvent, clearEditedRecurringDates]);

  // 단일 삭제 처리
  const handleSingleDelete = useCallback(() => {
    setIsRecurringDeleteDialogOpen(false);
    if (selectedEvent && selectedEventDate) {
      addDeletedRecurringDate(selectedEvent.id, selectedEventDate);
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    }
    setSelectedEvent(null);
    setSelectedEventDate(null);
  }, [selectedEvent, selectedEventDate, addDeletedRecurringDate, enqueueSnackbar]);

  // 전체 삭제 처리
  const handleDeleteAll = useCallback(async () => {
    setIsRecurringDeleteDialogOpen(false);
    if (!selectedEvent) {
      setSelectedEvent(null);
      setSelectedEventDate(null);
      return;
    }

    const repeatId = getRepeatId(selectedEvent);

    if (repeatId) {
      // repeat.id가 있는 경우: API로 전체 삭제
      try {
        const response = await fetch(`/api/recurring-events/${repeatId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete recurring events');
        }

        clearDeletedRecurringDates(selectedEvent.id);
        await fetchEvents();
        enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
      } catch (error) {
        console.error('Error deleting recurring events:', error);
        enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
      }
    } else {
      // repeat.id가 없는 경우: 원본 이벤트만 삭제
      clearDeletedRecurringDates(selectedEvent.id);
      deleteEvent(selectedEvent.id);
    }

    setSelectedEvent(null);
    setSelectedEventDate(null);
  }, [selectedEvent, clearDeletedRecurringDates, fetchEvents, enqueueSnackbar, deleteEvent]);

  const addOrUpdateEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
      enqueueSnackbar('필수 정보를 모두 입력해주세요.', { variant: 'error' });
      return;
    }

    if (startTimeError || endTimeError) {
      enqueueSnackbar('시간 설정을 확인해주세요.', { variant: 'error' });
      return;
    }

    let eventData: Event | EventForm;

    // 단일 수정인 경우: repeat.type을 'none'으로 변경하고 새 이벤트로 저장
    if (isSingleEdit && editingEvent && editingRecurringEvent) {
      if (isRecurringEvent(editingRecurringEvent)) {
        // 단일 수정은 새 이벤트로 저장해야 함 (id 없이)
        eventData = {
          title,
          date,
          startTime,
          endTime,
          description,
          location,
          category,
          repeat: {
            type: 'none',
            interval: 1,
          },
          notificationTime,
        };

        // 단일 수정의 경우 겹침 체크 생략 (원본 반복 이벤트와 겹치는 것은 정상)

        // 바로 저장
        try {
          // 단일 수정은 새 이벤트 생성이므로 직접 POST 요청
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });

          if (!response.ok) {
            throw new Error('Failed to save event');
          }

          setIsSingleEdit(false);
          await fetchEvents();
          setEditingEvent(null);
          setEditingRecurringEvent(null);
          setEditingRecurringEventDate(null);
          resetForm();
          enqueueSnackbar('일정이 추가되었습니다.', { variant: 'success' });
        } catch (error) {
          console.error('Failed to save single edit:', error);
          enqueueSnackbar('일정 저장 실패', { variant: 'error' });
        }
        return;
      } else {
        eventData = {
          id: editingEvent.id,
          title,
          date,
          startTime,
          endTime,
          description,
          location,
          category,
          repeat: {
            type: isRepeating ? repeatType : 'none',
            interval: repeatInterval,
            endDate: repeatEndDate || undefined,
          },
          notificationTime,
        };
      }
    } else {
      eventData = {
        id: editingEvent ? editingEvent.id : undefined,
        title,
        date,
        startTime,
        endTime,
        description,
        location,
        category,
        repeat: {
          type: isRepeating ? repeatType : 'none',
          interval: repeatInterval,
          endDate: repeatEndDate || undefined,
        },
        notificationTime,
      };

      // 전체 수정인 경우: 반복 속성 유지 (이미 폼에서 설정됨)
      if (editingEvent && !isSingleEdit) {
        const originalEvent = findOriginalEvent(editingEvent);
        const repeatId = getRepeatId(originalEvent);
        if (isRecurringEvent(originalEvent)) {
          // 일정 겹침 체크는 하지 않음 (전체 수정이므로 기존 이벤트들과 겹치는 것은 정상)

          // 전체 수정 시에는 원본 이벤트의 정보 유지
          const updateData = {
            title,
            date: originalEvent.date, // 원본 이벤트의 시작일 사용
            startTime,
            endTime,
            description,
            location,
            category,
            repeat: originalEvent.repeat, // 원본 repeat 정보 유지 (id 포함)
            notificationTime,
          };

          // repeatId가 있는 경우: API로 전체 수정
          if (repeatId) {
            try {
              const response = await fetch(`/api/recurring-events/${repeatId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
              });

              if (!response.ok) {
                throw new Error('Failed to update recurring events');
              }

              // 전체 수정이므로 단일 수정 추적 정보 제거
              clearEditedRecurringDates(originalEvent.id);

              await fetchEvents();
              resetForm();
              enqueueSnackbar('일정이 저장되었습니다.', { variant: 'success' });
              return;
            } catch (error) {
              console.error('Error updating recurring events:', error);
              enqueueSnackbar('일정 저장 실패', { variant: 'error' });
              return;
            }
          } else {
            // repeatId가 없는 경우: 원본 이벤트만 PUT 요청
            // App에서 전개되므로 원본만 업데이트하면 자동으로 반영됨
            try {
              const response = await fetch(`/api/events/${originalEvent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
              });

              if (!response.ok) {
                throw new Error('Failed to update recurring events');
              }

              // 전체 수정이므로 단일 수정 추적 정보 제거
              clearEditedRecurringDates(originalEvent.id);

              await fetchEvents();
              resetForm();
              enqueueSnackbar('일정이 저장되었습니다.', { variant: 'success' });
              return;
            } catch (error) {
              console.error('Error updating recurring events:', error);
              enqueueSnackbar('일정 저장 실패', { variant: 'error' });
              return;
            }
          }
        }
      }
    }

    const overlapping = findOverlappingEvents(eventData, events);
    if (overlapping.length > 0) {
      setPendingEventData(eventData);
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
    } else {
      await saveEvent(eventData);
      resetForm();
    }
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    return (
      <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatWeek(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {weekDates.map((date) => (
                  <TableCell
                    key={date.toISOString()}
                    sx={{
                      height: '120px',
                      verticalAlign: 'top',
                      width: '14.28%',
                      padding: 1,
                      border: '1px solid #e0e0e0',
                      overflow: 'hidden',
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {date.getDate()}
                    </Typography>
                    {filteredEvents
                      .filter(
                        (event) => new Date(event.date).toDateString() === date.toDateString()
                      )
                      .map((event) => {
                        const isNotified = notifiedEvents.includes(event.id);
                        const isRecurring = event.repeat.type !== 'none';
                        return (
                          <Box
                            key={event.id}
                            data-testid={`event-${event.id}`}
                            data-event-id={event.id}
                            data-recurring={isRecurring ? 'true' : undefined}
                            sx={{
                              p: 0.5,
                              my: 0.5,
                              backgroundColor: isNotified ? '#ffebee' : '#f5f5f5',
                              borderRadius: 1,
                              fontWeight: isNotified ? 'bold' : 'normal',
                              color: isNotified ? '#d32f2f' : 'inherit',
                              minHeight: '18px',
                              width: '100%',
                              overflow: 'hidden',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              {isNotified && <Notifications fontSize="small" />}
                              <RepeatIcon isRepeating={isRecurring} showTestId={isRecurring} />
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                              >
                                {event.title}
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  const renderMonthView = () => {
    const weeks = getWeeksAtMonth(currentDate);

    return (
      <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatMonth(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {weeks.map((week, weekIndex) => (
                <TableRow key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const dateString = day ? formatDate(currentDate, day) : '';
                    const holiday = holidays[dateString];

                    return (
                      <TableCell
                        key={dayIndex}
                        sx={{
                          height: '120px',
                          verticalAlign: 'top',
                          width: '14.28%',
                          padding: 1,
                          border: '1px solid #e0e0e0',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {day && (
                          <>
                            <Typography variant="body2" fontWeight="bold">
                              {day}
                            </Typography>
                            {holiday && (
                              <Typography variant="body2" color="error">
                                {holiday}
                              </Typography>
                            )}
                            {getEventsForDay(filteredEvents, day).map((event) => {
                              const isNotified = notifiedEvents.includes(event.id);
                              const isRecurring = event.repeat.type !== 'none';
                              return (
                                <Box
                                  key={event.id}
                                  data-testid={`event-${event.id}`}
                                  data-event-id={event.id}
                                  data-recurring={isRecurring ? 'true' : undefined}
                                  sx={{
                                    p: 0.5,
                                    my: 0.5,
                                    backgroundColor: isNotified ? '#ffebee' : '#f5f5f5',
                                    borderRadius: 1,
                                    fontWeight: isNotified ? 'bold' : 'normal',
                                    color: isNotified ? '#d32f2f' : 'inherit',
                                    minHeight: '18px',
                                    width: '100%',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    {isNotified && <Notifications fontSize="small" />}
                                    <RepeatIcon
                                      isRepeating={isRecurring}
                                      showTestId={isRecurring}
                                    />
                                    <Typography
                                      variant="caption"
                                      noWrap
                                      sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                                    >
                                      {event.title}
                                    </Typography>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
      <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
        <Stack spacing={2} sx={{ width: '20%' }}>
          <Typography variant="h4">{editingEvent ? '일정 수정' : '일정 추가'}</Typography>

          <FormControl fullWidth>
            <FormLabel htmlFor="title">제목</FormLabel>
            <TextField
              id="title"
              size="small"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="date">날짜</FormLabel>
            <TextField
              id="date"
              size="small"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormControl>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <FormLabel htmlFor="start-time">시작 시간</FormLabel>
              <Tooltip title={startTimeError || ''} open={!!startTimeError} placement="top">
                <TextField
                  id="start-time"
                  size="small"
                  type="time"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  onBlur={() => getTimeErrorMessage(startTime, endTime)}
                  error={!!startTimeError}
                />
              </Tooltip>
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="end-time">종료 시간</FormLabel>
              <Tooltip title={endTimeError || ''} open={!!endTimeError} placement="top">
                <TextField
                  id="end-time"
                  size="small"
                  type="time"
                  value={endTime}
                  onChange={handleEndTimeChange}
                  onBlur={() => getTimeErrorMessage(startTime, endTime)}
                  error={!!endTimeError}
                />
              </Tooltip>
            </FormControl>
          </Stack>

          <FormControl fullWidth>
            <FormLabel htmlFor="description">설명</FormLabel>
            <TextField
              id="description"
              size="small"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="location">위치</FormLabel>
            <TextField
              id="location"
              size="small"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel id="category-label">카테고리</FormLabel>
            <Select
              id="category"
              size="small"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-labelledby="category-label"
              aria-label="카테고리"
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat} aria-label={`${cat}-option`}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isRepeating}
                  onChange={(e) => setIsRepeating(e.target.checked)}
                />
              }
              label="반복 일정"
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="notification">알림 설정</FormLabel>
            <Select
              id="notification"
              size="small"
              value={notificationTime}
              onChange={(e) => setNotificationTime(Number(e.target.value))}
            >
              {notificationOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isRepeating && (
            <Stack spacing={2}>
              <FormControl fullWidth>
                <FormLabel>반복 유형</FormLabel>
                <Select
                  size="small"
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value as RepeatType)}
                >
                  <MenuItem value="daily">매일</MenuItem>
                  <MenuItem value="weekly">매주</MenuItem>
                  <MenuItem value="monthly">매월</MenuItem>
                  <MenuItem value="yearly">매년</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <FormLabel>반복 간격</FormLabel>
                  <TextField
                    size="small"
                    type="number"
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(Number(e.target.value))}
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel>반복 종료일</FormLabel>
                  <TextField
                    size="small"
                    type="date"
                    value={repeatEndDate}
                    onChange={(e) => setRepeatEndDate(e.target.value)}
                  />
                </FormControl>
              </Stack>
            </Stack>
          )}

          <Button
            data-testid="event-submit-button"
            onClick={addOrUpdateEvent}
            variant="contained"
            color="primary"
          >
            {editingEvent ? '일정 수정' : '일정 추가'}
          </Button>
        </Stack>

        <Stack flex={1} spacing={5}>
          <Typography variant="h4">일정 보기</Typography>

          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <IconButton aria-label="Previous" onClick={() => navigate('prev')}>
              <ChevronLeft />
            </IconButton>
            <Select
              size="small"
              aria-label="뷰 타입 선택"
              value={view}
              onChange={(e) => setView(e.target.value as 'week' | 'month')}
            >
              <MenuItem value="week" aria-label="week-option">
                Week
              </MenuItem>
              <MenuItem value="month" aria-label="month-option">
                Month
              </MenuItem>
            </Select>
            <IconButton aria-label="Next" onClick={() => navigate('next')}>
              <ChevronRight />
            </IconButton>
          </Stack>

          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
        </Stack>

        <Stack
          data-testid="event-list"
          spacing={2}
          sx={{ width: '30%', height: '100%', overflowY: 'auto' }}
        >
          <FormControl fullWidth>
            <FormLabel htmlFor="search">일정 검색</FormLabel>
            <TextField
              id="search"
              size="small"
              placeholder="검색어를 입력하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormControl>

          {filteredEvents.length === 0 ? (
            <Typography>검색 결과가 없습니다.</Typography>
          ) : (
            filteredEvents.map((event) => (
              <Box key={event.id} sx={{ border: 1, borderRadius: 2, p: 3, width: '100%' }}>
                <Stack direction="row" justifyContent="space-between">
                  <Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {notifiedEvents.includes(event.id) && <Notifications color="error" />}
                      <RepeatIcon isRepeating={event.repeat.type !== 'none'} showTestId={true} />
                      <Typography
                        fontWeight={notifiedEvents.includes(event.id) ? 'bold' : 'normal'}
                        color={notifiedEvents.includes(event.id) ? 'error' : 'inherit'}
                      >
                        {event.title}
                      </Typography>
                    </Stack>
                    <Typography>{event.date}</Typography>
                    <Typography>
                      {event.startTime} - {event.endTime}
                    </Typography>
                    <Typography>{event.description}</Typography>
                    <Typography>{event.location}</Typography>
                    <Typography>카테고리: {event.category}</Typography>
                    {event.repeat.type !== 'none' && (
                      <Typography>
                        반복: {event.repeat.interval}
                        {event.repeat.type === 'daily' && '일'}
                        {event.repeat.type === 'weekly' && '주'}
                        {event.repeat.type === 'monthly' && '월'}
                        {event.repeat.type === 'yearly' && '년'}
                        마다
                        {event.repeat.endDate && ` (종료: ${event.repeat.endDate})`}
                      </Typography>
                    )}
                    <Typography>
                      알림:{' '}
                      {
                        notificationOptions.find(
                          (option) => option.value === event.notificationTime
                        )?.label
                      }
                    </Typography>
                  </Stack>
                  <Stack>
                    <IconButton
                      aria-label="Edit event"
                      onClick={() => handleRecurringEditClick(event)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      aria-label="Delete event"
                      onClick={() => handleRecurringDeleteClick(event)}
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </Stack>

      <Dialog open={isOverlapDialogOpen} onClose={() => setIsOverlapDialogOpen(false)}>
        <DialogTitle>일정 겹침 경고</DialogTitle>
        <DialogContent>
          <DialogContentText>다음 일정과 겹칩니다:</DialogContentText>
          {overlappingEvents.map((event) => (
            <DialogContentText key={event.id}>
              {event.title} ({event.date} {event.startTime}-{event.endTime})
            </DialogContentText>
          ))}
          <DialogContentText>계속 진행하시겠습니까?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOverlapDialogOpen(false)}>취소</Button>
          <Button
            color="error"
            onClick={async () => {
              setIsOverlapDialogOpen(false);
              if (pendingEventData) {
                try {
                  if (isSingleEdit) {
                    // 단일 수정은 직접 POST
                    const response = await fetch('/api/events', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(pendingEventData),
                    });

                    if (!response.ok) {
                      throw new Error('Failed to save event');
                    }

                    setIsSingleEdit(false);
                    await fetchEvents();
                    setEditingEvent(null);
                    enqueueSnackbar('일정이 추가되었습니다.', { variant: 'success' });
                  } else {
                    // 일반 저장
                    await saveEvent(pendingEventData);
                  }

                  resetForm();
                  setPendingEventData(null);
                } catch (error) {
                  console.error('Failed to save event:', error);
                  enqueueSnackbar('일정 저장 실패', { variant: 'error' });
                }
              }
            }}
          >
            계속 진행
          </Button>
        </DialogActions>
      </Dialog>

      {/* 반복 일정 삭제 확인 다이얼로그 */}
      <Dialog
        open={isRecurringDeleteDialogOpen}
        onClose={() => setIsRecurringDeleteDialogOpen(false)}
      >
        <DialogTitle>반복 일정 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>해당 일정만 삭제하시겠어요?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSingleDelete}>예</Button>
          <Button onClick={handleDeleteAll}>아니오</Button>
        </DialogActions>
      </Dialog>

      {/* 반복 일정 수정 확인 다이얼로그 */}
      <Dialog open={isRecurringEditDialogOpen} onClose={() => setIsRecurringEditDialogOpen(false)}>
        <DialogTitle>반복 일정 수정</DialogTitle>
        <DialogContent>
          <DialogContentText>반복 일정을 수정하시겠습니까?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSingleEdit}>예</Button>
          <Button onClick={handleEditAll}>아니오</Button>
        </DialogActions>
      </Dialog>

      {notifications.length > 0 && (
        <Stack position="fixed" top={16} right={16} spacing={2} alignItems="flex-end">
          {notifications.map((notification, index) => (
            <Alert
              key={index}
              severity="info"
              sx={{ width: 'auto' }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Close />
                </IconButton>
              }
            >
              <AlertTitle>{notification.message}</AlertTitle>
            </Alert>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default App;
