import type {Theme} from '../theme/colors';

/**
 * The emoji picker's palette, in our tokens.
 *
 * `rn-emoji-keyboard` ships a hardcoded light theme — a white container and
 * `#005b96` for the active category and pressed buttons. It has no notion of a
 * color scheme, so in dark mode it opens as a white sheet with a blue highlight
 * over the app's dark canvas, and nothing in our own source would have shown
 * that. Its `theme` prop is the whole fix.
 *
 * The emoji themselves stay full color, of course: imagery carrying the color
 * is the point of this palette, not an exception to it.
 */
export function emojiPickerTheme(theme: Theme) {
  return {
    backdrop: theme.scrim,
    knob: theme.line,
    container: theme.surface,
    header: theme.ink,
    skinTonesContainer: theme.lineFill,
    category: {
      icon: theme.muted,
      // Selecting a category is an active state, which is a sanctioned use.
      iconActive: theme.onAccent,
      container: theme.lineFill,
      containerActive: theme.accent,
    },
    search: {
      background: theme.lineFill,
      text: theme.ink,
      placeholder: theme.muted,
      icon: theme.muted,
    },
    customButton: {
      icon: theme.ink,
      iconPressed: theme.ink,
      background: theme.lineFill,
      backgroundPressed: theme.lineFillStrong,
    },
    emoji: {
      selected: theme.lineFillStrong,
    },
  };
}
