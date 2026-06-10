import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

/**
 * Routes for the authenticated app. The map is the root; detail surfaces are
 * pushed on top so they cover the map chrome (account menu, search) instead of
 * fighting it for z-order as the old in-tree modal did.
 */
export type RootStackParamList = {
  // `addLabelFilter` is set when returning to the map from a detail surface to
  // add a tapped label to the active filters; the map consumes and clears it.
  Map: {addLabelFilter?: string} | undefined;
  ElementDetail: {elementId: string};
  ElementEdit: {elementId: string};
  // Transient loading screen shown while raw shared content (from another app's
  // share sheet) is sent to importShare; replaced by ElementDetail on success.
  ImportShare: {content: string};
};

export type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;
