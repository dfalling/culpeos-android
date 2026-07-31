import type {ImageEntry} from '@maplibre/maplibre-react-native';
import {type ReactElement, useCallback, useMemo, useRef, useState} from 'react';
import {PixelRatio, StyleSheet, View} from 'react-native';
import {captureRef} from 'react-native-view-shot';
import type {Theme} from '../theme/colors';
import {PIN_SELECTED_SCALE, PinIcon} from './PinIcon';

// Symbol layers scale a pin up when it's selected, which resamples its image;
// capturing at the selected size means that only ever downsamples.
const RASTER_SCALE = PIN_SELECTED_SCALE;

/**
 * Rasterises map pins into images a symbol layer can draw.
 *
 * Symbol layers render inside the map's own GL frame — unlike `<Marker>`, whose
 * Android views are repositioned once per frame from outside that frame and so
 * trail behind the map as it pans. The catch is that a symbol can only draw a
 * registered image, and our pins carry a per-element emoji, so each distinct
 * icon has to become an image first. This captures `<PinIcon>` off-screen, once
 * per icon, and registers the result under a name `imageNameFor` hands back.
 *
 * `icons` may grow as elements load; each new value is captured once and kept
 * for the life of the screen.
 */
export function usePinImages(
  theme: Theme,
  icons: readonly (string | null | undefined)[],
): {
  /** Images to pass to `<Images>`. */
  images: Record<string, ImageEntry>;
  /**
   * The off-screen capture host. Must be rendered *outside* the map, since
   * every child of the map is treated as a map feature.
   */
  rasterizer: ReactElement;
  /**
   * The map image name to draw for an element's icon. Falls back to the plain
   * teardrop while that icon's own image is still being rasterised —
   * referencing an image the style doesn't have yet would draw nothing at all.
   */
  imageNameFor: (icon: string | null | undefined) => string;
} {
  const [images, setImages] = useState<Record<string, ImageEntry>>({});
  // Names already captured, in flight, or failed. Kept in a ref rather than
  // derived from `images` so a capture in flight isn't started twice and a
  // failed one isn't retried forever.
  const attempted = useRef(new Set<string>());
  const hosts = useRef(new Map<string, View | null>());

  // A rasterised pin bakes in the colours it was drawn with, so those are part
  // of its name: should the palette ever stop being shared between light and
  // dark, the new pins get new names and are captured afresh rather than
  // quietly keeping the old bitmaps.
  const variant = `${theme.pin}|${theme.pinBorder}`;
  const nameFor = useCallback(
    (icon: string | null | undefined) => `pin:${variant}:${icon ?? ''}`,
    [variant],
  );
  const plainPinName = nameFor(null);

  const imageNameFor = useCallback(
    (icon: string | null | undefined) => {
      const name = nameFor(icon);
      return name in images ? name : plainPinName;
    },
    [nameFor, plainPinName, images],
  );

  // Icons with no image yet, de-duplicated by name. The plain pin is always
  // wanted: it stands in for icons still being captured, so it needs to be
  // ready before any element arrives.
  const pending = useMemo(() => {
    const byName = new Map<string, string | null>([[plainPinName, null]]);
    for (const icon of icons) byName.set(nameFor(icon), icon ?? null);
    return Array.from(byName, ([name, icon]) => ({name, icon})).filter(
      ({name}) => !(name in images),
    );
  }, [icons, images, nameFor, plainPinName]);

  const capture = useCallback((name: string) => {
    if (attempted.current.has(name)) return;
    const host = hosts.current.get(name);
    if (!host) return;
    attempted.current.add(name);

    // Let the laid-out views actually draw before asking for their pixels:
    // capture reads them via `view.draw()`, which needs the emoji's text run
    // resolved and the shadow's drawable in place.
    requestAnimationFrame(() => {
      captureRef(host, {format: 'png', result: 'data-uri'})
        .then(uri => {
          hosts.current.delete(name);
          setImages(prev => ({
            ...prev,
            // Declaring the scale the pin was captured at is what makes the
            // image's natural size on the map its unscaled point size.
            [name]: {source: {uri, scale: PixelRatio.get() * RASTER_SCALE}},
          }));
        })
        .catch((error: unknown) => {
          hosts.current.delete(name);
          // The name stays in `attempted` so we don't retry in a loop; the
          // element keeps the plain pin, which is a legible fallback.
          console.warn(`Failed to rasterize map pin ${name}:`, error);
        });
    });
  }, []);

  const rasterizer = (
    <View pointerEvents="none" style={styles.offscreen}>
      {pending.map(({name, icon}) => (
        <View
          key={name}
          collapsable={false}
          onLayout={() => capture(name)}
          ref={host => {
            hosts.current.set(name, host);
          }}>
          <PinIcon theme={theme} icon={icon} scale={RASTER_SCALE} />
        </View>
      ))}
    </View>
  );

  return {images, rasterizer, imageNameFor};
}

const styles = StyleSheet.create({
  // Parked off-screen: capture draws the view into its own bitmap rather than
  // reading the screen, so it only has to be laid out, not visible.
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
});
