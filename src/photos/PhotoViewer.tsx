import {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  type GestureResponderEvent,
  Image,
  PanResponder,
  type PanResponderGestureState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {photoImageSource} from './photoImageSource';
import {
  clampScale,
  clampTranslate,
  DOUBLE_TAP_SCALE,
  DRAG_SLOP,
  dismissOpacity,
  fitContain,
  IDENTITY,
  MIN_SCALE,
  type Size,
  shouldDismiss,
  type Transform,
  touchDistance,
  touchMidpoint,
  zoomAroundFocus,
} from './photoZoom';

type Props = {
  /** URL of the image to show; the same one used for the thumbnail is fine. */
  uri: string;
  /** The photo's alt text, used as the image's accessibility label. */
  description?: string;
  onClose: () => void;
};

const ZERO_SIZE: Size = {width: 0, height: 0};

/** Max gap between two taps that still counts as a double tap (ms). */
const DOUBLE_TAP_WINDOW = 280;

const SPRING = {
  useNativeDriver: true,
  friction: 8,
  tension: 90,
} as const;

/** What the current one-or-two-finger gesture has been resolved to. */
type Mode = 'idle' | 'pinch' | 'pan' | 'dismiss';

type GestureState = {
  mode: Mode;
  /** Transform the gesture (or its current leg) started from. */
  from: Transform;
  /** Accumulated pan at the start of the current leg, to make it relative. */
  origin: {dx: number; dy: number};
  /** Finger separation when the pinch began. */
  pinchDistance: number;
  /** Pinch focal point, in container coordinates. */
  focus: {x: number; y: number};
  lastTapAt: number;
};

/**
 * Full-screen photo viewer: pinch to zoom, drag to pan while zoomed, double tap
 * to toggle zoom, and swipe the photo away (any direction) or tap × to close.
 *
 * Rendered as an absolute overlay rather than a React Native `Modal`, for the
 * same reason as {@link Sheet}: `Modal` gets its own window, which does not
 * reliably draw under the system bars on Android 15, so a "full-screen" viewer
 * would stop short of them.
 *
 * Gestures are hand-rolled on `PanResponder` + `Animated` because the app has
 * no gesture-handler/reanimated dependency, and one screen's pinch-zoom doesn't
 * justify pulling in two native modules. The transform math lives in
 * {@link photoZoom}; this component only translates touches into calls on it.
 */
export function PhotoViewer({uri, description, onClose}: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  const [containerSize, setContainerSize] = useState<Size>(ZERO_SIZE);
  const [naturalSize, setNaturalSize] = useState<Size>(ZERO_SIZE);
  const [loaded, setLoaded] = useState(false);

  // The photo's laid-out size before any zoom. Until the image reports its
  // dimensions, fall back to the container so gestures have sane bounds.
  const fitted = useMemo(() => {
    const contained = fitContain(naturalSize, containerSize);
    return contained.width > 0 ? contained : containerSize;
  }, [naturalSize, containerSize]);

  const scale = useRef(new Animated.Value(IDENTITY.scale)).current;
  const translateX = useRef(new Animated.Value(IDENTITY.x)).current;
  const translateY = useRef(new Animated.Value(IDENTITY.y)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Animated.Value has no public getter, so the committed transform is
  // mirrored in a ref for the gesture handlers to read.
  const transform = useRef<Transform>(IDENTITY);
  const container = useRef<Size>(containerSize);
  const frame = useRef<Size>(fitted);
  const onCloseRef = useRef(onClose);
  const closing = useRef(false);

  useEffect(() => {
    container.current = containerSize;
    frame.current = fitted;
  }, [containerSize, fitted]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Fade in on mount; the dismiss animation fades back out.
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  // The hardware back button closes the viewer, not the detail screen.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onCloseRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  const gesture = useRef<GestureState>({
    mode: 'idle',
    from: IDENTITY,
    origin: {dx: 0, dy: 0},
    pinchDistance: 0,
    focus: {x: 0, y: 0},
    lastTapAt: 0,
  });

  // Built once: every handler reads mutable refs and Animated values, both of
  // which are stable, so the responder never needs to be rebuilt.
  const responder = useMemo(() => {
    const apply = (next: Transform) => {
      transform.current = next;
      scale.setValue(next.scale);
      translateX.setValue(next.x);
      translateY.setValue(next.y);
    };

    const settle = (next: Transform) => {
      transform.current = next;
      Animated.parallel([
        Animated.spring(scale, {...SPRING, toValue: next.scale}),
        Animated.spring(translateX, {...SPRING, toValue: next.x}),
        Animated.spring(translateY, {...SPRING, toValue: next.y}),
        Animated.spring(opacity, {...SPRING, toValue: 1}),
      ]).start();
    };

    const dismiss = (state: PanResponderGestureState) => {
      closing.current = true;
      // Keep flinging in the drag's direction while fading out, so the photo
      // leaves along the path the finger was taking.
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: transform.current.x + state.vx * 120,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: transform.current.y + state.vy * 120,
          duration: 170,
          useNativeDriver: true,
        }),
      ]).start(() => onCloseRef.current());
    };

    const handleTap = (event: GestureResponderEvent) => {
      const now = Date.now();
      if (now - gesture.current.lastTapAt > DOUBLE_TAP_WINDOW) {
        gesture.current.lastTapAt = now;
        return;
      }
      gesture.current.lastTapAt = 0;
      const {pageX, pageY} = event.nativeEvent;
      const target =
        transform.current.scale > MIN_SCALE
          ? IDENTITY
          : zoomAroundFocus(
              transform.current,
              DOUBLE_TAP_SCALE,
              {x: pageX, y: pageY},
              container.current,
            );
      settle(clampTranslate(target, frame.current, container.current));
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Nothing above this overlay should be able to take over mid-gesture.
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: () => {
        // A settle spring still in flight would keep overwriting the values
        // this gesture is about to set, so stop it. Grabbing the photo
        // mid-spring therefore starts from where the spring was headed.
        scale.stopAnimation();
        translateX.stopAnimation();
        translateY.stopAnimation();
        opacity.stopAnimation();
        opacity.setValue(1);
        gesture.current.mode = 'idle';
        gesture.current.from = transform.current;
        gesture.current.origin = {dx: 0, dy: 0};
      },

      onPanResponderMove: (event, state) => {
        if (closing.current) return;
        const touches = event.nativeEvent.touches;
        const current = gesture.current;

        if (touches.length >= 2) {
          const distance = touchDistance(touches[0], touches[1]);
          if (current.mode !== 'pinch') {
            // Anchor the pinch: the focal point stays fixed for the whole
            // pinch, so zooming doesn't drift as the fingers rotate or slide.
            current.mode = 'pinch';
            current.from = transform.current;
            current.pinchDistance = distance;
            current.focus = touchMidpoint(touches[0], touches[1]);
          }
          if (current.pinchDistance > 0) {
            apply(
              zoomAroundFocus(
                current.from,
                current.from.scale * (distance / current.pinchDistance),
                current.focus,
                container.current,
              ),
            );
          }
          return;
        }

        if (current.mode === 'pinch') {
          // A finger lifted mid-pinch. Re-anchor to the transform reached so
          // far and let the remaining finger pan from there, rather than
          // snapping back to where the whole gesture began.
          current.mode = 'pan';
          current.from = transform.current;
          current.origin = {dx: state.dx, dy: state.dy};
        }

        const dx = state.dx - current.origin.dx;
        const dy = state.dy - current.origin.dy;

        if (current.mode === 'idle') {
          if (Math.hypot(dx, dy) < DRAG_SLOP) return;
          // Zoomed in, a drag pans the photo; at 1x there's nowhere to pan, so
          // it swipes the viewer away instead.
          current.mode =
            transform.current.scale > MIN_SCALE ? 'pan' : 'dismiss';
          current.from = transform.current;
        }

        const dragged: Transform = {
          scale: current.from.scale,
          x: current.from.x + dx,
          y: current.from.y + dy,
        };

        if (current.mode === 'pan') {
          apply(clampTranslate(dragged, frame.current, container.current));
        } else {
          // Unclamped: the photo tracks the finger off-screen.
          apply(dragged);
          opacity.setValue(dismissOpacity(dx, dy));
        }
      },

      onPanResponderRelease: (event, state) => {
        if (closing.current) return;
        const current = gesture.current;
        if (current.mode === 'dismiss' && shouldDismiss(state)) {
          dismiss(state);
          return;
        }
        if (current.mode === 'idle') {
          handleTap(event);
          return;
        }
        current.mode = 'idle';
        settle(
          clampTranslate(
            {...transform.current, scale: clampScale(transform.current.scale)},
            frame.current,
            container.current,
          ),
        );
      },

      onPanResponderTerminate: () => {
        if (closing.current) return;
        gesture.current.mode = 'idle';
        settle(
          clampTranslate(
            {...transform.current, scale: clampScale(transform.current.scale)},
            frame.current,
            container.current,
          ),
        );
      },
    });
  }, [opacity, scale, translateX, translateY]);

  return (
    <Animated.View
      style={[styles.overlay, {opacity}]}
      onLayout={event => {
        const {width, height} = event.nativeEvent.layout;
        setContainerSize({width, height});
      }}>
      {/*
        The overlay fills the screen, so a touch's page coordinates are also its
        coordinates within this container — what the pinch focal math wants.
      */}
      <View style={styles.gestureArea} {...responder.panHandlers}>
        <Animated.View
          style={{
            width: fitted.width,
            height: fitted.height,
            transform: [{translateX}, {translateY}, {scale}],
          }}>
          <Image
            accessibilityLabel={description || 'Photo'}
            accessibilityRole="image"
            source={photoImageSource(uri)}
            resizeMode="contain"
            style={styles.image}
            onLoad={event => {
              const source = event.nativeEvent.source;
              if (source?.width && source?.height) {
                setNaturalSize({width: source.width, height: source.height});
              }
              setLoaded(true);
            }}
            onError={() => setLoaded(true)}
          />
        </Animated.View>
      </View>

      {loaded ? null : (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator color="#ffffff" />
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close photo"
        hitSlop={12}
        onPress={onClose}
        style={({pressed}) => [
          styles.closeButton,
          {top: safeAreaInsets.top + 8},
          pressed && styles.closeButtonPressed,
        ]}>
        <Text style={styles.closeIcon}>×</Text>
      </Pressable>
    </Animated.View>
  );
}

// Not themed: a photo viewer is black in both appearances, so the image sets
// the mood and its edges are unambiguous. The chrome is therefore fixed to
// translucent white rather than reading from the theme.
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  // The photo is centered in the gesture area, which is what makes a zero
  // translation mean "centered" for the transform math in photoZoom.
  gestureArea: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  spinner: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  closeIcon: {
    fontSize: 22,
    lineHeight: 24,
    color: '#ffffff',
  },
});
