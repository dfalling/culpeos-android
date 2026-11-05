import {useMutation, useQuery} from '@apollo/client/react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import EmojiPicker, {en, es, pt} from 'rn-emoji-keyboard';
import {
  CreateElementDocument,
  type CreateElementInput,
  DeleteElementDocument,
  ElementDetailDocument,
  type ElementDetailQuery,
  ElementsDocument,
  TripsDocument,
  UpdateElementDocument,
} from '../graphql/__generated__/types';
import {language, t} from '../i18n';
import type {RootStackParamList} from '../navigation/types';
import {type EditablePhoto, PhotoGridEditor} from '../photos/PhotoGridEditor';
import {usePhotoPicker} from '../photos/PhotoPicker';
import {type SavedAltText, useSaveElementAltText} from '../photos/photoAltText';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {emojiPickerTheme} from '../ui/emojiPickerTheme';
import {Sheet} from '../ui/Sheet';
import {TextField} from '../ui/TextField';
import {LocationField, type LocationValue} from './LocationField';

// The icon picker ships its own category names and search placeholder.
const EMOJI_TRANSLATIONS = {en, es, pt};

type Props = NativeStackScreenProps<RootStackParamList, 'ElementEdit'>;
type CreateProps = NativeStackScreenProps<RootStackParamList, 'ElementCreate'>;

type Element = ElementDetailQuery['element'];

// Requires an http(s) scheme and at least a host. We avoid the URL constructor
// since React Native's implementation is incomplete and inconsistent.
const URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

function isValidUrl(value: string): boolean {
  return URL_PATTERN.test(value);
}

export function ElementEditScreen({route, navigation}: Props) {
  const {elementId} = route.params;
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const {data, loading} = useQuery(ElementDetailDocument, {
    variables: {id: elementId},
  });
  const element = data?.element;

  return (
    <View style={styles.screen}>
      {element ? (
        <EditForm
          element={element}
          onCancel={() => navigation.goBack()}
          onSaved={() => navigation.goBack()}
          // popTo (not goBack) so we pass the map back over the now-stale detail
          // screen, and hand it the deleted id to drop from its pin set.
          onDeleted={() =>
            navigation.popTo('Map', {removedElementId: elementId})
          }
        />
      ) : (
        <View style={styles.loadingPane}>
          {loading ? <ActivityIndicator color={theme.muted} /> : null}
        </View>
      )}
    </View>
  );
}

/**
 * The same form with nothing to load, saving through createElement. A new
 * element with a location goes back to the map, which flies to it and shows
 * its preview card — the way picking one from search does. One without a
 * location has no map presence, so it opens its details instead.
 */
export function ElementCreateScreen({route, navigation}: CreateProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.screen}>
      <EditForm
        element={null}
        initialTripIds={route.params?.tripIds}
        onCancel={() => navigation.goBack()}
        onSaved={saved => {
          if (saved.location) {
            navigation.popTo('Map', {
              createdElement: {
                id: saved.id,
                name: saved.name,
                icon: saved.icon,
                labels: saved.labels,
                location: {
                  id: saved.location.id,
                  latitude: saved.location.latitude,
                  longitude: saved.location.longitude,
                },
              },
            });
          } else {
            navigation.replace('ElementDetail', {elementId: saved.id});
          }
        }}
      />
    </View>
  );
}

/**
 * Edits `element`, or creates a new one when it's null. The form initializes
 * its fields from the element, so in edit mode it's rendered only once the
 * element is available. We round-trip every field the mutation requires —
 * including the ones we don't expose (schedule) — so saving an edit doesn't
 * clear them.
 */
function EditForm({
  element,
  initialTripIds,
  onCancel,
  onSaved,
  onDeleted,
}: {
  element: Element | null;
  initialTripIds?: string[];
  onCancel: () => void;
  onSaved: (saved: Element) => void;
  onDeleted?: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const pickerTheme = useMemo(() => emojiPickerTheme(theme), [theme]);
  const safeAreaInsets = useSafeAreaInsets();
  const [name, setName] = useState(element?.name ?? '');
  const [uri, setUri] = useState(element?.uri ?? '');
  const [icon, setIcon] = useState(element?.icon ?? '');
  const [description, setDescription] = useState(element?.description ?? '');
  const [completed, setCompleted] = useState(element?.completed ?? false);
  const [location, setLocation] = useState<LocationValue | null>(() =>
    element?.location
      ? {
          address: element.location.address,
          latitude: element.location.latitude,
          longitude: element.location.longitude,
          placeId: element.location.placeId,
        }
      : null,
  );
  // The complete desired set of photos, in display order. Initialized from the
  // element and mutated as the user adds/removes/reorders; sent as photoIds
  // on save. Edited alt text is saved per photo after that, against
  // savedAltText.
  const [photos, setPhotos] = useState<EditablePhoto[]>(() =>
    (element?.photos ?? []).map(toEditablePhoto),
  );
  const savedAltText = useRef<SavedAltText>(
    Object.fromEntries(
      (element?.photos ?? []).map(photo => [photo.id, photo.description]),
    ),
  );
  const saveAltText = useSaveElementAltText();
  // Set once a new element has been created, so that if its alt text then
  // fails to save, Save retries as an update instead of creating a duplicate.
  const createdElement = useRef<Element | null>(null);
  // The complete desired set of trip ids this element belongs to. Initialized
  // from the element and toggled via the trip sheet; sent as tripIds on save.
  // Ids of trips the user can't see (not in the trips list) are still kept here
  // so saving doesn't drop them.
  const [tripIds, setTripIds] = useState<string[]>(
    () => element?.trips.map(trip => trip.id) ?? initialTripIds ?? [],
  );
  const [tripSheetOpen, setTripSheetOpen] = useState(false);
  // The complete desired set of labels, in display order; sent as labels on
  // save. labelDraft holds the in-progress text for the add-label input.
  const [labels, setLabels] = useState<string[]>(() => [
    ...(element?.labels ?? []),
  ]);
  const [labelDraft, setLabelDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updateElement, {loading: updating}] = useMutation(
    UpdateElementDocument,
  );
  const [createElement, {loading: creating}] = useMutation(
    CreateElementDocument,
  );
  const saving = updating || creating;
  const [deleteElement, {loading: deleting}] = useMutation(
    DeleteElementDocument,
  );
  const photoPicker = usePhotoPicker({
    multiple: true,
    onPicked: photo => {
      savedAltText.current[photo.id] = photo.description;
      setPhotos(prev => [...prev, toEditablePhoto(photo)]);
    },
    onError: () => setErrorMessage(t.edit.addPhotoFailed),
  });
  const uploading = photoPicker.busy;
  const {data: tripsData} = useQuery(TripsDocument);
  const allTrips = tripsData?.trips ?? [];
  const selectedTrips = allTrips.filter(trip => tripIds.includes(trip.id));

  const busy = saving || uploading || deleting;

  function toggleTrip(id: string) {
    setTripIds(prev =>
      prev.includes(id) ? prev.filter(tripId => tripId !== id) : [...prev, id],
    );
  }

  const trimmedUri = uri.trim();
  const uriValid = isValidUrl(trimmedUri);
  const uriError =
    trimmedUri.length > 0 && !uriValid ? t.edit.invalidUrl : null;

  const canSave =
    name.trim().length > 0 && (trimmedUri.length === 0 || uriValid) && !busy;

  function onAddLabel() {
    const label = labelDraft.trim();
    if (!label) return;
    // Labels are free-form strings matched exactly when filtering, so skip
    // exact duplicates rather than adding a second identical chip.
    setLabels(prev => (prev.includes(label) ? prev : [...prev, label]));
    setLabelDraft('');
  }

  function onRemoveLabel(label: string) {
    setLabels(prev => prev.filter(existing => existing !== label));
  }

  function onLocationChange(place: LocationValue & {name?: string}) {
    setLocation({
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      placeId: place.placeId,
    });
    // Picking a place before naming the element names it after the place.
    if (place.name && name.trim().length === 0) setName(place.name);
  }

  async function onSave() {
    setErrorMessage(null);
    const input: CreateElementInput = {
      name: name.trim(),
      uri: trimmedUri,
      icon,
      description,
      completed,
      // Complete desired set of photo ids, in order: reorders/removes/adds.
      photoIds: photos.map(photo => photo.id),
      tripIds,
      labels,
      // Null (not omitted) when removed, so an edit clears it.
      location,
      schedule: element?.schedule
        ? {
            allDay: element.schedule.allDay,
            startDate: element.schedule.startDate,
            endDate: element.schedule.endDate,
            startTime: element.schedule.startTime,
            endTime: element.schedule.endTime,
            startTz: element.schedule.startTz,
            endTz: element.schedule.endTz,
          }
        : undefined,
    };

    let saved: Element;
    try {
      const existing = element ?? createdElement.current;
      if (existing) {
        const result = await updateElement({
          variables: {input: {...input, id: existing.id}},
        });
        if (!result.data) throw new Error('updateElement returned no element');
        saved = result.data.updateElement;
      } else {
        const result = await createElement({
          variables: {input},
          // The map's element queries don't know about the new one yet.
          refetchQueries: [ElementsDocument],
        });
        if (!result.data) throw new Error('createElement returned no element');
        saved = result.data.createElement;
        createdElement.current = saved;
      }
    } catch {
      setErrorMessage(element ? t.edit.saveFailed : t.create.saveFailed);
      return;
    }
    // Alt text goes per photo once the photos are on the element. The element
    // is saved either way; on a partial failure stay on the form so Save can
    // retry the alt text that didn't go through.
    if (await saveAltText(saved.id, photos, savedAltText.current)) {
      onSaved(saved);
    } else {
      setErrorMessage(t.photos.altTextFailed);
    }
  }

  function onDelete() {
    if (!element) return;
    Alert.alert(t.edit.deleteElement, t.edit.deleteConfirm(element.name), [
      {text: t.common.cancel, style: 'cancel'},
      {text: t.common.delete, style: 'destructive', onPress: confirmDelete},
    ]);
  }

  async function confirmDelete() {
    if (!element) return;
    setErrorMessage(null);
    try {
      await deleteElement({
        variables: {id: element.id},
        // Drop the element from the cache so the detail/list queries it backs
        // stop returning it; the map prunes its own accumulated set via the
        // removedElementId nav param.
        update(cache) {
          cache.evict({
            id: cache.identify({__typename: 'Element', id: element.id}),
          });
          cache.gc();
        },
      });
      onDeleted?.();
    } catch {
      setErrorMessage(t.edit.deleteFailed);
    }
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.header, {paddingTop: safeAreaInsets.top + 8}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={element ? t.edit.cancel : t.create.cancel}
          hitSlop={10}
          onPress={onCancel}
          disabled={busy}
          style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{t.common.cancel}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {element ? t.edit.title : t.create.title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={element ? t.edit.saveChanges : t.create.create}
          hitSlop={10}
          onPress={onSave}
          disabled={!canSave}
          style={styles.headerButton}>
          {saving ? (
            <ActivityIndicator color={theme.muted} />
          ) : (
            <Text
              style={[
                styles.headerButtonText,
                styles.saveText,
                !canSave && styles.saveTextDisabled,
              ]}>
              {element ? t.edit.save : t.create.create}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: safeAreaInsets.bottom + 24},
        ]}
        keyboardShouldPersistTaps="handled">
        <Field label={t.edit.name}>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder={t.edit.name}
            editable={!saving}
          />
        </Field>

        <Field label={t.edit.icon}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.edit.chooseIcon}
            disabled={saving}
            onPress={() => setPickerOpen(true)}
            style={styles.iconButton}>
            {icon ? (
              <Text style={styles.iconButtonValue}>{icon}</Text>
            ) : (
              <Text style={styles.iconButtonPlaceholder}>＋</Text>
            )}
          </Pressable>
        </Field>

        <Field label={t.edit.location}>
          <LocationField
            value={location}
            onChange={place =>
              place ? onLocationChange(place) : setLocation(null)
            }
            disabled={saving}
          />
        </Field>

        <Field label={t.edit.url}>
          <TextField
            value={uri}
            onChangeText={setUri}
            placeholder="https://example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!saving}
            invalid={uriError != null}
          />
          {uriError ? <Text style={styles.error}>{uriError}</Text> : null}
        </Field>

        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>{t.edit.completed}</Text>
          {/*
            Android tints a switch from the Material theme's colorPrimary, not
            from ours, so both states are set explicitly. On is a solid mid-tone
            against a translucent off — the same fill-weight cue the map pins
            use, which survives desaturation. Deliberately not accent: several
            switched-on controls would out-shout the pins.
          */}
          <Switch
            value={completed}
            onValueChange={setCompleted}
            disabled={saving}
            trackColor={{false: theme.lineFillStrong, true: theme.muted}}
            thumbColor={theme.surface}
          />
        </View>

        <Field label={t.edit.photos}>
          <PhotoGridEditor
            photos={photos}
            onChange={setPhotos}
            onAdd={() => {
              setErrorMessage(null);
              photoPicker.open();
            }}
            adding={uploading}
            disabled={saving}
          />
        </Field>

        <Field label={t.edit.description}>
          <TextField
            style={styles.multiline}
            value={description}
            onChangeText={setDescription}
            placeholder={t.edit.description}
            multiline
            textAlignVertical="top"
            editable={!saving}
          />
        </Field>

        <Field label={t.edit.trips}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.edit.chooseTrips}
            disabled={saving}
            onPress={() => setTripSheetOpen(true)}
            style={styles.tripsSelector}>
            {selectedTrips.length > 0 ? (
              <View style={styles.tripPills}>
                {selectedTrips.map(trip => (
                  <View key={trip.id} style={styles.tripPill}>
                    {trip.icon ? (
                      <Text style={styles.tripPillIcon}>{trip.icon}</Text>
                    ) : null}
                    <Text style={styles.tripPillText} numberOfLines={1}>
                      {trip.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.tripsPlaceholder}>{t.edit.addToTrips}</Text>
            )}
          </Pressable>
        </Field>

        <Field label={t.edit.labels}>
          {labels.length > 0 ? (
            <View style={styles.labelRow}>
              {labels.map(label => (
                <View key={label} style={styles.labelChip}>
                  <Text style={styles.labelChipText}>{label}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.edit.removeLabel(label)}
                    hitSlop={8}
                    disabled={saving}
                    onPress={() => onRemoveLabel(label)}
                    style={styles.labelChipRemove}>
                    <Text style={styles.labelChipRemoveIcon}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.labelInputRow}>
            <TextField
              containerStyle={styles.flex}
              value={labelDraft}
              onChangeText={setLabelDraft}
              placeholder={t.edit.addLabelPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onAddLabel}
              blurOnSubmit={false}
              editable={!saving}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.edit.addLabel}
              disabled={saving || labelDraft.trim().length === 0}
              onPress={onAddLabel}
              style={[
                styles.labelAdd,
                (saving || labelDraft.trim().length === 0) &&
                  styles.labelAddDisabled,
              ]}>
              <Text style={styles.labelAddText}>{t.edit.add}</Text>
            </Pressable>
          </View>
        </Field>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {element ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.edit.deleteElement}
            onPress={onDelete}
            disabled={busy}
            style={[styles.deleteButton, busy && styles.deleteButtonDisabled]}>
            {deleting ? (
              <ActivityIndicator color={theme.danger} />
            ) : (
              <Text style={styles.deleteButtonText}>
                {t.edit.deleteElement}
              </Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>

      <EmojiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={emoji => setIcon(emoji.emoji)}
        theme={pickerTheme}
        translation={EMOJI_TRANSLATIONS[language]}
      />

      {photoPicker.sheet}

      <Sheet
        visible={tripSheetOpen}
        onClose={() => setTripSheetOpen(false)}
        scrimAccessibilityLabel={t.edit.closeTripPicker}>
        <Text style={styles.sheetTitle}>{t.edit.trips}</Text>
        {allTrips.length === 0 ? (
          <Text style={styles.sheetEmpty}>{t.edit.noTrips}</Text>
        ) : (
          <ScrollView
            style={styles.tripList}
            keyboardShouldPersistTaps="handled">
            {allTrips.map(trip => {
              const selected = tripIds.includes(trip.id);
              return (
                <Pressable
                  key={trip.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: selected}}
                  accessibilityLabel={trip.name}
                  onPress={() => toggleTrip(trip.id)}
                  style={({pressed}) => [
                    styles.tripRow,
                    pressed && styles.tripRowPressed,
                  ]}>
                  {trip.icon ? (
                    <Text style={styles.tripRowIcon}>{trip.icon}</Text>
                  ) : null}
                  <Text style={styles.tripRowName} numberOfLines={1}>
                    {trip.name}
                  </Text>
                  {selected ? <Text style={styles.tripRowCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Sheet>
    </View>
  );
}

function toEditablePhoto(photo: {
  id: string;
  thumbnail: string;
  description: string;
  type?: EditablePhoto['type'];
}): EditablePhoto {
  return {
    id: photo.id,
    thumbnail: photo.thumbnail,
    description: photo.description,
    type: photo.type,
  };
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: {flex: 1},
    screen: {
      flex: 1,
      backgroundColor: theme.canvas,
    },
    loadingPane: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      // Canvas plus a rule, not a filled bar — the screen is one background
      // value end to end. A full point, since a hairline barely renders.
      borderBottomWidth: 1,
      borderBottomColor: theme.line,
    },
    headerButton: {
      minWidth: 56,
      justifyContent: 'center',
    },
    headerButtonText: {
      fontSize: 16,
      color: theme.ink,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.ink,
      textAlign: 'center',
    },
    saveText: {
      color: theme.accentText,
      fontWeight: '600',
      textAlign: 'right',
    },
    saveTextDisabled: {
      opacity: 0.4,
    },
    scrollContent: {
      padding: 16,
      gap: 20,
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    iconButton: {
      width: 64,
      height: 64,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.lineControl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonValue: {
      fontSize: 32,
    },
    iconButtonPlaceholder: {
      fontSize: 28,
      color: theme.muted,
    },
    multiline: {
      minHeight: 120,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tripsSelector: {
      borderWidth: 1,
      borderColor: theme.lineControl,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    tripsPlaceholder: {
      fontSize: 16,
      color: theme.muted,
    },
    tripPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tripPill: {
      flexDirection: 'row',
      alignItems: 'center',
      maxWidth: '100%',
      backgroundColor: theme.lineFill,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    tripPillIcon: {
      fontSize: 14,
      lineHeight: 18,
      marginRight: 6,
    },
    tripPillText: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.ink,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.ink,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    sheetEmpty: {
      fontSize: 14,
      color: theme.muted,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    tripList: {
      maxHeight: 320,
    },
    tripRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 8,
    },
    tripRowPressed: {
      backgroundColor: theme.lineFill,
    },
    tripRowIcon: {
      fontSize: 18,
      lineHeight: 22,
      marginRight: 10,
    },
    tripRowName: {
      flex: 1,
      fontSize: 16,
      color: theme.ink,
    },
    // A selected state, which is a sanctioned use of accent. The tick carries
    // the meaning on its own, so the hue is reinforcement rather than the
    // only signal.
    tripRowCheck: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.accent,
      marginLeft: 12,
    },
    labelRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    labelChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.lineFill,
      paddingLeft: 10,
      paddingRight: 6,
      paddingVertical: 5,
      borderRadius: 12,
    },
    labelChipText: {
      color: theme.ink,
      fontSize: 12,
      fontWeight: '500',
    },
    labelChipRemove: {
      width: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelChipRemoveIcon: {
      color: theme.ink,
      fontSize: 16,
      lineHeight: 18,
      fontWeight: '600',
    },
    labelInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    // A secondary action: a quiet fill with an ink label, rather than a solid
    // one. A white label on `muted` is only 3.48:1, and flipping the label
    // doesn't help — `muted` sits mid-scale in both appearances.
    labelAdd: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.lineFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelAddDisabled: {
      opacity: 0.4,
    },
    labelAddText: {
      color: theme.ink,
      fontSize: 16,
      fontWeight: '600',
    },
    error: {
      color: theme.danger,
      fontSize: 14,
    },
    deleteButton: {
      marginTop: 12,
      paddingVertical: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonDisabled: {
      opacity: 0.4,
    },
    deleteButtonText: {
      color: theme.danger,
      fontSize: 16,
      fontWeight: '600',
    },
  });
