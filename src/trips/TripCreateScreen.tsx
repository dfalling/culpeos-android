import {useMutation} from '@apollo/client/react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import EmojiPicker, {en, es, pt} from 'rn-emoji-keyboard';
import {
  CreateTripDocument,
  TripsDocument,
  UpdateTripDocument,
} from '../graphql/__generated__/types';
import {language, t} from '../i18n';
import type {RootStackParamList} from '../navigation/types';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {emojiPickerTheme} from '../ui/emojiPickerTheme';
import {TextField} from '../ui/TextField';
import {deviceTimeZone} from './deviceTimeZone';

const EMOJI_TRANSLATIONS = {en, es, pt};

type Props = NativeStackScreenProps<RootStackParamList, 'TripCreate'>;

/**
 * Creates a trip from a name, icon and description, then returns to the map
 * filtered to it — the natural place to start adding its elements, since the
 * map's add button pre-selects the trips it's filtered to.
 *
 * The trip's time zone is the device's: the API otherwise defaults it to GMT,
 * which would put every scheduled element's times in the wrong zone. There's
 * no picker for it here; the web app can change it.
 */
export function TripCreateScreen({navigation}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const pickerTheme = useMemo(() => emojiPickerTheme(theme), [theme]);
  const safeAreaInsets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createTrip, {loading: creating}] = useMutation(CreateTripDocument);
  const [updateTrip, {loading: updating}] = useMutation(UpdateTripDocument);
  const saving = creating || updating;
  const canSave = name.trim().length > 0 && !saving;

  async function onSave() {
    setErrorMessage(null);
    let trip: {id: string; name: string; icon: string};
    try {
      const result = await createTrip({
        variables: {
          input: {
            name: name.trim(),
            description,
            timeZone: deviceTimeZone(),
          },
        },
        // Append to the cached trip list (trip pickers, filters) so the new
        // trip is offered without a refetch. Left alone if it isn't cached:
        // the next read fetches it fresh anyway.
        update(cache, {data}) {
          const created = data?.createTrip;
          if (!created) return;
          cache.updateQuery({query: TripsDocument}, prev =>
            prev ? {trips: [...prev.trips, created]} : prev,
          );
        },
      });
      if (!result.data) throw new Error('createTrip returned no trip');
      trip = result.data.createTrip;
    } catch {
      setErrorMessage(t.createTrip.saveFailed);
      return;
    }

    // createTrip takes no icon, so it's set with a follow-up update. The trip
    // exists by now either way; a failed icon isn't worth stranding the user
    // on this screen (where saving again would create a duplicate trip).
    if (icon) {
      try {
        const result = await updateTrip({
          variables: {input: {id: trip.id, icon}},
        });
        if (result.data) trip = result.data.updateTrip;
      } catch {
        // Keep the icon-less trip.
      }
    }

    navigation.popTo('Map', {
      createdTrip: {id: trip.id, name: trip.name, icon: trip.icon},
    });
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: safeAreaInsets.top + 8}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.createTrip.cancel}
          hitSlop={10}
          onPress={() => navigation.goBack()}
          disabled={saving}
          style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{t.common.cancel}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t.createTrip.title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.createTrip.create}
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
              {t.create.create}
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
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t.edit.name}</Text>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder={t.edit.name}
            autoFocus
            editable={!saving}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t.edit.icon}</Text>
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
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t.edit.description}</Text>
          <TextField
            style={styles.multiline}
            value={description}
            onChangeText={setDescription}
            placeholder={t.edit.description}
            multiline
            textAlignVertical="top"
            editable={!saving}
          />
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </ScrollView>

      <EmojiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={emoji => setIcon(emoji.emoji)}
        theme={pickerTheme}
        translation={EMOJI_TRANSLATIONS[language]}
      />
    </View>
  );
}

// Mirrors the element edit screen, so the two forms read as one family.
const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.canvas,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
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
    error: {
      color: theme.danger,
      fontSize: 14,
    },
  });
