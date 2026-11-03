import {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';

export type ActiveFilterPill = {
  key: string;
  /** Leading glyph; the trip's emoji, or a stand-in for the filter's kind. */
  icon: string;
  title: string;
  /** Accessibility label for the pill's `×`. */
  clearLabel: string;
  onClear: () => void;
};

type Props = {
  pills: readonly ActiveFilterPill[];
  topOffset: number;
};

/**
 * Floating row of active map filters, one pill each with an `×` to clear just
 * that filter. Filters combine, so several pills can be shown at once and they
 * wrap onto further lines when they don't fit.
 */
export function FilterChips({pills, topOffset}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (pills.length === 0) return null;
  return (
    <View style={[styles.wrap, {top: topOffset}]} pointerEvents="box-none">
      <View style={styles.row}>
        {pills.map(pill => (
          <FilterPill
            key={pill.key}
            icon={pill.icon}
            title={pill.title}
            accessibilityLabel={pill.clearLabel}
            onClear={pill.onClear}
          />
        ))}
      </View>
    </View>
  );
}

/** A single filter pill: leading icon, title, and an `×` to clear it. */
function FilterPill({
  icon,
  title,
  accessibilityLabel,
  onClear,
}: {
  icon: string;
  title: string;
  accessibilityLabel: string;
  onClear: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.pill}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={10}
        onPress={onClear}
        style={styles.clearButton}>
        <Text style={styles.clearIcon}>×</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 16,
      right: 16,
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    // Neutral, deliberately. These sit over the map, and an accent-filled chrome
    // element competes with the accent pins it's filtering — content should win.
    // A pill is only on screen while its filter is active, so its presence is
    // already the "on" state; it doesn't need a hue to say so as well.
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      maxWidth: '100%',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.line,
      borderRadius: 20,
      paddingLeft: 14,
      paddingRight: 6,
      paddingVertical: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: {width: 0, height: 2},
      elevation: 4,
    },
    icon: {
      fontSize: 15,
      lineHeight: 18,
      marginRight: 6,
    },
    title: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.ink,
    },
    clearButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
      backgroundColor: theme.lineFill,
    },
    clearIcon: {
      color: theme.ink,
      fontSize: 16,
      lineHeight: 18,
    },
  });
