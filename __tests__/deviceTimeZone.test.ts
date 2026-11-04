import {deviceTimeZone} from '../src/trips/deviceTimeZone';

const realDateTimeFormat = Intl.DateTimeFormat;

function stubTimeZone(timeZone: unknown) {
  Intl.DateTimeFormat = (() => ({
    resolvedOptions: () => ({timeZone}),
  })) as unknown as typeof Intl.DateTimeFormat;
}

afterEach(() => {
  Intl.DateTimeFormat = realDateTimeFormat;
});

test('returns the IANA zone the engine reports', () => {
  stubTimeZone('America/Sao_Paulo');
  expect(deviceTimeZone()).toBe('America/Sao_Paulo');
});

test('drops values that are not IANA zone ids', () => {
  stubTimeZone(undefined);
  expect(deviceTimeZone()).toBeUndefined();
  stubTimeZone('UTC');
  expect(deviceTimeZone()).toBeUndefined();
});

test('survives an engine without Intl support', () => {
  Intl.DateTimeFormat = (() => {
    throw new Error('no Intl');
  }) as unknown as typeof Intl.DateTimeFormat;
  expect(deviceTimeZone()).toBeUndefined();
});
