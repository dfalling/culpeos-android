import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Images,
  Layer,
  LocationManager,
  Map as MapLibreMap,
  type MapRef,
  type PressEventWithFeatures,
  type SymbolLayerSpecification,
  UserLocation,
  useCurrentPosition,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {NativeSyntheticEvent} from 'react-native';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AccountMenu} from '../account/AccountMenu';
import {
  type ElementsQuery,
  type ElementsQueryVariables,
  LabelMatchMode,
  useElementsQuery,
} from '../graphql/__generated__/types';
import type {
  RootStackNavigation,
  RootStackParamList,
} from '../navigation/types';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {ElementPreviewCard} from './ElementPreviewCard';
import {FilterChips} from './FilterChips';
import {PIN_PADDING, PIN_SELECTED_SCALE} from './PinIcon';
import {pinSortKey, pressedPinId, SELECTED_PIN_SORT_KEY} from './pinHitTest';
import {zoomForPlaceTypes} from './placeZoom';
import {
  type SearchElement,
  SearchOverlay,
  type SearchPlace,
  type SearchTrip,
} from './SearchOverlay';
import {usePinImages} from './usePinImages';
import {type Viewport, viewportStore} from './viewportStore';

type ElementWithLocation = ElementsQuery['elements'][number];
type PinLayout = NonNullable<SymbolLayerSpecification['layout']>;

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
// Ids for the map style's pin source and layer.
const PIN_SOURCE_ID = 'element-pins';
const PIN_LAYER_ID = 'element-pins-symbols';
// The pin image is padded so its shadow has room to spill, leaving the
// teardrop's tip that far above the image's bottom edge. Anchoring the symbol
// at its bottom and then offsetting it down by the padding puts the tip back on
// the element's coordinate. Icon offsets are multiplied by the icon size, so
// this holds at both resting and selected scale.
const PIN_ICON_OFFSET: [number, number] = [0, PIN_PADDING];

export function MapScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, 'Map'>>();
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);
  // Gate the bounds fetch + viewport-save until we know the map is sitting on
  // a real location — either a restored viewport or a fly-to-user. Prevents
  // the initial zoom-1 world frame from triggering a fetch of every element.
  const hasSettledRef = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [savedViewport, setSavedViewport] = useState<
    Viewport | null | undefined
  >(undefined);
  // The element selected on the map (shows the bottom preview card). Kept in
  // map state while the full-detail screen is pushed on top, so a located
  // element falls back to its preview card when the detail screen pops; a
  // location-less one (no map presence) is never selected, so popping returns
  // straight to the plain map.
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  // Read by the pin press handler, which stays stable across renders so the
  // native source isn't handed a new callback every time the map re-renders.
  const selectedElementIdRef = useRef(selectedElementId);
  selectedElementIdRef.current = selectedElementId;
  // When set, the map is filtered to a single trip: only that trip's elements
  // are shown and the bounds-based query is paused.
  const [tripFilter, setTripFilter] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);
  // Labels the map is filtered by, combined with the trip filter (if any) and
  // matched with ALL semantics so each added label narrows the results further.
  const [labelFilters, setLabelFilters] = useState<string[]>([]);
  const safeAreaInsets = useSafeAreaInsets();

  // A label tapped in the element details navigates back here with the label in
  // route params; fold it into the active filters, then clear the param so it
  // isn't re-applied on subsequent renders or when the screen regains focus.
  const pendingLabel = route.params?.addLabelFilter;
  useEffect(() => {
    if (!pendingLabel) return;
    setSelectedElementId(null);
    setLabelFilters(prev =>
      prev.includes(pendingLabel) ? prev : [...prev, pendingLabel],
    );
    navigation.setParams({addLabelFilter: undefined});
  }, [pendingLabel, navigation]);

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

  // Label filters apply on top of either mode below, narrowing the server-side
  // result. When none are active the vars are omitted so the query is unchanged.
  const labelVars = useMemo(
    () =>
      labelFilters.length > 0
        ? {labels: labelFilters, labelsMatch: LabelMatchMode.All}
        : undefined,
    [labelFilters],
  );

  // One query, two modes: when a trip filter is active fetch that trip's
  // elements; otherwise fetch by viewport bounds. Reusing the single hook keeps
  // the element shape (and Apollo cache) identical across modes. Label filters
  // (if any) are layered onto whichever mode is active.
  const {data, loading: elementsLoading} = useElementsQuery(
    tripFilter
      ? {variables: {tripId: tripFilter.id, ...labelVars}}
      : {skip: !bounds, variables: bounds ? {bounds, ...labelVars} : undefined},
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

  // An element deleted from the edit screen navigates back here with its id in
  // route params; drop it from the accumulated set (which otherwise only grows)
  // so its pin disappears, then clear the param so it isn't re-applied.
  const removedElementId = route.params?.removedElementId;
  useEffect(() => {
    if (!removedElementId) return;
    setSelectedElementId(prev => (prev === removedElementId ? null : prev));
    setElementsById(prev => {
      if (!prev.has(removedElementId)) return prev;
      const next = new Map(prev);
      next.delete(removedElementId);
      return next;
    });
    navigation.setParams({removedElementId: undefined});
  }, [removedElementId, navigation]);

  // Every located element we've accumulated. There's no viewport cull: pins are
  // symbols in the map style now, so MapLibre culls them per tile on the render
  // thread and offscreen ones cost nothing — culling here only made pins pop in
  // at the screen edges.
  const locatedElements = useMemo(
    () =>
      Array.from(elementsById.values()).filter(el => {
        if (!el.location) return false;
        // Apply the label filter client-side too (matching the query's ALL
        // semantics) so pins accumulated before the filter was set — or that no
        // longer match it — stop rendering without waiting for a refetch.
        return labelFilters.every(label => el.labels.includes(label));
      }),
    [elementsById, labelFilters],
  );

  // Elements with a location for the active trip; drives both the pins and the
  // camera fit while filtering.
  const tripElements = useMemo(
    () =>
      tripFilter
        ? (data?.elements ?? []).filter(el => el.location != null)
        : [],
    [tripFilter, data?.elements],
  );

  // While filtering by trip, show only that trip's elements so trip-only
  // results don't mix with the accumulated viewport set.
  const displayedElements = tripFilter ? tripElements : locatedElements;

  // A symbol can only draw an image the style knows about, so each distinct
  // element icon gets rasterised into one.
  const pinIcons = useMemo(
    () => Array.from(new Set(displayedElements.map(el => el.icon))),
    [displayedElements],
  );
  const {
    images: pinImages,
    rasterizer: pinRasterizer,
    imageNameFor,
  } = usePinImages(theme, pinIcons);

  const pinFeatures = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: 'FeatureCollection',
      features: displayedElements.flatMap(el =>
        el.location
          ? [
              {
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: [el.location.longitude, el.location.latitude],
                },
                properties: {
                  elementId: el.id,
                  // Resolving the image name here means the data is rebuilt as
                  // pins finish rasterising — a handful of times on startup,
                  // then not again.
                  image: imageNameFor(el.icon),
                  sortKey: pinSortKey(el.location.latitude),
                },
              },
            ]
          : [],
      ),
    }),
    [displayedElements, imageNameFor],
  );

  // Selection is expressed as style expressions over the feature's id rather
  // than baked into the source data, so selecting a pin re-sends the layout
  // instead of every feature.
  const pinLayout = useMemo<PinLayout>(
    () => ({
      'icon-image': ['get', 'image'],
      // The teardrop's tip marks the spot, so hang the pin above the coordinate
      // rather than centring it on top of it.
      'icon-anchor': 'bottom',
      'icon-offset': PIN_ICON_OFFSET,
      'icon-size': selectedElementId
        ? [
            'case',
            ['==', ['get', 'elementId'], selectedElementId],
            PIN_SELECTED_SCALE,
            1,
          ]
        : 1,
      // Every element gets a pin, so keep MapLibre's label-collision logic from
      // hiding any of them.
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      // Symbols with a lower sort key are drawn first, so this is what stacks
      // the pins: by latitude, plus the selected one on top of the lot. Which
      // pin is in front has to be decided rather than left to the order the
      // features happen to arrive in, so that a tap landing on two pins at once
      // can go to the one you can actually see — see `pinHitTest`.
      'symbol-sort-key': selectedElementId
        ? [
            'case',
            ['==', ['get', 'elementId'], selectedElementId],
            SELECTED_PIN_SORT_KEY,
            ['get', 'sortKey'],
          ]
        : ['get', 'sortKey'],
    }),
    [selectedElementId],
  );

  const handlePinPress = useCallback(
    async (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      // The source's press event bubbles up to the Map's onPress, which would
      // immediately clear the selection we're about to set. Stopped — and the
      // event read — before the first await, while the event is still ours.
      event.stopPropagation();
      const {features, point} = event.nativeEvent;
      const map = mapRef.current;
      if (!map) return;
      // MapLibre hands over every pin near the touch, not the one under it, so
      // the choice between them is ours to make.
      const elementId = await pressedPinId(
        {features, point},
        {
          selectedId: selectedElementIdRef.current,
          project: lngLat => map.project(lngLat),
        },
      ).catch((error: unknown) => {
        console.warn('Failed to place map pins for a tap:', error);
        // Better the pin MapLibre listed first than a tap that does nothing.
        const first = features[0]?.properties?.elementId;
        return typeof first === 'string' ? first : null;
      });
      if (elementId) setSelectedElementId(elementId);
    },
    [],
  );

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

  const handleSelectElement = useCallback(
    (element: SearchElement) => {
      setTripFilter(null);
      setLabelFilters([]);
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
        // No coordinates to fly to — a preview card pinned over an unrelated
        // map view would be misleading, so go straight to the full details.
        setSelectedElementId(null);
        navigation.navigate('ElementDetail', {elementId: element.id});
      }
    },
    [navigation],
  );

  const handleSelectTrip = useCallback((trip: SearchTrip) => {
    setSelectedElementId(null);
    setTripFilter({id: trip.id, name: trip.name, icon: trip.icon});
  }, []);

  const handleSelectPlace = useCallback((place: SearchPlace) => {
    setTripFilter(null);
    setLabelFilters([]);
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
        ref={mapRef}
        mapStyle={theme.mapStyleUrl}
        style={styles.map}
        onPress={() => setSelectedElementId(null)}
        onRegionDidChange={onRegionDidChange}>
        <Camera ref={cameraRef} initialViewState={initialViewState} />
        <UserLocation animated accuracy />
        <Images images={pinImages} />
        <GeoJSONSource
          id={PIN_SOURCE_ID}
          data={pinFeatures}
          onPress={handlePinPress}>
          <Layer id={PIN_LAYER_ID} type="symbol" layout={pinLayout} />
        </GeoJSONSource>
      </MapLibreMap>
      {pinRasterizer}
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
          onExpand={() =>
            navigation.navigate('ElementDetail', {elementId: selectedElementId})
          }
        />
      ) : null}
      <FilterChips
        trip={tripFilter}
        labels={labelFilters}
        topOffset={safeAreaInsets.top + 12 + 52}
        onClearTrip={() => setTripFilter(null)}
        onClearLabel={label =>
          setLabelFilters(prev => prev.filter(l => l !== label))
        }
      />
      <SearchOverlay
        topOffset={safeAreaInsets.top + 12}
        onSelectElement={handleSelectElement}
        onSelectTrip={handleSelectTrip}
        onSelectPlace={handleSelectPlace}
      />
      <AccountMenu />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    map: {
      flex: 1,
    },
    recenterButton: {
      position: 'absolute',
      right: 16,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.mapButtonBg,
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
      color: theme.mapButtonIcon,
    },
  });
