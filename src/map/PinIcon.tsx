import {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {Theme} from '../theme/colors';

// Map pin geometry, mirroring the web app's `.maplibre-marker-pin`: a square
// with three rounded corners, rotated -45° so the square corner points down.
// Web draws it at 30px; we size up for touch. Exported for `pinHitTest`, which
// measures taps against the shape these describe.
export const PIN_SIZE = 36;
// Selected pins only grow (and draw on top); the fill stays accent, as on web.
export const PIN_SELECTED_SCALE = 1.25;
// Border weight. Web went 1px → 2px because a hairline smears or vanishes on an
// e-ink refresh; the mobile equivalent is a hairline at low brightness or
// through a screen protector. Scaled with the pin so it holds at capture size.
const PIN_BORDER = 2;
// Rotating the square makes it occupy a box of side × √2, with the square
// corner — the teardrop's tip — landing at the bottom centre of that box.
export const PIN_DIAGONAL = PIN_SIZE * Math.SQRT2;
// The drop shadow is drawn outside the pin's own bounds, so the box carries
// padding on every side for it to spill into; without it the capture below
// would crop the shadow at the pin's edge. Covers the shadow's 2pt drop plus
// its 4pt blur, with a little slack.
export const PIN_PADDING = 8;
// Full box the pin is captured in. The tip therefore sits PIN_PADDING above the
// box's bottom edge, which is what the symbol layer's icon offset cancels out
// to put the tip back on the element's coordinate.
const PIN_BOX = PIN_DIAGONAL + PIN_PADDING * 2;

/**
 * A single map pin, drawn as plain views so it can be rasterised into a map
 * image. Nothing renders this on the map directly — see `usePinImages`.
 *
 * `scale` multiplies every dimension, letting the rasteriser capture the pin at
 * a higher resolution than it rests at so growing a selected pin stays sharp.
 */
export function PinIcon({
  theme,
  icon,
  scale,
}: {
  theme: Theme;
  icon: string | null | undefined;
  scale: number;
}) {
  const styles = useMemo(() => makeStyles(theme, scale), [theme, scale]);
  return (
    <View style={styles.box}>
      <View style={styles.pin}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme, scale: number) =>
  StyleSheet.create({
    box: {
      width: PIN_BOX * scale,
      height: PIN_BOX * scale,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pin: {
      width: PIN_SIZE * scale,
      height: PIN_SIZE * scale,
      // Three rounded corners and one square one: the teardrop's tip.
      borderTopLeftRadius: (PIN_SIZE / 2) * scale,
      borderTopRightRadius: (PIN_SIZE / 2) * scale,
      borderBottomRightRadius: (PIN_SIZE / 2) * scale,
      borderBottomLeftRadius: 0,
      // A saved location is a solid accent fill with an ink border — one of the
      // four sanctioned uses of accent, and the heaviest mark on the map. The
      // weight, not the hue, is what separates it from everything else: a
      // distinction by hue alone disappears under a color vision deficiency or
      // on a grayscale screen.
      backgroundColor: theme.accent,
      borderWidth: PIN_BORDER * scale,
      borderColor: theme.ink,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 2 * scale,
          blurRadius: 4 * scale,
          color: 'rgba(0,0,0,0.4)',
        },
      ],
      transform: [{rotate: '-45deg'}],
    },
    icon: {
      fontSize: 16 * scale,
      lineHeight: 20 * scale,
      textAlign: 'center',
      // Counter-rotate so the emoji stays upright inside the rotated pin.
      transform: [{rotate: '45deg'}],
    },
  });
