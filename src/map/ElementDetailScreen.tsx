import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  type ElementDetailQuery,
  useElementDetailQuery,
} from '../graphql/__generated__/types';
import type {RootStackParamList} from '../navigation/types';
import {PhotoViewer} from '../photos/PhotoViewer';
import {photoImageSource} from '../photos/photoImageSource';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'ElementDetail'>;

type ElementDetail = ElementDetailQuery['element'];

type ElementPhoto = ElementDetail['photos'][number];

export function ElementDetailScreen({route, navigation}: Props) {
  const {elementId} = route.params;
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const {data, loading} = useElementDetailQuery({variables: {id: elementId}});

  return (
    <View style={styles.screen}>
      <ModalContents
        element={data?.element ?? null}
        loading={loading}
        onClose={() => navigation.goBack()}
        onEdit={() => navigation.navigate('ElementEdit', {elementId})}
        // Tapping a label closes the details and adds it to the map's active
        // filters. popTo (not navigate) so the detail screen animates backward
        // off the stack — closing — rather than pushing a new level forward.
        onSelectLabel={label =>
          navigation.popTo('Map', {addLabelFilter: label})
        }
      />
    </View>
  );
}

function ModalContents({
  element,
  loading,
  onClose,
  onEdit,
  onSelectLabel,
}: {
  element: ElementDetail | null;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSelectLabel: (label: string) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const safeAreaInsets = useSafeAreaInsets();
  const [viewedPhoto, setViewedPhoto] = useState<ElementPhoto | null>(null);

  return (
    <View style={styles.container}>
      <View style={[styles.header, {paddingTop: safeAreaInsets.top + 8}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close details"
          hitSlop={10}
          onPress={onClose}
          style={styles.closeButton}>
          <Text style={styles.closeIcon}>×</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {element?.name ?? (loading ? 'Loading…' : ' ')}
        </Text>
        {element ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit element"
            hitSlop={10}
            onPress={onEdit}
            style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        ) : null}
      </View>

      {element ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: safeAreaInsets.bottom + 24},
          ]}>
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              {element.icon ? (
                <Text style={styles.icon}>{element.icon}</Text>
              ) : null}
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.title}>{element.name}</Text>
              {element.location?.address ? (
                <Text style={styles.subtitle}>{element.location.address}</Text>
              ) : null}
              {element.completed ? (
                <View style={styles.completedTag}>
                  <Text style={styles.completedTagText}>Completed</Text>
                </View>
              ) : null}
            </View>
          </View>

          {element.photos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}>
              {element.photos.map(photo => (
                <Pressable
                  key={photo.id}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={
                    photo.description
                      ? `View photo full screen: ${photo.description}`
                      : 'View photo full screen'
                  }
                  onPress={() => setViewedPhoto(photo)}
                  style={({pressed}) => pressed && styles.photoPressed}>
                  <Image
                    source={photoImageSource(photo.regular)}
                    style={styles.photo}
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {element.description ? (
            <Section title="About">
              <Text style={styles.body}>{element.description}</Text>
            </Section>
          ) : null}

          {element.uri ? (
            <Section title="Link">
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open link ${element.uri}`}
                onPress={() => Linking.openURL(element.uri)}
                style={({pressed}) => pressed && styles.linkPressed}>
                <Text style={styles.link} numberOfLines={2}>
                  {element.uri}
                </Text>
              </Pressable>
            </Section>
          ) : null}

          {element.schedule ? (
            <Section title="Schedule">
              <Text style={styles.body}>
                {formatSchedule(element.schedule)}
              </Text>
            </Section>
          ) : null}

          {element.labels.length > 0 ? (
            <Section title="Labels">
              <View style={styles.labelRow}>
                {element.labels.map(label => (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter map by label ${label}`}
                    onPress={() => onSelectLabel(label)}
                    style={({pressed}) => [
                      styles.labelChip,
                      pressed && styles.labelChipPressed,
                    ]}>
                    <Text style={styles.labelChipText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </Section>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.loadingPane}>
          {loading ? <ActivityIndicator /> : null}
        </View>
      )}

      {/*
        Sibling of the ScrollView, not a child: as an overlay it has to cover
        the header too, and a PanResponder nested inside a scroll view would
        fight it for the pinch.
      */}
      {viewedPhoto ? (
        <PhotoViewer
          uri={viewedPhoto.regular}
          description={viewedPhoto.description}
          onClose={() => setViewedPhoto(null)}
        />
      ) : null}
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

function formatSchedule(schedule: NonNullable<ElementDetail['schedule']>) {
  const {allDay, startDate, endDate, startTime, endTime} = schedule;
  const range = startDate === endDate ? startDate : `${startDate} – ${endDate}`;
  if (allDay || (!startTime && !endTime)) return range;
  const time =
    startTime && endTime
      ? `${startTime}–${endTime}`
      : (startTime ?? endTime ?? '');
  return `${range} · ${time}`;
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceMuted,
      marginRight: 12,
    },
    closeIcon: {
      fontSize: 20,
      lineHeight: 22,
      color: theme.textPrimary,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    editButton: {
      marginLeft: 12,
      paddingHorizontal: 4,
    },
    editButtonText: {
      fontSize: 16,
      color: theme.action,
      fontWeight: '600',
    },
    scrollContent: {
      padding: 16,
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    icon: {
      fontSize: 28,
      lineHeight: 32,
      textAlign: 'center',
    },
    heroBody: {
      flex: 1,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 4,
    },
    completedTag: {
      alignSelf: 'flex-start',
      backgroundColor: theme.successMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      marginTop: 8,
    },
    completedTagText: {
      color: theme.success,
      fontSize: 11,
      fontWeight: '600',
    },
    photoStrip: {
      paddingVertical: 16,
      gap: 8,
    },
    photo: {
      width: 200,
      height: 140,
      borderRadius: 10,
      backgroundColor: theme.surfaceMuted,
    },
    photoPressed: {
      opacity: 0.7,
    },
    section: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    body: {
      fontSize: 15,
      lineHeight: 21,
      color: theme.textPrimary,
    },
    link: {
      fontSize: 15,
      lineHeight: 21,
      color: theme.accent,
    },
    linkPressed: {
      opacity: 0.6,
    },
    labelRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    labelChip: {
      backgroundColor: theme.accentMuted,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    labelChipPressed: {
      backgroundColor: theme.border,
    },
    labelChipText: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '500',
    },
    loadingPane: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
