import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {PhotoType} from '../graphql/__generated__/types';
import {t} from '../i18n';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {TextField} from '../ui/TextField';
import {photoImageSource} from './photoImageSource';

export type EditablePhoto = {
  id: string;
  thumbnail: string;
  /** Alt text. */
  description: string;
  type?: PhotoType | null;
};

// The API caps descriptions at 255 characters.
const MAX_DESCRIPTION_LENGTH = 255;

/**
 * Only uploaded photos have editable alt text; Unsplash and Wikimedia photos
 * keep their source's description (as on web).
 */
export function isAltTextEditable(photo: EditablePhoto): boolean {
  return photo.type === 'S3';
}

/** Moves the item at `from` by `delta` places, clamped to the list's ends. */
export function movePhoto<T>(items: T[], from: number, delta: number): T[] {
  const to = Math.max(0, Math.min(items.length - 1, from + delta));
  if (to === from) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

type Props = {
  /** The complete desired set of photos, in display order. */
  photos: EditablePhoto[];
  onChange: (photos: EditablePhoto[]) => void;
  /** Opens the add-photo flow. */
  onAdd: () => void;
  /** A photo is being added; shows a spinner on the add tile. */
  adding: boolean;
  disabled: boolean;
};

/**
 * An element's photos as an editable grid: add, remove, reorder, and edit an
 * uploaded photo's alt text (selected photo only). The order
 * is the element's display order (the first photo leads the detail screen), so
 * it's sent as-is in photoIds on save.
 *
 * Reordering is tap-to-select then move earlier/later, rather than drag: it
 * needs no gesture library, and it's operable with a screen reader, which also
 * gets the moves as accessibility actions on each photo.
 */
export function PhotoGridEditor({
  photos,
  onChange,
  onAdd,
  adding,
  disabled,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIndex = photos.findIndex(photo => photo.id === selectedId);
  const selected = selectedIndex >= 0 ? photos[selectedIndex] : null;
  const locked = disabled || adding;

  function move(index: number, delta: number) {
    onChange(movePhoto(photos, index, delta));
  }

  function setDescription(id: string, description: string) {
    onChange(
      photos.map(photo => (photo.id === id ? {...photo, description} : photo)),
    );
  }

  function remove(id: string) {
    if (id === selectedId) setSelectedId(null);
    onChange(photos.filter(photo => photo.id !== id));
  }

  return (
    <View>
      <View style={styles.grid}>
        {photos.map((photo, index) => {
          const isSelected = photo.id === selectedId;
          const position = t.photos.position(index + 1, photos.length);
          return (
            <View key={photo.id} style={styles.thumbWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={position}
                accessibilityHint={t.photos.selectToEdit}
                accessibilityState={{selected: isSelected}}
                accessibilityActions={[
                  ...(index > 0
                    ? [{name: 'moveEarlier', label: t.photos.moveEarlier}]
                    : []),
                  ...(index < photos.length - 1
                    ? [{name: 'moveLater', label: t.photos.moveLater}]
                    : []),
                  {name: 'remove', label: t.photos.remove},
                ]}
                onAccessibilityAction={event => {
                  if (locked) return;
                  if (event.nativeEvent.actionName === 'moveEarlier') {
                    move(index, -1);
                  } else if (event.nativeEvent.actionName === 'moveLater') {
                    move(index, 1);
                  } else if (event.nativeEvent.actionName === 'remove') {
                    remove(photo.id);
                  }
                }}
                disabled={locked}
                onPress={() => setSelectedId(isSelected ? null : photo.id)}>
                <Image
                  source={photoImageSource(photo.thumbnail)}
                  style={[styles.thumb, isSelected && styles.thumbSelected]}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.photos.removeAt(position)}
                hitSlop={8}
                disabled={locked}
                onPress={() => remove(photo.id)}
                style={styles.removeBadge}>
                <Text style={styles.removeIcon}>×</Text>
              </Pressable>
            </View>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.photos.addPhoto}
          disabled={locked}
          onPress={onAdd}
          style={styles.add}>
          {adding ? (
            <ActivityIndicator color={theme.muted} />
          ) : (
            <Text style={styles.addIcon}>＋</Text>
          )}
        </Pressable>
      </View>

      {selectedIndex >= 0 && photos.length > 1 ? (
        <View style={styles.reorderBar}>
          <ReorderButton
            label={t.photos.moveEarlier}
            glyph="‹"
            disabled={locked || selectedIndex === 0}
            onPress={() => move(selectedIndex, -1)}
          />
          <Text style={styles.reorderPosition}>
            {t.photos.position(selectedIndex + 1, photos.length)}
          </Text>
          <ReorderButton
            label={t.photos.moveLater}
            glyph="›"
            disabled={locked || selectedIndex === photos.length - 1}
            onPress={() => move(selectedIndex, 1)}
          />
        </View>
      ) : null}

      {selected ? (
        <View style={styles.altText}>
          <Text style={styles.altTextLabel}>{t.photos.altText}</Text>
          {isAltTextEditable(selected) ? (
            <TextField
              value={selected.description}
              onChangeText={text => setDescription(selected.id, text)}
              placeholder={t.photos.altTextPlaceholder}
              maxLength={MAX_DESCRIPTION_LENGTH}
              editable={!locked}
            />
          ) : (
            <>
              <Text style={styles.altTextReadOnly}>{selected.description}</Text>
              <Text style={styles.altTextNote}>
                {t.photos.altTextFromSource}
              </Text>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function ReorderButton({
  label,
  glyph,
  disabled,
  onPress,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.reorderButton, disabled && styles.disabled]}>
      <Text style={styles.reorderGlyph}>{glyph}</Text>
      <Text style={styles.reorderLabel}>{label}</Text>
    </Pressable>
  );
}

const THUMB = 80;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    thumbWrap: {
      width: THUMB,
      height: THUMB,
    },
    thumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: 8,
      backgroundColor: theme.lineFill,
    },
    // Selection is a sanctioned accent use; the reorder bar appearing below
    // carries the state too, so the ring isn't the only signal.
    thumbSelected: {
      borderWidth: 3,
      borderColor: theme.accent,
    },
    removeBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      // Inverts against the screen so the badge reads on any photo in either
      // appearance: a dark chip in light mode, a light chip in dark mode.
      backgroundColor: theme.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeIcon: {
      color: theme.canvas,
      fontSize: 16,
      lineHeight: 18,
      fontWeight: '600',
    },
    add: {
      width: THUMB,
      height: THUMB,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.lineControl,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addIcon: {
      fontSize: 28,
      color: theme.muted,
    },
    reorderBar: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    reorderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme.lineFill,
    },
    reorderGlyph: {
      fontSize: 20,
      lineHeight: 22,
      color: theme.ink,
    },
    reorderLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.ink,
    },
    reorderPosition: {
      fontSize: 14,
      color: theme.muted,
    },
    disabled: {
      opacity: 0.4,
    },
    altText: {
      marginTop: 12,
      gap: 6,
    },
    altTextLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.muted,
    },
    altTextReadOnly: {
      fontSize: 16,
      color: theme.ink,
    },
    altTextNote: {
      fontSize: 13,
      color: theme.muted,
    },
  });
