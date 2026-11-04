import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

/** Just enough of a new element for the map to seed its pin and fly to it. */
export type CreatedElement = {
  id: string;
  name: string;
  icon: string;
  labels: string[];
  location: {id: string; latitude: number; longitude: number};
};

export type CreatedTrip = {id: string; name: string; icon: string};

/**
 * Routes for the authenticated app. The map is the root; detail surfaces are
 * pushed on top so they cover the map chrome (account menu, search) instead of
 * fighting it for z-order as the old in-tree modal did.
 */
export type RootStackParamList = {
  // `addLabelFilter` is set when returning to the map from a detail surface to
  // add a tapped label to the active filters; the map consumes and clears it.
  // `removedElementId` is set when returning after a delete so the map can drop
  // the now-gone pin from its accumulated set; the map consumes and clears it.
  // `createdElement` is set when returning after creating a located element so
  // the map can fly to it and select it; `createdTrip` after creating a trip so
  // the map can filter to it. The map consumes and clears both.
  Map:
    | {
        addLabelFilter?: string;
        removedElementId?: string;
        createdElement?: CreatedElement;
        createdTrip?: CreatedTrip;
      }
    | undefined;
  ElementDetail: {elementId: string};
  ElementEdit: {elementId: string};
  // The element form with nothing loaded. `tripIds` pre-selects trips, e.g. the
  // ones the map is currently filtered to.
  ElementCreate: {tripIds?: string[]} | undefined;
  TripCreate: undefined;
  // Transient loading screen shown while raw shared content (from another app's
  // share sheet) is sent to importShare; replaced by ElementDetail on success.
  ImportShare: {content: string};
};

export type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;
