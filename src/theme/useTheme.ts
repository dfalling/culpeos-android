import {useColorScheme} from 'react-native';
import {type Theme, themeForScheme} from './colors';

/**
 * Resolve the active theme from the device's color scheme.
 *
 * Dark mode follows the system setting only — there is no in-app override — so
 * this is just `useColorScheme()` mapped onto our palette. Re-renders when the
 * user changes their system appearance.
 */
export function useTheme(): Theme {
  return themeForScheme(useColorScheme());
}
