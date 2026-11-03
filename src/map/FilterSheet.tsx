import {useQuery} from '@apollo/client/react';
import {useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {TripsDocument} from '../graphql/__generated__/types';
import {t} from '../i18n';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {Sheet} from '../ui/Sheet';
import {TextField} from '../ui/TextField';
import {
  type ElementFilters,
  EMPTY_FILTERS,
  type TriState,
  toggleLabel,
} from './elementFilters';

type Props = {
  visible: boolean;
  filters: ElementFilters;
  /** Labels to offer; see `labelOptions`. */
  labels: readonly string[];
  onChange: (filters: ElementFilters) => void;
  onClose: () => void;
};

/**
 * Bottom sheet holding every map filter: the mobile counterpart of the web's
 * filter panel. Each control applies immediately (the map updates behind the
 * scrim) except the text field, which applies on submit or when the sheet
 * closes, so typing doesn't fire a query per keystroke.
 */
export function FilterSheet({
  visible,
  filters,
  labels,
  onChange,
  onClose,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Fetched once the sheet is first opened, then served from the cache.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (visible) setOpened(true);
  }, [visible]);
  const {data: tripsData} = useQuery(TripsDocument, {skip: !opened});
  const trips = tripsData?.trips ?? [];

  // The text filter is edited as a draft and committed explicitly. Re-synced
  // when the applied value changes from outside (a chip's ×, "Clear all").
  const [searchDraft, setSearchDraft] = useState(filters.search);
  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  const commitSearch = () => {
    if (searchDraft.trim() !== filters.search.trim()) {
      onChange({...filters, search: searchDraft.trim()});
    }
  };

  const close = () => {
    commitSearch();
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      scrimAccessibilityLabel={t.filters.close}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t.filters.title}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setSearchDraft('');
            onChange(EMPTY_FILTERS);
          }}
          hitSlop={8}
          style={({pressed}) => [styles.headerButton, pressed && styles.dim]}>
          <Text style={styles.headerButtonText}>{t.filters.clearAll}</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Group title={t.filters.text}>
          <TextField
            value={searchDraft}
            onChangeText={setSearchDraft}
            onSubmitEditing={commitSearch}
            onEndEditing={commitSearch}
            placeholder={t.filters.searchPlaceholder}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel={t.filters.text}
          />
        </Group>

        <Group title={t.filters.labels}>
          {labels.length > 0 ? (
            <View style={styles.chips}>
              {labels.map(label => (
                <Chip
                  key={label}
                  label={label}
                  selected={filters.labels.includes(label)}
                  onPress={() => onChange(toggleLabel(filters, label))}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>{t.filters.noLabels}</Text>
          )}
        </Group>

        <Group title={t.filters.trip}>
          {trips.length > 0 ? (
            <View style={styles.chips}>
              {trips.map(trip => {
                const selected = filters.trip?.id === trip.id;
                return (
                  <Chip
                    key={trip.id}
                    label={trip.icon ? `${trip.icon} ${trip.name}` : trip.name}
                    selected={selected}
                    onPress={() =>
                      onChange({
                        ...filters,
                        trip: selected
                          ? null
                          : {id: trip.id, name: trip.name, icon: trip.icon},
                      })
                    }
                  />
                );
              })}
            </View>
          ) : (
            <Text style={styles.empty}>{t.filters.noTrips}</Text>
          )}
        </Group>

        <Segmented
          title={t.filters.schedule}
          value={filters.scheduled}
          yes={t.filters.scheduled}
          no={t.filters.unscheduled}
          onChange={scheduled => onChange({...filters, scheduled})}
        />

        <Segmented
          title={t.filters.progress}
          value={filters.completed}
          yes={t.filters.done}
          no={t.filters.toDo}
          // To do reads before Done, matching the web panel.
          noFirst
          onChange={completed => onChange({...filters, completed})}
        />

        <View style={styles.switchRow}>
          <Text style={styles.groupTitle}>{t.filters.deleted}</Text>
          {/* Themed like the edit screen's switch; see the note there. */}
          <Switch
            accessibilityLabel={t.filters.deleted}
            value={filters.deleted}
            onValueChange={deleted => onChange({...filters, deleted})}
            trackColor={{false: theme.lineFillStrong, true: theme.muted}}
            thumbColor={theme.surface}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

function Group({title, children}: {title: string; children: React.ReactNode}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** A toggleable pill. Selected is the sanctioned accent "active" state. */
function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.dim,
      ]}>
      <Text
        numberOfLines={1}
        style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** All / yes / no as one segmented control, like the web panel's groups. */
function Segmented({
  title,
  value,
  yes,
  no,
  noFirst = false,
  onChange,
}: {
  title: string;
  value: TriState;
  yes: string;
  no: string;
  noFirst?: boolean;
  onChange: (value: TriState) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const sides: [TriState, string][] = noFirst
    ? [
        ['no', no],
        ['yes', yes],
      ]
    : [
        ['yes', yes],
        ['no', no],
      ];
  const options: [TriState, string][] = [['all', t.filters.all], ...sides];
  return (
    <Group title={title}>
      <View style={styles.segmented} accessibilityRole="radiogroup">
        {options.map(([option, label], i) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{selected}}
              accessibilityLabel={`${title}: ${label}`}
              onPress={() => onChange(option)}
              style={({pressed}) => [
                styles.segment,
                i > 0 && styles.segmentDivider,
                selected && styles.segmentSelected,
                pressed && styles.dim,
              ]}>
              <Text
                style={[
                  styles.segmentText,
                  selected && styles.segmentTextSelected,
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Group>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.ink,
    },
    headerButton: {
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    headerButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.accentText,
    },
    dim: {opacity: 0.7},
    scroll: {
      maxHeight: 520,
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 18,
    },
    group: {
      gap: 8,
    },
    groupTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    empty: {
      fontSize: 14,
      color: theme.muted,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      maxWidth: '100%',
      borderWidth: 1,
      borderColor: theme.lineControl,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipSelected: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    chipText: {
      fontSize: 14,
      color: theme.ink,
    },
    chipTextSelected: {
      color: theme.onAccent,
      fontWeight: '600',
    },
    segmented: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: theme.lineControl,
      borderRadius: 8,
      overflow: 'hidden',
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
    },
    segmentDivider: {
      borderLeftWidth: 1,
      borderLeftColor: theme.lineControl,
    },
    segmentSelected: {
      backgroundColor: theme.lineFillStrong,
    },
    segmentText: {
      fontSize: 14,
      color: theme.muted,
      fontWeight: '600',
    },
    segmentTextSelected: {
      color: theme.ink,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });
