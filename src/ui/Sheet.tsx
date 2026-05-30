import {type ReactNode, useEffect, useRef, useState} from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SheetVariant = 'bottom' | 'fullscreen';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** `bottom` (default): dim scrim + bottom-anchored card. `fullscreen`: opaque full-screen. */
  variant?: SheetVariant;
  /** Tap the scrim to close (bottom variant only). Defaults to true. */
  dismissOnScrimPress?: boolean;
  /** Accessibility label for the scrim's close affordance (bottom variant). */
  scrimAccessibilityLabel?: string;
  children: ReactNode;
};

/**
 * In-tree modal sheet. Rendered as an absolute overlay (not a React Native
 * `Modal`) so it inherits the app's edge-to-edge window and draws behind the
 * status and navigation bars. RN's `Modal` renders in a separate window whose
 * `statusBarTranslucent`/`navigationBarTranslucent` props don't reliably do
 * this on RN 0.85 + Android 15, which left scrims and sheets stopping at the
 * system bars.
 *
 * Owns the slide animation, hardware-back handling, and pointer-event gating;
 * callers supply the content (and their own safe-area padding for fullscreen).
 */
export function Sheet({
  visible,
  onClose,
  variant = 'bottom',
  dismissOnScrimPress = true,
  scrimAccessibilityLabel = 'Close',
  children,
}: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const anim = useRef(new Animated.Value(0)).current;
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: variant === 'fullscreen' ? 250 : 220,
      useNativeDriver: true,
    }).start();
  }, [visible, variant, anim]);

  // The hardware back button closes the sheet (RN Modal used to handle this).
  useEffect(() => {
    if (!visible) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (variant === 'fullscreen') {
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [height, 0],
    });
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.fullscreen,
          {transform: [{translateY}]},
        ]}
        pointerEvents={visible ? 'auto' : 'none'}>
        {children}
      </Animated.View>
    );
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 320, 0],
  });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={visible ? 'auto' : 'none'}>
      <AnimatedPressable
        accessibilityLabel={scrimAccessibilityLabel}
        style={[styles.scrim, {opacity: anim}]}
        onPress={dismissOnScrimPress ? onClose : undefined}
      />
      <Animated.View
        style={[styles.sheetWrap, {transform: [{translateY}]}]}
        pointerEvents="box-none">
        <View
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
          style={[styles.card, {paddingBottom: safeAreaInsets.bottom + 12}]}>
          <View style={styles.handle} />
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    backgroundColor: '#ffffff',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d0d0d0',
    marginBottom: 12,
  },
});
