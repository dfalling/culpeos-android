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
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {NativeSyntheticEvent} from 'react-native';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  type ElementsQuery,
  type ElementsQueryVariables,
  useElementsQuery,
} from '../graphql/__generated__/types';
import {ElementDetailModal} from './ElementDetailModal';
import {ElementPreviewCard} from './ElementPreviewCard';
import {zoomForPlaceTypes} from './placeZoom';
import {
  type SearchElement,
  SearchOverlay,
  type SearchPlace,
  type SearchTrip,
} from './SearchOverlay';
import {TripFilterChip} from './TripFilterChip';
import {type Viewport, viewportStore} from './viewportStore';

type ElementWithLocation = ElementsQuery['elements'][number];

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const USER_ZOOM = 14;
// Zoom used when flying to a searched element, and for single-element trips
// where there is no extent to fit.
const ELEMENT_ZOOM = 15;
const TRIP_SINGLE_ZOOM = 13;
// Inset (points) kept around a trip's elements when fitting the camera so pins
// aren't flush against the screen edges or hidden under the overlays.
const FIT_PADDING = {top: 120, right: 60, bottom: 120, left: 60};
const DEFAULT_INITIAL_VIEW = {center: [0, 20] as [number, number], zoom: 1};
// Show the recenter button once the viewport center drifts more than this
// fraction of the visible span away from the user in either axis.
const OFF_CENTER_THRESHOLD = 0.2;
// Margin above the device safe area for bottom-anchored overlays (recenter
// button, preview card).
const BOTTOM_MARGIN = 16;

export function MapScreen() {
  const cameraRef = useRef<CameraRef>(null);
  // Gate the bounds fetch + viewport-save until we know the map is sitting on
  // a real location — either a restored viewport or a fly-to-user. Prevents
  // the initial zoom-1 world frame from triggering a fetch of every element.
  const hasSettledRef = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [savedViewport, setSavedViewport] = useState<
    Viewport | null | undefined
  >(undefined);
  // The element selected on the map (shows the bottom preview card). Separate
  // from the element whose full-detail modal is open, so a located element can
  // fall back to its preview card after the modal closes while a location-less
  // one (which has no map presence) returns straight to the plain map.
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [detailElementId, setDetailElementId] = useState<string | null>(null);
  // When set, the map is filtered to a single trip: only that trip's elements
  // are shown and the bounds-based query is paused.
  const [tripFilter, setTripFilter] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);
  const safeAreaInsets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    viewportStore.load().then(v => {
      if (cancelled) return;
      // Open the gate synchronously so the first region-did-change after the
      // map mounts at the restored viewport is allowed through.
      if (v) hasSettledRef.current = true;
      setSavedViewport(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const positionRef = useRef(position);
  positionRef.current = position;

  const flyToUser = useCallback(() => {
    const pos = positionRef.current;
    if (!pos) return;
    cameraRef.current?.flyTo({
      center: [pos.coords.longitude, pos.coords.latitude],
      zoom: USER_ZOOM,
      duration: 1500,
    });
  }, []);

  // First-launch fallback: with nothing to restore, fly to the user when their
  // position becomes available. Once a saved viewport exists this branch is
  // never taken — the recenter button is how the user goes to themselves.
  useEffect(() => {
    if (
      hasSettledRef.current ||
      !position ||
      savedViewport === undefined ||
      savedViewport !== null
    ) {
      return;
    }
    hasSettledRef.current = true;
    flyToUser();
  }, [position, savedViewport, flyToUser]);

  const [bounds, setBounds] = useState<ElementsQueryVariables['bounds']>();
  const [viewportState, setViewportState] = useState<{
    centerLng: number;
    centerLat: number;
    spanLng: number;
    spanLat: number;
  } | null>(null);

  const onRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (!hasSettledRef.current) return;
      const [west, south, east, north] = event.nativeEvent.bounds;
      const [centerLng, centerLat] = event.nativeEvent.center;
      setBounds({left: west, bottom: south, right: east, top: north});
      setViewportState({
        centerLng,
        centerLat,
        spanLng: east - west,
        spanLat: north - south,
      });
      viewportStore.save({
        center: [centerLng, centerLat],
        zoom: event.nativeEvent.zoom,
      });
    },
    [],
  );

  // Derived: is the user's location near the viewport center? When unknown
  // (no position yet, or map hasn't reported a region), treat as centered so
  // the recenter button stays hidden until we have real data to compare.
  const isCenteredOnUser = useMemo(() => {
    if (!position || !viewportState) return true;
    const offLng =
      Math.abs(viewportState.centerLng - position.coords.longitude) /
      viewportState.spanLng;
    const offLat =
      Math.abs(viewportState.centerLat - position.coords.latitude) /
      viewportState.spanLat;
    return offLng <= OFF_CENTER_THRESHOLD && offLat <= OFF_CENTER_THRESHOLD;
  }, [position, viewportState]);

  // One query, two modes: when a trip filter is active fetch that trip's
  // elements; otherwise fetch by viewport bounds. Reusing the single hook keeps
  // the element shape (and Apollo cache) identical across modes.
  const {data, loading: elementsLoading} = useElementsQuery(
    tripFilter
      ? {variables: {tripId: tripFilter.id}}
      : {skip: !bounds, variables: bounds ? {bounds} : undefined},
  );

  // Accumulate elements across viewport fetches so pins persist while a new
  // search is in flight. Fine for our small per-user dataset; revisit if we
  // ever need eviction or to reflect server-side deletes. Skip while filtering
  // by trip so trip-only results don't leak into the normal viewport view.
  const [elementsById, setElementsById] = useState<
    ReadonlyMap<string, ElementWithLocation>
  >(new Map());
  useEffect(() => {
    if (tripFilter || !data?.elements) return;
    setElementsById(prev => {
      const next = new Map(prev);
      for (const el of data.elements) next.set(el.id, el);
      return next;
    });
  }, [data?.elements, tripFilter]);

  // Only render markers whose location falls inside the last-known viewport.
  // <Marker> is a native View — rendering offscreen ones still costs layout
  // and reprojection on every camera frame, so we cull client-side.
  const visibleElements = useMemo(() => {
    if (!bounds) return [];
    const {left, right, bottom, top} = bounds;
    return Array.from(elementsById.values()).filter(el => {
      if (!el.location) return false;
      const {longitude: lng, latitude: lat} = el.location;
      return lng >= left && lng <= right && lat >= bottom && lat <= top;
    });
  }, [elementsById, bounds]);

  // Elements with a location for the active trip; drives both the markers and
  // the camera fit while filtering.
  const tripElements = useMemo(
    () =>
      tripFilter
        ? (data?.elements ?? []).filter(el => el.location != null)
        : [],
    [tripFilter, data?.elements],
  );

  // In trip mode render the whole trip (no viewport cull) so panning around it
  // doesn't drop pins; otherwise use the bounds-culled accumulated set.
  const displayedElements = tripFilter ? tripElements : visibleElements;

  // Fit the camera to the trip's extent once its elements arrive. Guarded by a
  // ref so panning/zooming afterwards doesn't snap back, and reset when the
  // filter clears so re-selecting the same trip fits again.
  const fittedTripRef = useRef<string | null>(null);
  useEffect(() => {
    if (!tripFilter) {
      fittedTripRef.current = null;
      return;
    }
    if (fittedTripRef.current === tripFilter.id || elementsLoading) return;
    if (tripElements.length === 0) return;
    fittedTripRef.current = tripFilter.id;

    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const el of tripElements) {
      if (!el.location) continue;
      const {longitude: lng, latitude: lat} = el.location;
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
    if (west === east && south === north) {
      cameraRef.current?.flyTo({
        center: [west, south],
        zoom: TRIP_SINGLE_ZOOM,
        duration: 1200,
      });
    } else {
      cameraRef.current?.fitBounds([west, south, east, north], {
        padding: FIT_PADDING,
        duration: 1200,
      });
    }
  }, [tripFilter, tripElements, elementsLoading]);

  const handleSelectElement = useCallback((element: SearchElement) => {
    setTripFilter(null);
    if (element.location) {
      const {longitude, latitude} = element.location;
      // Seed the marker set so the pin is present immediately, before the
      // bounds query around the new center returns.
      setElementsById(prev => {
        const next = new Map(prev);
        next.set(element.id, element);
        return next;
      });
      setSelectedElementId(element.id);
      cameraRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: ELEMENT_ZOOM,
        duration: 1200,
      });
    } else {
      // No coordinates to fly to — a preview card pinned over an unrelated map
      // view would be misleading, so go straight to the full details.
      setSelectedElementId(null);
      setDetailElementId(element.id);
    }
  }, []);

  const handleSelectTrip = useCallback((trip: SearchTrip) => {
    setSelectedElementId(null);
    setTripFilter({id: trip.id, name: trip.name, icon: trip.icon});
  }, []);

  const handleSelectPlace = useCallback((place: SearchPlace) => {
    setTripFilter(null);
    cameraRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      zoom: zoomForPlaceTypes(place.types),
      duration: 1200,
    });
  }, []);

  // Brief blank frame while the saved viewport hydrates from storage; the
  // camera's initialViewState is set once, so we wait for the resolved value
  // rather than rendering the map at the default world view first.
  if (savedViewport === undefined) {
    return <View style={styles.container} />;
  }

  const initialViewState = savedViewport
    ? {center: savedViewport.center, zoom: savedViewport.zoom}
    : DEFAULT_INITIAL_VIEW;

  return (
    <View style={styles.container}>
      <MapLibreMap
        mapStyle={MAP_STYLE}
        style={styles.map}
        onPress={() => setSelectedElementId(null)}
        onRegionDidChange={onRegionDidChange}>
        <Camera ref={cameraRef} initialViewState={initialViewState} />
        <UserLocation animated accuracy />
        {displayedElements.map(el =>
          el.location ? (
            <Marker
              key={el.id}
              id={el.id}
              lngLat={[el.location.longitude, el.location.latitude]}
              onPress={e => {
                // The marker's "onPress" event bubbles up to the Map's
                // onPress (both are codegen BubblingEventHandlers), which
                // would immediately clear the selection we just set.
                e.stopPropagation();
                setSelectedElementId(el.id);
              }}>
              <View
                style={[
                  styles.pin,
                  selectedElementId === el.id && styles.pinSelected,
                ]}>
                {el.icon ? <Text style={styles.pinIcon}>{el.icon}</Text> : null}
              </View>
            </Marker>
          ) : null,
        )}
      </MapLibreMap>
      {position && !isCenteredOnUser && !selectedElementId ? (
        <TouchableOpacity
          accessibilityLabel="Recenter map on your location"
          accessibilityRole="button"
          onPress={flyToUser}
          style={[
            styles.recenterButton,
            {bottom: safeAreaInsets.bottom + BOTTOM_MARGIN},
          ]}>
          <Text style={styles.recenterIcon}>◎</Text>
        </TouchableOpacity>
      ) : null}
      {selectedElementId ? (
        <ElementPreviewCard
          elementId={selectedElementId}
          bottomOffset={safeAreaInsets.bottom + BOTTOM_MARGIN}
          onClose={() => setSelectedElementId(null)}
          onExpand={() => setDetailElementId(selectedElementId)}
        />
      ) : null}
      {tripFilter ? (
        <TripFilterChip
          icon={tripFilter.icon}
          name={tripFilter.name}
          topOffset={safeAreaInsets.top + 12 + 52}
          onClear={() => setTripFilter(null)}
        />
      ) : null}
      <SearchOverlay
        topOffset={safeAreaInsets.top + 12}
        onSelectElement={handleSelectElement}
        onSelectTrip={handleSelectTrip}
        onSelectPlace={handleSelectPlace}
      />
      <ElementDetailModal
        elementId={detailElementId}
        onClose={() => setDetailElementId(null)}
      />
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
  pinSelected: {
    backgroundColor: '#0b4ea2',
    transform: [{scale: 1.15}],
  },
  pinIcon: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
  },
  recenterIcon: {
    fontSize: 24,
    lineHeight: 28,
    color: '#1d6fe0',
  },
});
