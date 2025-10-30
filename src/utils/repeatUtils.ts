import { EventForm, RepeatType } from '../types';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, 7 * weeks);
}

function getDaysInMonth(year: number, monthIndex0Based: number): number {
  return new Date(year, monthIndex0Based + 1, 0).getDate();
}

// Adds months but only returns a date if the exact same day exists in the target month.
// Example: Jan 31 + 1 month -> null for February (skip), Mar 31 -> valid
function addMonthsExactFromBase(base: Date, months: number, baseDay?: number): Date | null {
  const desiredDay = baseDay ?? base.getDate();
  const target = new Date(base);
  const targetMonthIndex = base.getMonth() + months;
  target.setMonth(targetMonthIndex, 1); // first day to avoid overflow
  const year = target.getFullYear();
  const monthIndex = target.getMonth();
  const daysInTarget = getDaysInMonth(year, monthIndex);
  if (desiredDay > daysInTarget) {
    return null; // exact same day does not exist in this month
  }
  target.setDate(desiredDay);
  return target;
}

// Adds years but only returns a date if the exact same month/day exists (e.g., Feb 29 only in leap years)
function addYearsExactFromBase(
  base: Date,
  years: number,
  baseMonth?: number,
  baseDay?: number
): Date | null {
  const monthIndex = baseMonth ?? base.getMonth();
  const day = baseDay ?? base.getDate();
  const year = base.getFullYear() + years;

  if (monthIndex === 1 && day === 29 && !isLeapYear(year)) {
    return null; // Feb 29 only valid in leap years
  }

  const target = new Date(base);
  target.setFullYear(year, monthIndex, 1);
  const daysInTarget = getDaysInMonth(year, monthIndex);
  if (day > daysInTarget) return null;
  target.setDate(day);
  return target;
}

function clampInterval(interval: number): number {
  return Number.isFinite(interval) && interval >= 1 ? Math.floor(interval) : 1;
}

function isValidRepeatType(value: unknown): value is RepeatType {
  return (
    value === 'none' ||
    value === 'daily' ||
    value === 'weekly' ||
    value === 'monthly' ||
    value === 'yearly'
  );
}

export function generateRecurringEvents(baseEvent: EventForm): EventForm[] {
  const interval = clampInterval(baseEvent.repeat.interval);
  const start = new Date(baseEvent.date);
  const hasEnd = Boolean(baseEvent.repeat.endDate);
  const end = hasEnd ? new Date(baseEvent.repeat.endDate as string) : null;

  if (end && start > end) {
    return [];
  }

  const type = baseEvent.repeat.type;
  if (!isValidRepeatType(type) || type === 'none') {
    return [];
  }

  const results: EventForm[] = [];

  const pushIfInRange = (d: Date) => {
    if (!end || d <= end) {
      results.push({ ...baseEvent, date: formatDateYmd(d) });
      return true;
    }
    return false;
  };

  // Always include the start occurrence if in range
  if (!pushIfInRange(start)) return results;

  if (type === 'daily') {
    let cursor = new Date(start);
    while (true) {
      cursor = addDays(cursor, interval);
      if (!pushIfInRange(cursor)) break;
    }
    return results;
  }

  if (type === 'weekly') {
    let cursor = new Date(start);
    while (true) {
      cursor = addWeeks(cursor, interval);
      if (!pushIfInRange(cursor)) break;
    }
    return results;
  }

  if (type === 'monthly') {
    const baseDay = start.getDate();
    let monthsAhead = 0;
    while (true) {
      monthsAhead += interval;
      const next = addMonthsExactFromBase(start, monthsAhead, baseDay);
      if (!next) {
        // No exact day in this month — check boundary and skip
        const bound = new Date(start);
        bound.setMonth(start.getMonth() + monthsAhead, 1);
        if (end && bound > end) break;
        continue;
      }
      if (!pushIfInRange(next)) break;
    }
    return results;
  }

  if (type === 'yearly') {
    const baseMonth = start.getMonth();
    const baseDay = start.getDate();
    let yearsAhead = 0;
    while (true) {
      yearsAhead += interval;
      const next = addYearsExactFromBase(start, yearsAhead, baseMonth, baseDay);
      if (!next) {
        // Not a valid calendar date this year — check boundary and skip
        const bound = new Date(start);
        bound.setFullYear(start.getFullYear() + yearsAhead, baseMonth, 1);
        if (end && bound > end) break;
        continue;
      }
      if (!pushIfInRange(next)) break;
    }
    return results;
  }

  return results;
}

export type { EventForm };
