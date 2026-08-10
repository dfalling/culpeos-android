import {useMutation, useQuery} from '@apollo/client/react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import EmojiPicker from 'rn-emoji-keyboard';
import {
  DeleteElementDocument,
  ElementDetailDocument,
  type ElementDetailQuery,
  type ElementInput,
  TripsDocument,
  UpdateElementDocument,
} from '../graphql/__generated__/types';
import type {RootStackParamList} from '../navigation/types';
import {photoImageSource} from '../photos/photoImageSource';
import {usePhotoUploader} from '../photos/photoUpload';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {Sheet} from '../ui/Sheet';

type Props = NativeStackScreenProps<RootStackParamList, 'ElementEdit'>;

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
          onDone={() => navigation.goBack()}
          // popTo (not goBack) so we pass the map back over the now-stale detail
          // screen, and hand it the deleted id to drop from its pin set.
          onDeleted={() =>
            navigation.popTo('Map', {removedElementId: elementId})
          }
        />
      ) : (
        <View style={styles.loadingPane}>
          {loading ? <ActivityIndicator /> : null}
        </View>
      )}
    </View>
  );
}

/**
 * The form initializes its fields from the loaded element, so it's rendered
 * only once the element is available. We round-trip every field the mutation
 * requires — including the ones we don't expose (location, schedule) —
 * so saving an edit doesn't clear them.
 */
function EditForm({
  element,
  onDone,
  onDeleted,
}: {
  element: Element;
  onDone: () => void;
  onDeleted: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const safeAreaInsets = useSafeAreaInsets();
  const [name, setName] = useState(element.name);
  const [uri, setUri] = useState(element.uri);
  const [icon, setIcon] = useState(element.icon);
  const [description, setDescription] = useState(element.description);
  const [completed, setCompleted] = useState(element.completed);
  // The complete desired set of photos, in display order. Initialized from the
  // element and mutated as the user adds/removes; sent as photoIds on save.
  const [photos, setPhotos] = useState<{id: string; thumbnail: string}[]>(() =>
    element.photos.map(photo => ({id: photo.id, thumbnail: photo.thumbnail})),
  );
  // The complete desired set of trip ids this element belongs to. Initialized
  // from the element and toggled via the trip sheet; sent as tripIds on save.
  // Ids of trips the user can't see (not in the trips list) are still kept here
  // so saving doesn't drop them.
  const [tripIds, setTripIds] = useState<string[]>(() =>
    element.trips.map(trip => trip.id),
  );
  const [tripSheetOpen, setTripSheetOpen] = useState(false);
  // The complete desired set of labels, in display order; sent as labels on
  // save. labelDraft holds the in-progress text for the add-label input.
  const [labels, setLabels] = useState<string[]>(() => [...element.labels]);
  const [labelDraft, setLabelDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updateElement, {loading: saving}] = useMutation(UpdateElementDocument);
  const [deleteElement, {loading: deleting}] = useMutation(
    DeleteElementDocument,
  );
  const {pickAndUpload, uploading} = usePhotoUploader();
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
    trimmedUri.length > 0 && !uriValid ? 'Enter a valid URL.' : null;

  const canSave =
    name.trim().length > 0 && (trimmedUri.length === 0 || uriValid) && !busy;

  async function onAddPhoto() {
    setErrorMessage(null);
    try {
      const photo = await pickAndUpload();
      if (photo) {
        setPhotos(prev => [
          ...prev,
          {id: photo.id, thumbnail: photo.thumbnail},
        ]);
      }
    } catch {
      setErrorMessage('Could not add photo. Please try again.');
    }
  }

  function onRemovePhoto(id: string) {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  }

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

  async function onSave() {
    setErrorMessage(null);
    const input: ElementInput = {
      id: element.id,
      name: name.trim(),
      uri: trimmedUri,
      icon,
      description,
      completed,
      // Complete desired set of photo ids, in order: reorders/removes/adds.
      photoIds: photos.map(photo => photo.id),
      tripIds,
      labels,
      location: element.location
        ? {
            address: element.location.address,
            latitude: element.location.latitude,
            longitude: element.location.longitude,
            placeId: element.location.placeId,
          }
        : undefined,
      schedule: element.schedule
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

    try {
      await updateElement({variables: {input}});
      onDone();
    } catch {
      setErrorMessage('Could not save changes. Please try again.');
    }
  }

  function onDelete() {
    Alert.alert(
      'Delete element',
      `Permanently delete "${element.name}"? This can't be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: confirmDelete},
      ],
    );
  }

  async function confirmDelete() {
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
      onDeleted();
    } catch {
      setErrorMessage('Could not delete element. Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <View style={[styles.header, {paddingTop: safeAreaInsets.top + 8}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel editing"
          hitSlop={10}
          onPress={onDone}
          disabled={busy}
          style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Edit element
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save changes"
          hitSlop={10}
          onPress={onSave}
          disabled={!canSave}
          style={styles.headerButton}>
          {saving ? (
            <ActivityIndicator />
          ) : (
            <Text
              style={[
                styles.headerButtonText,
                styles.saveText,
                !canSave && styles.saveTextDisabled,
              ]}>
              Save
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
        <Field label="Name">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            editable={!saving}
          />
        </Field>

        <Field label="Icon">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose icon"
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

        <Field label="URL">
          <TextInput
            style={styles.input}
            value={uri}
            onChangeText={setUri}
            placeholder="https://example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!saving}
          />
          {uriError ? <Text style={styles.error}>{uriError}</Text> : null}
        </Field>

        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Completed</Text>
          <Switch
            value={completed}
            onValueChange={setCompleted}
            disabled={saving}
          />
        </View>

        <Field label="Photos">
          <View style={styles.photoGrid}>
            {photos.map(photo => (
              <View key={photo.id} style={styles.photoThumbWrap}>
                <Image
                  source={photoImageSource(photo.thumbnail)}
                  style={styles.photoThumb}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  hitSlop={8}
                  disabled={saving || uploading}
                  onPress={() => onRemovePhoto(photo.id)}
                  style={styles.photoRemove}>
                  <Text style={styles.photoRemoveIcon}>×</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              disabled={saving || uploading}
              onPress={onAddPhoto}
              style={styles.photoAdd}>
              {uploading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.photoAddIcon}>＋</Text>
              )}
            </Pressable>
          </View>
        </Field>

        <Field label="Description">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            multiline
            textAlignVertical="top"
            editable={!saving}
          />
        </Field>

        <Field label="Trips">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose trips"
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
              <Text style={styles.tripsPlaceholder}>Add to trips</Text>
            )}
          </Pressable>
        </Field>

        <Field label="Labels">
          {labels.length > 0 ? (
            <View style={styles.labelRow}>
              {labels.map(label => (
                <View key={label} style={styles.labelChip}>
                  <Text style={styles.labelChipText}>{label}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove label ${label}`}
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
            <TextInput
              style={[styles.input, styles.flex]}
              value={labelDraft}
              onChangeText={setLabelDraft}
              placeholder="Add a label"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onAddLabel}
              blurOnSubmit={false}
              editable={!saving}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add label"
              disabled={saving || labelDraft.trim().length === 0}
              onPress={onAddLabel}
              style={[
                styles.labelAdd,
                (saving || labelDraft.trim().length === 0) &&
                  styles.labelAddDisabled,
              ]}>
              <Text style={styles.labelAddText}>Add</Text>
            </Pressable>
          </View>
        </Field>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete element"
          onPress={onDelete}
          disabled={busy}
          style={[styles.deleteButton, busy && styles.deleteButtonDisabled]}>
          {deleting ? (
            <ActivityIndicator color={theme.error} />
          ) : (
            <Text style={styles.deleteButtonText}>Delete element</Text>
          )}
        </Pressable>
      </ScrollView>

      <EmojiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={emoji => setIcon(emoji.emoji)}
      />

      <Sheet
        visible={tripSheetOpen}
        onClose={() => setTripSheetOpen(false)}
        scrimAccessibilityLabel="Close trip picker">
        <Text style={styles.sheetTitle}>Trips</Text>
        {allTrips.length === 0 ? (
          <Text style={styles.sheetEmpty}>No trips available.</Text>
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
    </KeyboardAvoidingView>
  );
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
      backgroundColor: theme.background,
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    headerButton: {
      minWidth: 56,
      justifyContent: 'center',
    },
    headerButtonText: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: 'center',
    },
    saveText: {
      color: theme.action,
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
      color: theme.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.textPrimary,
    },
    iconButton: {
      width: 64,
      height: 64,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonValue: {
      fontSize: 32,
    },
    iconButtonPlaceholder: {
      fontSize: 28,
      color: theme.textTertiary,
    },
    multiline: {
      minHeight: 120,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    photoThumbWrap: {
      width: 80,
      height: 80,
    },
    photoThumb: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: theme.surfaceMuted,
    },
    photoRemove: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      // Inverts against the screen so the badge reads on any photo in either
      // appearance: a dark chip in light mode, a light chip in dark mode.
      backgroundColor: theme.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoRemoveIcon: {
      color: theme.background,
      fontSize: 16,
      lineHeight: 18,
      fontWeight: '600',
    },
    photoAdd: {
      width: 80,
      height: 80,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoAddIcon: {
      fontSize: 28,
      color: theme.textTertiary,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tripsSelector: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    tripsPlaceholder: {
      fontSize: 16,
      color: theme.textTertiary,
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
      backgroundColor: theme.accentMuted,
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
      color: theme.accent,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    sheetEmpty: {
      fontSize: 14,
      color: theme.textSecondary,
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
      backgroundColor: theme.surfaceMuted,
    },
    tripRowIcon: {
      fontSize: 18,
      lineHeight: 22,
      marginRight: 10,
    },
    tripRowName: {
      flex: 1,
      fontSize: 16,
      color: theme.textPrimary,
    },
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
      backgroundColor: theme.accentMuted,
      paddingLeft: 10,
      paddingRight: 6,
      paddingVertical: 5,
      borderRadius: 12,
    },
    labelChipText: {
      color: theme.accent,
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
      color: theme.accent,
      fontSize: 16,
      lineHeight: 18,
      fontWeight: '600',
    },
    labelInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    labelAdd: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelAddDisabled: {
      opacity: 0.4,
    },
    labelAddText: {
      color: theme.action,
      fontSize: 16,
      fontWeight: '600',
    },
    error: {
      color: theme.error,
      fontSize: 14,
    },
    deleteButton: {
      marginTop: 12,
      paddingVertical: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonDisabled: {
      opacity: 0.4,
    },
    deleteButtonText: {
      color: theme.error,
      fontSize: 16,
      fontWeight: '600',
    },
  });
