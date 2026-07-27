/**
 * @format
 */

import {formatSchedule} from '../src/map/formatSchedule';

const NOW = new Date(2026, 6, 27);

const schedule = (
  overrides: Partial<Parameters<typeof formatSchedule>[0]>,
) => ({
  allDay: false,
  startDate: '2026-03-14',
  endDate: '2026-03-14',
  startTime: null,
  endTime: null,
  ...overrides,
});

test('an all-day single day is just the date', () => {
  expect(formatSchedule(schedule({allDay: true}), NOW)).toBe('Mar 14');
});

test('an all-day range reads as a date range', () => {
  expect(
    formatSchedule(schedule({allDay: true, endDate: '2026-03-16'}), NOW),
  ).toBe('Mar 14 to Mar 16');
});

test('times on a single day share the date', () => {
  expect(
    formatSchedule(schedule({startTime: '09:00:00', endTime: '17:30:00'}), NOW),
  ).toBe('9 AM to 5:30 PM, Mar 14');
});

test('a multi-day range puts each time before its own date', () => {
  expect(
    formatSchedule(
      schedule({
        endDate: '2026-03-16',
        startTime: '09:15:00',
        endTime: '17:00:00',
      }),
      NOW,
    ),
  ).toBe('9:15 AM, Mar 14 to 5 PM, Mar 16');
});

test('a start time alone still leads', () => {
  expect(formatSchedule(schedule({startTime: '12:00:00'}), NOW)).toBe(
    '12 PM, Mar 14',
  );
});

test('an end time alone reads as a deadline', () => {
  expect(formatSchedule(schedule({endTime: '00:30:00'}), NOW)).toBe(
    'Until 12:30 AM, Mar 14',
  );
});

test('only one of the times is present on a range', () => {
  expect(
    formatSchedule(
      schedule({endDate: '2026-03-16', startTime: '09:00:00'}),
      NOW,
    ),
  ).toBe('9 AM, Mar 14 to Mar 16');
});

test('all day wins over stale times', () => {
  expect(
    formatSchedule(
      schedule({allDay: true, startTime: '09:00:00', endTime: '17:00:00'}),
      NOW,
    ),
  ).toBe('Mar 14');
});

test('other years show the year on both ends of the range', () => {
  expect(
    formatSchedule(
      schedule({startDate: '2026-12-30', endDate: '2027-01-02', allDay: true}),
      NOW,
    ),
  ).toBe('Dec 30, 2026 to Jan 2, 2027');
});
