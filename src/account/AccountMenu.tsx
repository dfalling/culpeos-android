import {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {logout} from '../auth/authClient';
import {useAuth} from '../auth/tokenStore';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {Sheet} from '../ui/Sheet';

/**
 * Account avatar + sheet, pinned top-right. Lives inside the map screen (rather
 * than as a root-level sibling) so pushed detail screens cover it.
 */
export function AccountMenu() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const safeAreaInsets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const auth = useAuth();

  if (!auth) {
    return null;
  }
  const {user} = auth;
  const initial = user.email.trim().charAt(0).toUpperCase() || '?';

  return (
    <>
      <Pressable
        accessibilityLabel="Account menu"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({pressed}) => [
          styles.avatarButton,
          {top: safeAreaInsets.top + 12},
          pressed && styles.avatarPressed,
        ]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        scrimAccessibilityLabel="Close account menu">
        <Text style={styles.sheetEmail} numberOfLines={1}>
          {user.email}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setOpen(false);
            logout();
          }}
          style={({pressed}) => [
            styles.sheetItem,
            pressed && styles.sheetItemPressed,
          ]}>
          <Text style={styles.sheetItemText}>Log out</Text>
        </Pressable>
      </Sheet>
    </>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    // Neutral: an avatar is an identity marker, not an action, and it sits over
    // the map where an accent fill would pull against the pins. Matches the
    // search button opposite it — both are map chrome.
    avatarButton: {
      position: 'absolute',
      right: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.lineControl,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: {width: 0, height: 2},
      elevation: 4,
    },
    avatarPressed: {opacity: 0.8},
    avatarText: {
      color: theme.ink,
      fontSize: 16,
      fontWeight: '600',
    },
    sheetEmail: {
      fontSize: 12,
      color: theme.muted,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    sheetItem: {
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 8,
    },
    sheetItemPressed: {
      backgroundColor: theme.lineFill,
    },
    sheetItemText: {
      fontSize: 16,
      color: theme.ink,
    },
  });
