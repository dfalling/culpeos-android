import {Layer} from '@maplibre/maplibre-react-native';
import type {Theme} from '../theme/colors';

// The id `<UserLocation>` gives the annotation's source. Passed to each layer
// so these draw at the user's position, exactly as the SDK's own puck does.
const SOURCE_ID = 'mlrn-user-location';

/**
 * The user's location, in our tokens.
 *
 * MapLibre's own puck hardcodes `#33B5E5` in the layer paint — there's no color
 * prop to reassign, so the only way to restyle it is to replace it, which is
 * what `<UserLocation>`'s `children` are for. Left alone it puts a saturated
 * blue dot on the map beside the rust pins, and nothing in our source would
 * have turned it up.
 *
 * Neutral rather than accent: the pins are the content, and accent is spent on
 * them. This is the same white-ring-around-a-solid-core construction as the
 * SDK's, so it still reads as "you are here" — the core just inverts with the
 * appearance instead of being blue in both.
 */
export function UserLocationPuck({
  theme,
  accuracy,
}: {
  theme: Theme;
  /** Accuracy radius in meters, or undefined to skip the accuracy circle. */
  accuracy?: number;
}) {
  return (
    <>
      {typeof accuracy === 'number' ? (
        <Layer
          id="user-location-accuracy"
          type="circle"
          source={SOURCE_ID}
          paint={{
            'circle-color': theme.accent,
            'circle-opacity': 0.15,
            'circle-pitch-alignment': 'map',
            // Matches the SDK's mapping of meters to screen radius: the circle
            // grows with zoom so it stays a true accuracy footprint rather than
            // a fixed-size decoration.
            'circle-radius': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              0,
              RING_RADIUS,
              22,
              RING_RADIUS + accuracy * 100,
            ],
          }}
        />
      ) : null}
      <Layer
        id="user-location-ring"
        type="circle"
        source={SOURCE_ID}
        paint={{
          'circle-radius': RING_RADIUS,
          'circle-color': theme.canvas,
          'circle-pitch-alignment': 'map',
        }}
      />
      <Layer
        id="user-location-core"
        type="circle"
        source={SOURCE_ID}
        paint={{
          'circle-radius': CORE_RADIUS,
          'circle-color': theme.ink,
          'circle-pitch-alignment': 'map',
        }}
      />
    </>
  );
}

const RING_RADIUS = 9;
const CORE_RADIUS = 6;
