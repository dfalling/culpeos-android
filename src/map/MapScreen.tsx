import {
  Camera,
  type CameraRef,
  LocationManager,
  Map as MapLibreMap,
  UserLocation,
  useCurrentPosition,
} from '@maplibre/maplibre-react-native';
import {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';

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

  return (
    <View style={styles.container}>
      <MapLibreMap mapStyle={MAP_STYLE} style={styles.map}>
        <Camera ref={cameraRef} initialViewState={{center: [0, 20], zoom: 1}} />
        <UserLocation animated accuracy />
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
});
