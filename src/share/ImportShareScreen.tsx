import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useImportShareMutation} from '../graphql/__generated__/types';
import type {RootStackParamList} from '../navigation/types';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportShare'>;

/**
 * Transient screen shown when content is shared into the app. It hands the raw,
 * messy shared string to the backend's importShare mutation (which extracts a
 * clean element), then replaces itself with the new element's detail view so the
 * user can review and edit. `replace` (not navigate) keeps this loading step off
 * the back stack — backing out of the detail returns to the map, not here.
 */
export function ImportShareScreen({route, navigation}: Props) {
  const {content} = route.params;
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [importShare] = useImportShareMutation();
  const [failed, setFailed] = useState(false);
  // Guards against React's dev-mode double-invoked effect firing the mutation twice.
  const inFlight = useRef(false);

  const run = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setFailed(false);
    importShare({variables: {content}})
      .then(res => {
        const id = res.data?.importShare.id;
        if (!id) throw new Error('importShare returned no element');
        navigation.replace('ElementDetail', {elementId: id});
      })
      .catch(() => {
        inFlight.current = false;
        setFailed(true);
      });
  }, [content, importShare, navigation]);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel import"
        hitSlop={10}
        onPress={() => navigation.goBack()}
        style={[styles.closeButton, {top: insets.top + 8}]}>
        <Text style={styles.closeIcon}>×</Text>
      </Pressable>

      <View style={styles.center}>
        {failed ? (
          <>
            <Text style={styles.title}>Couldn't save that</Text>
            <Text style={styles.subtitle}>
              We couldn't import what you shared. Check your connection and try
              again.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={run}
              style={({pressed}) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.title}>Saving shared link…</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {content}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    closeButton: {
      position: 'absolute',
      left: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceMuted,
      zIndex: 1,
    },
    closeIcon: {
      fontSize: 20,
      lineHeight: 22,
      color: theme.textPrimary,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      backgroundColor: theme.action,
    },
    retryButtonPressed: {
      opacity: 0.85,
    },
    retryText: {
      color: theme.onAction,
      fontSize: 15,
      fontWeight: '600',
    },
    cancelText: {
      marginTop: 4,
      color: theme.textSecondary,
      fontSize: 14,
    },
  });
