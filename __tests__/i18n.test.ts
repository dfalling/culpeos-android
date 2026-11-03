/**
 * @format
 */

import {language, languageFor, stringsFor, t} from '../src/i18n';
import {formatSchedule} from '../src/map/formatSchedule';
import {metadataRows} from '../src/map/metadataRows';

const NOW = new Date(2026, 6, 27);
const es = stringsFor('es');
const pt = stringsFor('pt');

test('device locales map to a supported language', () => {
  expect(languageFor('es_ES')).toBe('es');
  expect(languageFor('es-419')).toBe('es');
  expect(languageFor('pt_BR')).toBe('pt');
  expect(languageFor('pt_PT')).toBe('pt');
  expect(languageFor('PT')).toBe('pt');
  expect(languageFor('en_US')).toBe('en');
});

test('unsupported or missing locales fall back to English', () => {
  expect(languageFor('fr_FR')).toBe('en');
  expect(languageFor('')).toBe('en');
  expect(languageFor(null)).toBe('en');
  expect(languageFor(undefined)).toBe('en');
});

test('the test environment runs in English', () => {
  expect(language).toBe('en');
  expect(t).toBe(stringsFor('en'));
});

// Walk a strings object and collect every plain-string leaf that's blank, so a
// translation can't ship an empty label.
function blankKeys(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.trim() ? [] : [path];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      blankKeys(child, path ? `${path}.${key}` : key),
    );
  }
  return [];
}

test.each(['en', 'es', 'pt'] as const)('%s has no blank strings', lang => {
  expect(blankKeys(stringsFor(lang))).toEqual([]);
  expect(stringsFor(lang).schedule.months).toHaveLength(12);
});

describe('Spanish schedules', () => {
  const format = (s: Parameters<typeof formatSchedule>[0]) =>
    formatSchedule(s, NOW, es.schedule);
  const day = {allDay: false, startDate: '2026-03-14', endDate: '2026-03-14'};

  test('dates are day-first with lowercase months', () => {
    expect(format({...day, allDay: true})).toBe('14 mar');
    expect(format({...day, allDay: true, startDate: '2027-09-02'})).toBe(
      '2 sept 2027 – 14 mar 2026',
    );
  });

  test('times use a 24-hour clock', () => {
    expect(format({...day, startTime: '09:00:00', endTime: '17:30:00'})).toBe(
      '9:00 – 17:30, 14 mar',
    );
    expect(format({...day, startTime: '14:30:00'})).toBe('14:30, 14 mar');
  });

  test('"until" takes the right article for the hour', () => {
    expect(format({...day, endTime: '17:00:00'})).toBe(
      'Hasta las 17:00, 14 mar',
    );
    expect(format({...day, endTime: '01:00:00'})).toBe('Hasta la 1:00, 14 mar');
  });

  test('multi-day ranges join with a dash', () => {
    expect(
      format({
        ...day,
        endDate: '2026-03-16',
        startTime: '09:00:00',
        endTime: '17:00:00',
      }),
    ).toBe('9:00, 14 mar – 17:00, 16 mar');
  });
});

describe('Portuguese schedules', () => {
  const format = (s: Parameters<typeof formatSchedule>[0]) =>
    formatSchedule(s, NOW, pt.schedule);
  const day = {allDay: false, startDate: '2026-02-03', endDate: '2026-02-03'};

  test('dates are day-first, times are zero-padded 24-hour', () => {
    expect(format({...day, allDay: true})).toBe('3 fev');
    expect(format({...day, startTime: '09:00:00', endTime: '17:30:00'})).toBe(
      '09:00 – 17:30, 3 fev',
    );
    expect(format({...day, endTime: '17:00:00'})).toBe('Até 17:00, 3 fev');
  });

  test('the year shows up outside the current year', () => {
    expect(format({...day, allDay: true, startDate: '2025-12-30'})).toBe(
      '30 dez 2025 – 3 fev 2026',
    );
  });
});

test('booking titles and the flight lookup are translated', () => {
  const rows = metadataRows(
    {type: 'Flight', number: 'IB3216', seat: '14C'},
    {hasLocation: false},
    es.booking,
  );
  expect(rows.map(row => row.title)).toEqual(['Vuelo', 'Asiento']);
  expect(rows[0].link).toBe(
    'https://www.google.com/search?q=estado%20del%20vuelo%20IB3216',
  );

  expect(
    metadataRows({type: 'bus', number: '7'}, undefined, pt.booking)[0].title,
  ).toBe('Ônibus');
});
