import {useQuery} from '@apollo/client/react';
import {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {ElementDetailDocument} from '../graphql/__generated__/types';
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
  const {data, loading} = useQuery(ElementDetailDocument, {
    variables: {id: elementId},
  });
  const element = data?.element;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        element ? `Open details for ${element.name}` : 'Open details'
      }
      onPress={onExpand}
      style={[styles.card, {bottom: bottomOffset}]}>
      {element?.icon ? <Text style={styles.icon}>{element.icon}</Text> : null}
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
    // No wrapping badge: the emoji stands on its own, and an element without an
    // icon renders nothing at all so the text fills the whole card.
    icon: {
      fontSize: 28,
      lineHeight: 34,
      marginRight: 12,
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
