import {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';

// Stands in for the trip's emoji on a label pill, so the two filter kinds read
// differently while sharing one pill style.
const LABEL_ICON = '🏷️';

type Props = {
  /** Active trip filter, or null when not filtering by trip. */
  trip: {icon: string; name: string} | null;
  /** Active label filters; rendered as one pill each. */
  labels: readonly string[];
  topOffset: number;
  onClearTrip: () => void;
  onClearLabel: (label: string) => void;
};

/**
 * Floating row of active map filters. Shows the trip filter (if any) followed by
 * a pill per active label; each pill has an `×` to clear just that filter. Trip
 * and label filters combine, so several pills can be shown at once and they wrap
 * onto further lines when they don't fit.
 */
export function FilterChips({
  trip,
  labels,
  topOffset,
  onClearTrip,
  onClearLabel,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (!trip && labels.length === 0) return null;
  return (
    <View style={[styles.wrap, {top: topOffset}]} pointerEvents="box-none">
      <View style={styles.row}>
        {trip ? (
          <FilterPill
            icon={trip.icon}
            title={trip.name}
            accessibilityLabel="Clear trip filter"
            onClear={onClearTrip}
          />
        ) : null}
        {labels.map(label => (
          <FilterPill
            key={label}
            icon={LABEL_ICON}
            title={label}
            accessibilityLabel={`Clear ${label} filter`}
            onClear={() => onClearLabel(label)}
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
