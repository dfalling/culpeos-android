// Render a Schedule the way a person would say it out loud: the time comes
// first, then the day it falls on ("9 AM, Mar 14 to 5 PM, Mar 16"), and
// anything redundant is dropped — a shared date is written once, the year only
// shows up when the schedule isn't in the current year.
//
// Dates and times arrive as ISO8601 fragments (`2026-03-14`, `14:30:00`) in the
// element's own timezone, so they're split by hand rather than fed to `Date`,
// which would reinterpret them in the device's zone and slide the day around.
//
// The wording and the date/time shapes (month-first vs day-first, 12- vs
// 24-hour clock) come from the active language's strings.

import {type Strings, t} from '../i18n';

export type FormattableSchedule = {
  allDay: boolean;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
};

export function formatSchedule(
  schedule: FormattableSchedule,
  now: Date = new Date(),
  strings: Strings['schedule'] = t.schedule,
): string {
  const {allDay, startDate, endDate} = schedule;
  // An all-day schedule may still carry times from an earlier edit; ignore them.
  const startTime = allDay ? null : schedule.startTime;
  const endTime = allDay ? null : schedule.endTime;

  // Either date needing a year forces it onto both, so a range that straddles
  // New Year's doesn't read as "Dec 30 to Jan 2, 2027".
  const withYear =
    yearOf(startDate) !== now.getFullYear() ||
    yearOf(endDate) !== now.getFullYear();
  const start = formatDate(startDate, withYear, strings);
  const end = formatDate(endDate, withYear, strings);
  const time = (value: string) => formatTime(value, strings);

  if (startDate === endDate) {
    if (startTime && endTime) {
      return strings.timeRange(time(startTime), time(endTime), start);
    }
    if (startTime) return strings.at(time(startTime), start);
    if (endTime) return strings.until(time(endTime), start, hoursOf(endTime));
    return start;
  }

  const from = startTime ? strings.at(time(startTime), start) : start;
  const to = endTime ? strings.at(time(endTime), end) : end;
  return strings.range(from, to);
}

function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

function hoursOf(time: string): number {
  return Number(time.split(':')[0]);
}

// `2026-03-14` -> `Mar 14` / `Mar 14, 2026` (or the language's equivalent)
function formatDate(
  date: string,
  withYear: boolean,
  strings: Strings['schedule'],
): string {
  const [year, month, day] = date.split('-').map(Number);
  const name = strings.months[month - 1];
  if (!name || !day) return date;
  return strings.date(day, name, withYear ? year : undefined);
}

// `14:30:00` -> `2:30 PM` / `14:30`
function formatTime(time: string, strings: Strings['schedule']): string {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  return strings.time(hours, minutes);
}
