import {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useElementDetailQuery} from '../graphql/__generated__/types';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';

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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      left: 12,
      right: 12,
      backgroundColor: theme.card,
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
      backgroundColor: theme.accent,
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
      color: theme.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    description: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 4,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceMuted,
    },
    closeIcon: {
      fontSize: 20,
      lineHeight: 22,
      color: theme.textSecondary,
    },
  });
