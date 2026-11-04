/**
 * The device's IANA time zone (e.g. `America/Sao_Paulo`), or undefined when the
 * JS engine can't say — in which case the API applies its own default rather
 * than being sent something it would reject.
 */
export function deviceTimeZone(): string | undefined {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zone === 'string' && zone.includes('/') ? zone : undefined;
  } catch {
    return undefined;
  }
}
