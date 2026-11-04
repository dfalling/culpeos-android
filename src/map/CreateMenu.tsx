import {useNavigation} from '@react-navigation/native';
import {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {t} from '../i18n';
import type {RootStackNavigation} from '../navigation/types';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {Sheet} from '../ui/Sheet';

type Props = {
  /** Distance from the top of the screen (safe-area inset + margin). */
  topOffset: number;
  /** Trips the map is filtered to; a new element starts out in them. */
  tripIds: string[];
};

/**
 * The map's add button, beside the account avatar, and the sheet it opens to
 * pick what to create. Both choices push a form screen over the map.
 */
export function CreateMenu({topOffset, tripIds}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const navigation = useNavigation<RootStackNavigation>();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityLabel={t.create.open}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({pressed}) => [
          styles.addButton,
          {top: topOffset},
          pressed && styles.pressed,
        ]}>
        <Text style={styles.addGlyph}>＋</Text>
      </Pressable>
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        scrimAccessibilityLabel={t.create.close}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setOpen(false);
            navigation.navigate('ElementCreate', {tripIds});
          }}
          style={({pressed}) => [
            styles.sheetItem,
            pressed && styles.sheetItemPressed,
          ]}>
          <Text style={styles.sheetItemText}>{t.create.newElement}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setOpen(false);
            navigation.navigate('TripCreate');
          }}
          style={({pressed}) => [
            styles.sheetItem,
            pressed && styles.sheetItemPressed,
          ]}>
          <Text style={styles.sheetItemText}>{t.create.newTrip}</Text>
        </Pressable>
      </Sheet>
    </>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    // Map chrome like its neighbours (search, filters, account): neutral, so it
    // doesn't compete with the pins it sits over.
    addButton: {
      position: 'absolute',
      right: 64,
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
    pressed: {opacity: 0.8},
    addGlyph: {
      color: theme.ink,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '600',
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
