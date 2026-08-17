import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import type {Theme} from './colors';
import {useTheme} from './useTheme';

/**
 * React Navigation's theme, built from our tokens.
 *
 * Handing it `DefaultTheme`/`DarkTheme` instead would leave a second palette
 * running alongside ours — its blue `primary`, its cool `border`, and a
 * `background` (`#f2f2f2` light, pure black dark) that differs from our canvas,
 * which shows as a flash of the wrong color in the gap during a push
 * transition. There is one declaration per role, and this is where the
 * navigator reads it.
 *
 * Only `background` is really load-bearing today — headers are hidden and each
 * screen draws its own chrome — but the rest are mapped so nothing new picks up
 * a default.
 */
export function navigationThemeFor(theme: Theme): NavigationTheme {
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.scheme === 'dark',
    colors: {
      primary: theme.accent,
      background: theme.canvas,
      card: theme.canvas,
      text: theme.ink,
      border: theme.line,
      notification: theme.accent,
    },
  };
}

export function useNavigationTheme(): NavigationTheme {
  return navigationThemeFor(useTheme());
}
