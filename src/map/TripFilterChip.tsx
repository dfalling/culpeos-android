import {Pressable, StyleSheet, Text, View} from 'react-native';

type Props = {
  /** Trip emoji icon (may be empty). */
  icon: string;
  name: string;
  topOffset: number;
  onClear: () => void;
};

/**
 * Floating pill shown while the map is filtered to a single trip. Indicates the
 * active filter and offers an `×` to clear it (restoring normal bounds-based
 * element loading).
 */
export function TripFilterChip({icon, name, topOffset, onClear}: Props) {
  return (
    <View style={[styles.wrap, {top: topOffset}]} pointerEvents="box-none">
      <View style={styles.chip}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.label} numberOfLines={1}>
          {name}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear trip filter"
          hitSlop={10}
          onPress={onClear}
          style={styles.clearButton}>
          <Text style={styles.clearIcon}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
    backgroundColor: '#1d6fe0',
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
  label: {
    flexShrink: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  clearIcon: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 18,
  },
});
