/**
 * Semantic color tokens for light and dark mode.
 *
 * Components consume these through {@link useTheme} rather than reading the
 * device color scheme directly, so the same `Theme` shape drives both
 * appearances and there is a single place to tune either palette.
 */

export type ColorScheme = 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;

  // Surfaces, from furthest-back to nearest.
  background: string; // screen background behind everything
  card: string; // cards, sheets, floating overlays
  surfaceMuted: string; // subtle fills: inputs, close buttons, pills

  // Text, in descending emphasis.
  textPrimary: string;
  textSecondary: string;
  textTertiary: string; // placeholders, disabled, faint captions

  // Lines.
  border: string;

  // Brand accent (blue) and its tints.
  accent: string; // primary actions, links, icons
  accentStrong: string; // pressed/selected accent
  accentMuted: string; // accent-tinted background (badge/glyph wrap)

  // Secondary "action" color (teal): solid buttons and inline actions
  // (login button, Edit/Save text).
  action: string;
  onAction: string; // text/icon drawn on top of an `action` fill

  // Secondary "trip" accent (purple) and its tint.
  trip: string;
  tripMuted: string;

  // Status colors and their tints.
  error: string;
  success: string;
  successMuted: string;

  // Scrim behind modal sheets.
  scrim: string;

  // Map.
  mapStyleUrl: string;
  pin: string; // teardrop pin fill
  pinBorder: string; // hairline outline around a pin, for contrast
  mapButtonBg: string; // recenter button background
  mapButtonIcon: string;
};

const MAP_STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/liberty';
const MAP_STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

// Pins are the same Google-Maps red in both appearances, matching the web app
// (`.maplibre-marker-pin` in culpeos assets/css/app.css) so the same place
// reads the same wherever it's opened. The outline is a translucent black
// hairline rather than a theme color, which works over either basemap.
const PIN_RED = '#ea4335';
const PIN_OUTLINE = 'rgba(0,0,0,0.2)';

export const lightTheme: Theme = {
  scheme: 'light',

  background: '#ffffff',
  card: '#ffffff',
  surfaceMuted: '#f1f1f1',

  textPrimary: '#111111',
  textSecondary: '#666666',
  textTertiary: '#999999',

  border: '#dddddd',

  accent: '#1d6fe0',
  accentStrong: '#0b4ea2',
  accentMuted: '#eef3fb',

  action: '#0a7ea4',
  onAction: '#ffffff',

  trip: '#7a3ff2',
  tripMuted: '#efe9fd',

  error: '#cc0000',
  success: '#1e8e3e',
  successMuted: '#e6f4ea',

  scrim: 'rgba(0,0,0,0.35)',

  mapStyleUrl: MAP_STYLE_LIGHT,
  pin: PIN_RED,
  pinBorder: PIN_OUTLINE,
  mapButtonBg: '#ffffff',
  mapButtonIcon: '#1d6fe0',
};

export const darkTheme: Theme = {
  scheme: 'dark',

  background: '#121212',
  card: '#1e1e1e',
  surfaceMuted: '#2a2a2a',

  textPrimary: '#f2f2f2',
  textSecondary: '#b0b0b0',
  textTertiary: '#7e7e7e',

  border: '#3a3a3a',

  accent: '#4f93f0',
  accentStrong: '#7badf5',
  accentMuted: '#1b2a44',

  action: '#3aa9cf',
  onAction: '#ffffff',

  trip: '#a988f7',
  tripMuted: '#2a2147',

  error: '#ff6b6b',
  success: '#5bd07f',
  successMuted: '#16331f',

  scrim: 'rgba(0,0,0,0.6)',

  mapStyleUrl: MAP_STYLE_DARK,
  pin: PIN_RED,
  pinBorder: PIN_OUTLINE,
  mapButtonBg: '#1e1e1e',
  mapButtonIcon: '#4f93f0',
};

export function themeForScheme(scheme: string | null | undefined): Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
