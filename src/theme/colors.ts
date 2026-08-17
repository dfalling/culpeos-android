/**
 * The culpeo palette: ten semantic roles, declared once per appearance.
 *
 * The app is a warm neutral shell. The only saturated things on screen are
 * photographs, map pins, and the primary action — everything else is ink,
 * muted, line, canvas, surface. Matches the web app's token set so the two
 * can't drift; see the style guide for the reasoning behind each value.
 *
 * Components consume these through {@link useTheme} rather than reading the
 * device color scheme directly, so there is exactly one declaration per role
 * and no `isDark ? … : …` at any use site.
 *
 * Contrast ratios below are measured against that appearance's own canvas. AA
 * is 4.5:1 for body text and 3:1 for borders and other non-text UI.
 */

export type ColorScheme = 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;

  /** Page background. Every full-screen region is canvas, never surface. */
  canvas: string;
  /** Raised above the page only: sheets, popovers, menus, floating cards. */
  surface: string;

  /** Body text, headings, icons. */
  ink: string;
  /** Secondary text, placeholders, disabled. */
  muted: string;
  /**
   * Dividers and rules — decoration, so deliberately quiet. Nothing relies on
   * seeing it, which is why it's allowed to sit under the 3:1 non-text bar.
   */
  line: string;
  /**
   * The boundary of a control: an input's border, a tappable button's edge.
   * `line`'s stronger sibling, the way `accentText` is `accent`'s — same role,
   * but this one is load-bearing, so it has to clear 3:1.
   *
   * Reach for this whenever the border is what tells you a control is there. A
   * text input is `surface` on `canvas`, and those two are 1.06:1 apart in light
   * and 1.10:1 in dark — the fill does no work in either scheme, so the border
   * is the only thing saying "field". At plain `line` in dark that came to
   * 1.32:1: a field you cannot find at night.
   */
  lineControl: string;

  /**
   * Culpeo rust. Sanctioned in exactly four places: the primary button, map
   * pins, focus rings and focused input borders, and active/selected states.
   * Everything else — badges, chips, category labels, counts, avatars — is
   * neutral, because each already carries an icon or its own wording.
   */
  accent: string;
  /** Rust for links and other small text; darker so it still clears AA. */
  accentText: string;
  /** The label sitting *on* an accent fill. Flips dark in dark mode. */
  onAccent: string;
  /** Validation text and borders. The only status color. */
  danger: string;

  // Alpha variants of the tokens above. Not new roles — the same token at an
  // opacity, kept here so use sites never compose one by hand.
  /** `line` at 15%: quiet secondary-button fill, subtle panel fill. */
  lineFill: string;
  /** `line` at 30%: pressed state of the above, and a switch's "off" track. */
  lineFillStrong: string;
  /** `accent` at 20%: focus ring. */
  accentRing: string;

  /** Scrim behind modal sheets. */
  scrim: string;

  /** Basemap style; see the note above MAP_STYLE_LIGHT. */
  mapStyleUrl: string;
};

// A dataviz basemap, not a streets one. The map is the largest colored surface
// in the app and a streets style fights the palette: `liberty` declares 44
// distinct colors at 0.178 mean saturation, including green parks and blue
// water that argue directly with a rust accent. `positron` is 29 colors at
// 0.026 — built as a substrate for overlaid data, which is exactly the
// arrangement here: the pins are the content, the map is context. It keeps
// faint land/water/road separation, so it still reads as a map rather than
// going flat the way a toner style would. `dark` is the same family.
const MAP_STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron';
const MAP_STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

/**
 * A token at partial opacity, as an `rgba()` string.
 *
 * Kept as alpha rather than pre-composited against the canvas because these
 * fills sit on both canvas and surface, and an alpha composites correctly
 * against whichever is behind it.
 */
function alpha(hex: string, a: number): string {
  const [r, g, b] = [1, 3, 5].map(i =>
    Number.parseInt(hex.slice(i, i + 2), 16),
  );
  return `rgba(${r},${g},${b},${a})`;
}

const LIGHT_LINE = '#8c8478';
const DARK_LINE = '#3a3532';
const LIGHT_ACCENT = '#a8623d';
const DARK_ACCENT = '#c47a52';

// One value for both appearances, because one value clears the bar in both:
// 4.60:1 / 4.88:1 on the light canvas and surface, 3.63:1 / 3.29:1 on the dark
// pair. It sits below dark `muted` (5.70:1), so it still reads as a border
// rather than as text. A second declaration would only be two things to keep in
// step for no gain.
const LINE_CONTROL = '#7a6f69';

export const lightTheme: Theme = {
  scheme: 'light',

  canvas: '#faf8f5',
  surface: '#ffffff',

  ink: '#221f1d', // 15.46:1 AAA
  muted: '#776e63', // 4.72:1 AA
  line: LIGHT_LINE, // 3.48:1 — decorative, no bar to clear
  lineControl: LINE_CONTROL, // 4.60:1 on canvas, 4.88:1 on surface

  accent: LIGHT_ACCENT, // 4.42:1 as a fill
  accentText: '#9d5a37', // 5.01:1 AA
  onAccent: '#ffffff', // 4.69:1 on accent
  danger: '#a8322d', // 6.27:1 AA

  lineFill: alpha(LIGHT_LINE, 0.15),
  lineFillStrong: alpha(LIGHT_LINE, 0.3),
  accentRing: alpha(LIGHT_ACCENT, 0.2),

  scrim: 'rgba(0,0,0,0.35)',

  mapStyleUrl: MAP_STYLE_LIGHT,
};

export const darkTheme: Theme = {
  scheme: 'dark',

  canvas: '#1a1817',
  surface: '#232120',

  ink: '#ebe7e2', // 14.37:1 AAA
  muted: '#9a9186', // 5.70:1 AA
  // 1.46:1 on the dark canvas. Fine for a rule between two things, which is all
  // this is for — anything whose border has to be *seen* uses lineControl.
  line: DARK_LINE,
  lineControl: LINE_CONTROL, // 3.63:1 on canvas, 3.29:1 on surface

  // Accent lightens in dark mode, so a white label on it drops to 3.36:1 —
  // hence onAccent flipping dark rather than staying a literal white.
  accent: DARK_ACCENT, // 5.27:1 as a fill
  accentText: DARK_ACCENT, // 5.27:1 AA — same value as accent here
  onAccent: '#1a1817', // 5.27:1 on accent
  danger: '#dd8577', // 6.48:1 AA, tuned to read as *text* on a dark canvas

  lineFill: alpha(DARK_LINE, 0.15),
  lineFillStrong: alpha(DARK_LINE, 0.3),
  accentRing: alpha(DARK_ACCENT, 0.2),

  scrim: 'rgba(0,0,0,0.6)',

  mapStyleUrl: MAP_STYLE_DARK,
};

// There is no `dangerFill` because nothing in the app fills with danger yet —
// the one destructive control is an outlined button using `danger` as border
// and text. Should a filled destructive button arrive, it needs its own token:
// dark `danger` is tuned to read as text on a dark canvas, which leaves it far
// too light under a white button label (2.73:1).

export function themeForScheme(scheme: string | null | undefined): Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
