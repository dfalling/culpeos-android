import {useLazyQuery} from '@apollo/client/react';
import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  PlaceSearchDocument,
  type PlaceSearchQuery,
} from '../graphql/__generated__/types';
import {t} from '../i18n';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {TextField} from '../ui/TextField';

export type Place = PlaceSearchQuery['placeSearch'][number];

/** An element's location as the form holds it: what the mutation takes. */
export type LocationValue = {
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string | null;
};

type Props = {
  value: LocationValue | null;
  /** Called with the picked place, or null when the location is removed. */
  onChange: (place: Place | null) => void;
  disabled?: boolean;
};

/**
 * Picks an element's location by place search. With a location set it shows
 * the address and a remove button; without one, a search field whose results
 * are listed inline underneath — inline rather than in a sheet so the keyboard
 * never covers them, since the form's scroll view already handles that.
 *
 * Search runs on submit, not per keystroke: placeSearch is rate limited
 * server-side, and the map's own search works the same way.
 */
export function LocationField({value, onChange, disabled}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [runSearch, {data, loading, error}] = useLazyQuery(
    PlaceSearchDocument,
    {fetchPolicy: 'network-only'},
  );

  if (value) {
    return (
      <View style={styles.selected}>
        <Text style={styles.selectedText}>{value.address}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.edit.removeLocation}
          hitSlop={10}
          disabled={disabled}
          onPress={() => onChange(null)}
          style={styles.remove}>
          <Text style={styles.removeIcon}>×</Text>
        </Pressable>
      </View>
    );
  }

  const trimmed = query.trim();
  function submit() {
    if (!trimmed) return;
    setSubmitted(true);
    // A rejected search is shown via `error`; nothing more to do with it here.
    runSearch({variables: {query: trimmed}}).catch(() => {});
  }

  function pick(place: Place) {
    setQuery('');
    setSubmitted(false);
    onChange(place);
  }

  const places = data?.placeSearch ?? [];

  return (
    <View style={styles.root}>
      <View style={styles.searchRow}>
        <TextField
          containerStyle={styles.flex}
          value={query}
          onChangeText={setQuery}
          placeholder={t.edit.searchLocation}
          returnKeyType="search"
          onSubmitEditing={submit}
          blurOnSubmit={false}
          editable={!disabled}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.edit.searchLocation}
          disabled={disabled || !trimmed || loading}
          onPress={submit}
          style={[
            styles.searchButton,
            (disabled || !trimmed) && styles.searchButtonDisabled,
          ]}>
          {loading ? (
            <ActivityIndicator color={theme.muted} />
          ) : (
            <Text style={styles.searchButtonText}>{t.edit.search}</Text>
          )}
        </Pressable>
      </View>
      {submitted && !loading ? (
        error ? (
          <Text style={styles.message}>{t.edit.locationSearchFailed}</Text>
        ) : places.length === 0 ? (
          <Text style={styles.message}>{t.search.noResults}</Text>
        ) : (
          <View style={styles.results}>
            {places.map(place => (
              <Pressable
                key={place.placeId}
                accessibilityRole="button"
                accessibilityLabel={t.edit.chooseLocation(place.name)}
                disabled={disabled}
                onPress={() => pick(place)}
                style={({pressed}) => [
                  styles.result,
                  pressed && styles.resultPressed,
                ]}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {place.name}
                </Text>
                <Text style={styles.resultAddress} numberOfLines={2}>
                  {place.address}
                </Text>
              </Pressable>
            ))}
          </View>
        )
      ) : null}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: {flex: 1},
    root: {gap: 8},
    selected: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.lineControl,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 48,
    },
    selectedText: {
      flex: 1,
      fontSize: 16,
      color: theme.ink,
    },
    remove: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeIcon: {
      color: theme.muted,
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '600',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    // Matches the label form's Add button: a secondary action.
    searchButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: 80,
      borderRadius: 8,
      backgroundColor: theme.lineFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButtonDisabled: {
      opacity: 0.4,
    },
    searchButtonText: {
      color: theme.ink,
      fontSize: 16,
      fontWeight: '600',
    },
    message: {
      fontSize: 14,
      color: theme.muted,
    },
    results: {
      borderWidth: 1,
      borderColor: theme.line,
      borderRadius: 8,
      overflow: 'hidden',
    },
    result: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 2,
    },
    resultPressed: {
      backgroundColor: theme.lineFill,
    },
    resultName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.ink,
    },
    resultAddress: {
      fontSize: 14,
      color: theme.muted,
    },
  });
