import {useLazyQuery} from '@apollo/client/react';
import {useCallback, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SearchDocument, type SearchQuery} from '../graphql/__generated__/types';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';

export type SearchElement = SearchQuery['elements'][number];
export type SearchTrip = SearchQuery['trips'][number];
export type SearchPlace = SearchQuery['placeSearch'][number];

type Props = {
  /** Distance from the top of the screen (safe-area inset + margin). */
  topOffset: number;
  onSelectElement: (element: SearchElement) => void;
  onSelectTrip: (trip: SearchTrip) => void;
  onSelectPlace: (place: SearchPlace) => void;
};

/**
 * Map search control. Collapsed to a single icon button; tapping it expands an
 * input field. Search is explicit (runs on submit, not per keystroke) and
 * queries elements, trips, and places in one request. Results are shown in
 * grouped sections, each type rendered distinctly.
 */
export function SearchOverlay({
  topOffset,
  onSelectElement,
  onSelectTrip,
  onSelectPlace,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [runSearch, {data, loading}] = useLazyQuery(SearchDocument, {
    fetchPolicy: 'network-only',
  });

  // Collapse back to the icon but keep the query text and results, so reopening
  // shows what was last searched and lets the user edit it. Dismiss the keyboard
  // explicitly: when collapsing from a result tap (rather than the keyboard's
  // search key) nothing else would hide it.
  const collapse = useCallback(() => {
    Keyboard.dismiss();
    setExpanded(false);
  }, []);

  // The field's × empties the query for a fresh search (vs. collapse, which
  // dismisses but preserves it).
  const clear = useCallback(() => {
    setText('');
    setSubmitted(false);
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(() => {
    const query = text.trim();
    if (!query) return;
    setSubmitted(true);
    runSearch({variables: {query}});
  }, [text, runSearch]);

  if (!expanded) {
    return (
      <Pressable
        accessibilityLabel="Search"
        accessibilityRole="button"
        onPress={() => setExpanded(true)}
        style={({pressed}) => [
          styles.iconButton,
          {top: topOffset},
          pressed && styles.pressed,
        ]}>
        <Text style={styles.searchGlyph}>⌕</Text>
      </Pressable>
    );
  }

  const elements = data?.elements ?? [];
  const trips = data?.trips ?? [];
  const places = data?.placeSearch ?? [];
  const hasResults =
    elements.length > 0 || trips.length > 0 || places.length > 0;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Tap anywhere outside the field/results to dismiss and return to the
          map, keeping the query for next time. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close search"
        style={StyleSheet.absoluteFill}
        onPress={collapse}
      />
      <View
        style={[styles.expandedRoot, {top: topOffset}]}
        pointerEvents="box-none">
        <View style={styles.fieldRow}>
          <Text style={styles.fieldGlyph}>⌕</Text>
          <TextInput
            ref={inputRef}
            autoFocus
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            placeholder="Search elements, trips, places"
            // Not a `TextField`: this one has no border of its own — the pill
            // around it is the field — so there's no rest/focus border to move,
            // and it's autofocused the moment it appears. It still needs the
            // caret and selection colors Android would otherwise theme itself.
            placeholderTextColor={theme.muted}
            cursorColor={theme.accent}
            selectionColor={theme.accentRing}
            selectionHandleColor={theme.accent}
            returnKeyType="search"
            style={styles.input}
          />
          {text ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
              onPress={clear}
              style={styles.fieldClose}>
              <Text style={styles.fieldCloseIcon}>×</Text>
            </Pressable>
          ) : null}
        </View>

        {submitted ? (
          <View style={styles.resultsCard}>
            {loading ? (
              <View style={styles.statusPane}>
                <ActivityIndicator color={theme.muted} />
              </View>
            ) : hasResults ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={styles.resultsScroll}>
                {elements.length > 0 ? (
                  <Section title="Elements">
                    {elements.map(el => (
                      <ResultRow
                        key={el.id}
                        glyph={el.icon || '📍'}
                        title={el.name}
                        subtitle={el.location?.address ?? undefined}
                        accessibilityLabel={`Go to element ${el.name}`}
                        onPress={() => {
                          onSelectElement(el);
                          collapse();
                        }}
                      />
                    ))}
                  </Section>
                ) : null}

                {trips.length > 0 ? (
                  <Section title="Trips">
                    {trips.map(trip => (
                      <ResultRow
                        key={trip.id}
                        glyph={trip.icon || '🗺️'}
                        title={trip.name}
                        subtitle={trip.description || undefined}
                        badge="Trip"
                        accessibilityLabel={`Filter map to trip ${trip.name}`}
                        onPress={() => {
                          onSelectTrip(trip);
                          collapse();
                        }}
                      />
                    ))}
                  </Section>
                ) : null}

                {places.length > 0 ? (
                  <Section title="Places">
                    {places.map(place => (
                      <ResultRow
                        key={place.placeId}
                        glyph="📍"
                        title={place.name}
                        subtitle={place.address}
                        accessibilityLabel={`Go to place ${place.name}`}
                        onPress={() => {
                          onSelectPlace(place);
                          collapse();
                        }}
                      />
                    ))}
                  </Section>
                ) : null}
              </ScrollView>
            ) : (
              <View style={styles.statusPane}>
                <Text style={styles.emptyText}>No results</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * One search result. The three result kinds share a single neutral treatment:
 * they used to be told apart by the hue behind the glyph — accent, purple, grey
 * — which is a distinction nobody with a color vision deficiency could make,
 * and the section headings above them already say which is which.
 */
function ResultRow({
  glyph,
  title,
  subtitle,
  badge,
  accessibilityLabel,
  onPress,
}: {
  glyph: string;
  title: string;
  subtitle?: string;
  badge?: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.glyphWrap}>
        <Text style={styles.glyph}>{glyph}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    // Chrome floating over the map, so: a surface fill plus a ring. The ring is
    // `lineControl`, not `line` — over the basemap it's the only thing bounding
    // the button, since `surface` is 1.22:1 against the dark basemap and a black
    // drop shadow is invisible on it.
    iconButton: {
      position: 'absolute',
      left: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.lineControl,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: {width: 0, height: 2},
      elevation: 4,
    },
    pressed: {opacity: 0.8},
    searchGlyph: {
      fontSize: 22,
      lineHeight: 26,
      color: theme.ink,
    },
    expandedRoot: {
      position: 'absolute',
      left: 16,
      // Leave room for the account avatar pinned at the top-right.
      right: 64,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.lineControl,
      borderRadius: 22,
      paddingLeft: 14,
      paddingRight: 6,
      height: 44,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: {width: 0, height: 2},
      elevation: 4,
    },
    fieldGlyph: {
      fontSize: 20,
      lineHeight: 24,
      color: theme.muted,
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.ink,
      padding: 0,
    },
    fieldClose: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.lineFill,
    },
    fieldCloseIcon: {
      fontSize: 18,
      lineHeight: 20,
      color: theme.ink,
    },
    resultsCard: {
      marginTop: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.line,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: {width: 0, height: 2},
      elevation: 6,
      overflow: 'hidden',
    },
    resultsScroll: {
      maxHeight: 360,
    },
    statusPane: {
      paddingVertical: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.muted,
    },
    section: {
      paddingTop: 10,
      paddingBottom: 4,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 14,
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    rowPressed: {
      backgroundColor: theme.lineFill,
    },
    glyphWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: theme.lineFill,
    },
    glyph: {
      fontSize: 18,
      lineHeight: 22,
      textAlign: 'center',
    },
    rowBody: {
      flex: 1,
      marginRight: 8,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.ink,
    },
    rowSubtitle: {
      fontSize: 12,
      color: theme.muted,
      marginTop: 2,
    },
    // Neutral, like every other badge: it already says "Trip", so the hue was
    // doing nothing a reader relied on.
    badge: {
      backgroundColor: theme.lineFill,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    badgeText: {
      color: theme.ink,
      fontSize: 11,
      fontWeight: '600',
    },
  });
