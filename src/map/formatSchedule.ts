// Render a Schedule the way a person would say it out loud: the time comes
// first, then the day it falls on ("9 AM, Mar 14 to 5 PM, Mar 16"), and
// anything redundant is dropped — a shared date is written once, the year only
// shows up when the schedule isn't in the current year.
//
// Dates and times arrive as ISO8601 fragments (`2026-03-14`, `14:30:00`) in the
// element's own timezone, so they're split by hand rather than fed to `Date`,
// which would reinterpret them in the device's zone and slide the day around.

export type FormattableSchedule = {
  allDay: boolean;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatSchedule(
  schedule: FormattableSchedule,
  now: Date = new Date(),
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
  const start = formatDate(startDate, withYear);
  const end = formatDate(endDate, withYear);

  if (startDate === endDate) {
    if (startTime && endTime) {
      return `${formatTime(startTime)} to ${formatTime(endTime)}, ${start}`;
    }
    if (startTime) return `${formatTime(startTime)}, ${start}`;
    if (endTime) return `Until ${formatTime(endTime)}, ${start}`;
    return start;
  }

  const from = startTime ? `${formatTime(startTime)}, ${start}` : start;
  const to = endTime ? `${formatTime(endTime)}, ${end}` : end;
  return `${from} to ${to}`;
}

function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

// `2026-03-14` -> `Mar 14` / `Mar 14, 2026`
function formatDate(date: string, withYear: boolean): string {
  const [year, month, day] = date.split('-').map(Number);
  const name = MONTHS[month - 1];
  if (!name || !day) return date;
  return withYear ? `${name} ${day}, ${year}` : `${name} ${day}`;
}

// `14:30:00` -> `2:30 PM`; a whole hour drops the minutes -> `2 PM`
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  const meridiem = hours < 12 ? 'AM' : 'PM';
  const hour = hours % 12 || 12;
  return minutes === 0
    ? `${hour} ${meridiem}`
    : `${hour}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}
