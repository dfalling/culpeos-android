import {
  Camera,
  type CameraRef,
  LocationManager,
  Map as MapLibreMap,
  Marker,
  UserLocation,
  useCurrentPosition,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {NativeSyntheticEvent} from 'react-native';
import {StyleSheet, Text, View} from 'react-native';
import {
  type ElementsQueryVariables,
  useElementsQuery,
} from '../graphql/__generated__/types';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const USER_ZOOM = 14;

export function MapScreen() {
  const cameraRef = useRef<CameraRef>(null);
  const hasCenteredRef = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await LocationManager.requestPermissions();
      if (!cancelled && granted) {
        setPermissionGranted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const position = useCurrentPosition({enabled: permissionGranted});

  useEffect(() => {
    if (hasCenteredRef.current || !position) return;
    hasCenteredRef.current = true;
    cameraRef.current?.flyTo({
      center: [position.coords.longitude, position.coords.latitude],
      zoom: USER_ZOOM,
      duration: 1500,
    });
  }, [position]);

  const [bounds, setBounds] = useState<ElementsQueryVariables['bounds']>();

  const onRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      // Skip viewport events until we've flown to the user's location, so
      // we don't fetch the entire world at the initial zoom-1 framing.
      if (!hasCenteredRef.current) return;
      const [west, south, east, north] = event.nativeEvent.bounds;
      setBounds({left: west, bottom: south, right: east, top: north});
    },
    [],
  );

  const {data} = useElementsQuery({
    skip: !bounds,
    variables: bounds ? {bounds} : undefined,
  });

  return (
    <View style={styles.container}>
      <MapLibreMap
        mapStyle={MAP_STYLE}
        style={styles.map}
        onRegionDidChange={onRegionDidChange}>
        <Camera ref={cameraRef} initialViewState={{center: [0, 20], zoom: 1}} />
        <UserLocation animated accuracy />
        {data?.elements.map(el =>
          el.location ? (
            <Marker
              key={el.id}
              id={el.id}
              lngLat={[el.location.longitude, el.location.latitude]}>
              <View style={styles.pin}>
                {el.icon ? <Text style={styles.pinIcon}>{el.icon}</Text> : null}
              </View>
            </Marker>
          ) : null,
        )}
      </MapLibreMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1d6fe0',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
  },
});
