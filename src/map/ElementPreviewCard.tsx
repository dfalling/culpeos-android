import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useElementDetailQuery} from '../graphql/__generated__/types';

type Props = {
  elementId: string;
  bottomOffset: number;
  onClose: () => void;
  onExpand: () => void;
};

export function ElementPreviewCard({
  elementId,
  bottomOffset,
  onClose,
  onExpand,
}: Props) {
  const {data, loading} = useElementDetailQuery({variables: {id: elementId}});
  const element = data?.element;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        element ? `Open details for ${element.name}` : 'Open details'
      }
      onPress={onExpand}
      style={[styles.card, {bottom: bottomOffset}]}>
      <View style={styles.iconWrap}>
        {element?.icon ? <Text style={styles.icon}>{element.icon}</Text> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {element?.name ?? (loading ? 'Loading…' : ' ')}
        </Text>
        {element?.location?.address ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {element.location.address}
          </Text>
        ) : null}
        {element?.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {element.description}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close preview"
        hitSlop={10}
        onPress={onClose}
        style={styles.closeButton}>
        <Text style={styles.closeIcon}>×</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d6fe0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: '#444',
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f1',
  },
  closeIcon: {
    fontSize: 20,
    lineHeight: 22,
    color: '#444',
  },
});
