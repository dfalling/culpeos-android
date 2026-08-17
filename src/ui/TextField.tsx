import {useMemo, useState} from 'react';
import {
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';

type Props = TextInputProps & {
  /** Draws the error border. The message itself is the caller's to render. */
  invalid?: boolean;
  /** Layout for the wrapper, e.g. `flex: 1` inside a row. */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * The app's bordered text input.
 *
 * Exists so focus is visible. Rest and focus were previously the same neutral
 * border, which meant focusing a field produced no visible change at all —
 * fine-looking code, and a WCAG 2.4.7 failure. Focus now moves the border to
 * `accent` and adds a ring, which is a sanctioned accent use.
 *
 * It also owns the handful of colors Android would otherwise supply from its
 * own theme rather than ours: the caret, the selection highlight, the selection
 * handles, and the placeholder.
 */
export function TextField({invalid, containerStyle, style, ...props}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {/* Behind the input and outside its bounds, so the ring costs no layout
          and doesn't shift the field when focus arrives. A shadow wouldn't do:
          it's invisible over a dark canvas. */}
      {focused ? <View style={styles.ring} pointerEvents="none" /> : null}
      <TextInput
        {...props}
        onFocus={event => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={event => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        placeholderTextColor={theme.muted}
        cursorColor={theme.accent}
        selectionColor={theme.accentRing}
        selectionHandleColor={theme.accent}
        style={[
          styles.input,
          focused && styles.inputFocused,
          invalid && styles.inputInvalid,
          style,
        ]}
      />
    </View>
  );
}

/** Ring thickness, and the input's corner radius it has to sit outside of. */
const RING = 4;
const RADIUS = 8;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    ring: {
      position: 'absolute',
      top: -RING,
      left: -RING,
      right: -RING,
      bottom: -RING,
      borderRadius: RADIUS + RING,
      backgroundColor: theme.accentRing,
    },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.lineControl,
      borderRadius: RADIUS,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.ink,
    },
    inputFocused: {
      borderColor: theme.accent,
    },
    inputInvalid: {
      borderColor: theme.danger,
    },
  });
