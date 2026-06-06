import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
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
  type ElementDetailQuery,
  type ElementInput,
  useElementDetailQuery,
  useUpdateElementMutation,
} from '../graphql/__generated__/types';
import type {RootStackParamList} from '../navigation/types';
import {photoImageSource} from '../photos/photoImageSource';
import {usePhotoUploader} from '../photos/photoUpload';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';

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
  const {data, loading} = useElementDetailQuery({variables: {id: elementId}});
  const element = data?.element;

  return (
    <View style={styles.screen}>
      {element ? (
        <EditForm element={element} onDone={() => navigation.goBack()} />
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
 * requires — including the ones we don't expose (uri, icon, location, schedule,
 * labels, trips) — so saving an edit doesn't clear them.
 */
function EditForm({element, onDone}: {element: Element; onDone: () => void}) {
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updateElement, {loading: saving}] = useUpdateElementMutation();
  const {pickAndUpload, uploading} = usePhotoUploader();

  const trimmedUri = uri.trim();
  const uriValid = isValidUrl(trimmedUri);
  const uriError =
    trimmedUri.length > 0 && !uriValid ? 'Enter a valid URL.' : null;

  const canSave =
    name.trim().length > 0 &&
    (trimmedUri.length === 0 || uriValid) &&
    !saving &&
    !uploading;

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
      // Preserved as-is — not editable here, but required by the mutation.
      labels: element.labels,
      tripIds: element.trips.map(trip => trip.id),
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
          disabled={saving}
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

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </ScrollView>

      <EmojiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={emoji => setIcon(emoji.emoji)}
      />
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
    error: {
      color: theme.error,
      fontSize: 14,
    },
  });
