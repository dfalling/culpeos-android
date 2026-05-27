import {
  ActivityIndicator,
  Image,
  Modal,
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

type Props = {
  elementId: string | null;
  onClose: () => void;
};

type ElementDetail = ElementDetailQuery['element'];

export function ElementDetailModal({elementId, onClose}: Props) {
  const {data, loading} = useElementDetailQuery({
    variables: {id: elementId ?? ''},
    skip: !elementId,
  });

  return (
    <Modal
      animationType="slide"
      visible={elementId !== null}
      onRequestClose={onClose}
      presentationStyle="fullScreen">
      <ModalContents
        element={data?.element ?? null}
        loading={loading}
        onClose={onClose}
      />
    </Modal>
  );
}

function ModalContents({
  element,
  loading,
  onClose,
}: {
  element: ElementDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const safeAreaInsets = useSafeAreaInsets();

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
                <Image
                  key={photo.id}
                  source={{uri: photo.regular}}
                  style={styles.photo}
                />
              ))}
            </ScrollView>
          ) : null}

          {element.description ? (
            <Section title="About">
              <Text style={styles.body}>{element.description}</Text>
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
                  <View key={label} style={styles.labelChip}>
                    <Text style={styles.labelChipText}>{label}</Text>
                  </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f1',
    marginRight: 12,
  },
  closeIcon: {
    fontSize: 20,
    lineHeight: 22,
    color: '#222',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
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
    backgroundColor: '#1d6fe0',
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
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  completedTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  completedTagText: {
    color: '#1e8e3e',
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
    backgroundColor: '#eee',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  labelChip: {
    backgroundColor: '#eef3fb',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  labelChipText: {
    color: '#1d6fe0',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingPane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
