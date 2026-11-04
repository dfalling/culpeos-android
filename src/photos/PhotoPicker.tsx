import {useLazyQuery, useMutation} from '@apollo/client/react';
import {type ReactNode, useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CreatePhotoDocument,
  type PhotoSource,
  SearchPhotosDocument,
  type SearchPhotosQuery,
} from '../graphql/__generated__/types';
import {t} from '../i18n';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {Sheet} from '../ui/Sheet';
import {TextField} from '../ui/TextField';
import {photoImageSource} from './photoImageSource';
import {
  MAX_PHOTOS_PER_PICK,
  type UploadedPhoto,
  usePhotoUploader,
} from './photoUpload';

type SearchResult = SearchPhotosQuery['searchPhotos'][number];

const SOURCES: {source: PhotoSource; label: string}[] = [
  {source: 'UNSPLASH', label: 'Unsplash'},
  {source: 'WIKIMEDIA', label: 'Wikimedia Commons'},
];

type Options = {
  /**
   * Upload several device photos in one pick (an element's gallery) rather
   * than one (a trip's banner). Search always picks one.
   */
  multiple: boolean;
  /**
   * A photo was created and is ready to attach (by id) to an element/trip.
   * Called once per photo, as each one finishes.
   */
  onPicked: (photo: UploadedPhoto) => void;
  /** Creating a photo failed; the caller shows its own error. */
  onError: () => void;
};

/**
 * The "add a photo" flow, shared by every surface that takes photos: a sheet
 * offering an upload from the device, or a search of Unsplash or Wikimedia
 * Commons (the same sources as the web app's photo selector). Either way the
 * result is a created Photo whose id the caller attaches on save.
 *
 * Returns the `sheet` to render rather than rendering it itself, because the
 * sheet is an absolute overlay and must sit at the screen's root, not inside
 * the form's scroll view next to the trigger.
 */
export function usePhotoPicker({multiple, onPicked, onError}: Options): {
  open: () => void;
  /** A photo is uploading or being created. */
  busy: boolean;
  sheet: ReactNode;
} {
  const [visible, setVisible] = useState(false);
  const {pickAndUpload, uploading} = usePhotoUploader();
  const [createPhoto, {loading: creating}] = useMutation(CreatePhotoDocument);

  const onUpload = useCallback(async () => {
    setVisible(false);
    try {
      const {failed} = await pickAndUpload(
        multiple ? MAX_PHOTOS_PER_PICK : 1,
        onPicked,
      );
      if (failed > 0) onError();
    } catch {
      onError();
    }
  }, [multiple, pickAndUpload, onPicked, onError]);

  const onSelectResult = useCallback(
    async (result: SearchResult) => {
      try {
        // A result maps field-for-field onto PhotoInput. downloadLocation
        // (Unsplash only) lets the server report the pick to Unsplash.
        const {data} = await createPhoto({
          variables: {
            input: {
              type: result.type,
              description: result.description,
              full: result.full,
              regular: result.regular,
              small: result.small,
              thumbnail: result.thumbnail,
              attributionUrl: result.attributionUrl,
              creditName: result.creditName,
              creditUrl: result.creditUrl,
              license: result.license,
              downloadLocation: result.downloadLocation,
            },
          },
        });
        if (!data) throw new Error('createPhoto returned no photo');
        setVisible(false);
        onPicked(data.createPhoto);
      } catch {
        setVisible(false);
        onError();
      }
    },
    [createPhoto, onPicked, onError],
  );

  const sheet = (
    <Sheet
      visible={visible}
      onClose={() => setVisible(false)}
      scrimAccessibilityLabel={t.photos.closePicker}>
      {/* Remounted per opening so a previous search doesn't linger. */}
      {visible ? (
        <PickerContent
          multiple={multiple}
          creating={creating}
          onUpload={onUpload}
          onSelectResult={onSelectResult}
        />
      ) : null}
    </Sheet>
  );

  return {
    open: () => setVisible(true),
    busy: uploading || creating,
    sheet,
  };
}

function PickerContent({
  multiple,
  creating,
  onUpload,
  onSelectResult,
}: {
  multiple: boolean;
  creating: boolean;
  onUpload: () => void;
  onSelectResult: (result: SearchResult) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<PhotoSource>('UNSPLASH');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [search, {data, loading, error, called}] =
    useLazyQuery(SearchPhotosDocument);
  const results = data?.searchPhotos ?? [];

  function runSearch(nextSource: PhotoSource) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSelectedIndex(null);
    search({variables: {query: trimmed, source: nextSource}});
  }

  function onSearch() {
    runSearch(source);
  }

  function onChangeSource(next: PhotoSource) {
    setSource(next);
    runSearch(next);
  }

  return (
    <View>
      <Text style={styles.title}>{t.photos.addPhoto}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={creating}
        onPress={onUpload}
        style={({pressed}) => [styles.row, pressed && styles.rowPressed]}>
        <Text style={styles.rowText}>
          {multiple ? t.photos.fromDeviceMultiple : t.photos.fromDevice}
        </Text>
      </Pressable>

      <Text style={styles.subtitle}>{t.photos.orSearch}</Text>
      <View style={styles.sources} accessibilityRole="radiogroup">
        {SOURCES.map(option => {
          const selected = option.source === source;
          return (
            <Pressable
              key={option.source}
              accessibilityRole="radio"
              accessibilityState={{checked: selected}}
              disabled={creating}
              onPress={() => onChangeSource(option.source)}
              style={[styles.sourceChip, selected && styles.sourceChipOn]}>
              <Text
                style={[
                  styles.sourceChipText,
                  selected && styles.sourceChipTextOn,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.searchRow}>
        <TextField
          containerStyle={styles.flex}
          value={query}
          onChangeText={setQuery}
          placeholder={t.photos.searchPlaceholder}
          returnKeyType="search"
          onSubmitEditing={onSearch}
          editable={!creating}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.photos.search}
          disabled={creating || query.trim().length === 0}
          onPress={onSearch}
          style={[
            styles.searchButton,
            (creating || query.trim().length === 0) && styles.disabled,
          ]}>
          <Text style={styles.searchButtonText}>{t.photos.search}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.status} color={theme.muted} />
      ) : error ? (
        <Text style={styles.status}>{t.photos.searchFailed}</Text>
      ) : called && results.length === 0 ? (
        <Text style={styles.status}>{t.photos.noResults}</Text>
      ) : results.length > 0 ? (
        <ScrollView
          style={styles.results}
          contentContainerStyle={styles.resultGrid}
          keyboardShouldPersistTaps="handled">
          {results.map((result, index) => (
            <Pressable
              key={result.thumbnail}
              accessibilityRole="button"
              accessibilityLabel={t.photos.chooseResult(result.description)}
              disabled={creating}
              onPress={() => {
                setSelectedIndex(index);
                onSelectResult(result);
              }}
              style={({pressed}) => [
                styles.result,
                pressed && styles.resultPressed,
              ]}>
              <Image
                source={photoImageSource(result.thumbnail)}
                style={styles.resultImage}
              />
              {/* Unsplash and Commons licenses both ask that the author be
                  credited wherever their photos are shown. */}
              {result.creditName ? (
                <Text style={styles.resultCredit} numberOfLines={1}>
                  {result.creditName}
                </Text>
              ) : null}
              {creating && selectedIndex === index ? (
                <View style={styles.resultBusy}>
                  <ActivityIndicator color={theme.ink} />
                </View>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: {flex: 1},
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.ink,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.muted,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
    },
    row: {
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 8,
    },
    rowPressed: {
      backgroundColor: theme.lineFill,
    },
    rowText: {
      fontSize: 16,
      color: theme.ink,
    },
    sources: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      paddingBottom: 10,
    },
    sourceChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.lineControl,
    },
    // A selected state, which is a sanctioned use of accent.
    sourceChipOn: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    sourceChipText: {
      fontSize: 14,
      color: theme.ink,
    },
    sourceChipTextOn: {
      color: theme.onAccent,
      fontWeight: '600',
    },
    searchRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
    },
    searchButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.lineFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButtonText: {
      color: theme.ink,
      fontSize: 16,
      fontWeight: '600',
    },
    disabled: {
      opacity: 0.4,
    },
    status: {
      color: theme.muted,
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 16,
    },
    results: {
      maxHeight: 320,
      marginTop: 12,
    },
    resultGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 12,
    },
    result: {
      width: 100,
      borderRadius: 8,
      padding: 2,
    },
    resultPressed: {
      backgroundColor: theme.lineFill,
    },
    resultImage: {
      width: 96,
      height: 96,
      borderRadius: 6,
      backgroundColor: theme.lineFill,
    },
    resultCredit: {
      fontSize: 12,
      color: theme.muted,
      marginTop: 2,
    },
    resultBusy: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.scrim,
      borderRadius: 8,
    },
  });
