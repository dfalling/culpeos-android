import {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  type SearchQuery,
  useSearchLazyQuery,
} from '../graphql/__generated__/types';

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
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [runSearch, {data, loading}] = useSearchLazyQuery({
    fetchPolicy: 'network-only',
  });

  // Collapse back to the icon but keep the query text and results, so reopening
  // shows what was last searched and lets the user edit it.
  const collapse = useCallback(() => setExpanded(false), []);

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
            placeholderTextColor="#999"
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
                <ActivityIndicator />
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
                        glyphStyle={styles.elementGlyphWrap}
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
                        glyphStyle={styles.tripGlyphWrap}
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
                        glyphStyle={styles.placeGlyphWrap}
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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ResultRow({
  glyph,
  glyphStyle,
  title,
  subtitle,
  badge,
  accessibilityLabel,
  onPress,
}: {
  glyph: string;
  glyphStyle: object;
  title: string;
  subtitle?: string;
  badge?: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.glyphWrap, glyphStyle]}>
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

const styles = StyleSheet.create({
  iconButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
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
    color: '#1d6fe0',
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
    backgroundColor: '#ffffff',
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
    color: '#888',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    padding: 0,
  },
  fieldClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f1',
  },
  fieldCloseIcon: {
    fontSize: 18,
    lineHeight: 20,
    color: '#444',
  },
  resultsCard: {
    marginTop: 8,
    backgroundColor: '#ffffff',
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
    color: '#888',
  },
  section: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
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
    backgroundColor: '#f4f7fc',
  },
  glyphWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  elementGlyphWrap: {
    backgroundColor: '#1d6fe0',
  },
  tripGlyphWrap: {
    backgroundColor: '#7a3ff2',
  },
  placeGlyphWrap: {
    backgroundColor: '#e9eef6',
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
    color: '#111',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#efe9fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#7a3ff2',
    fontSize: 11,
    fontWeight: '600',
  },
});
