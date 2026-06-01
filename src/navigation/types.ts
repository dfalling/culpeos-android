import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

/**
 * Routes for the authenticated app. The map is the root; detail surfaces are
 * pushed on top so they cover the map chrome (account menu, search) instead of
 * fighting it for z-order as the old in-tree modal did.
 */
export type RootStackParamList = {
  Map: undefined;
  ElementDetail: {elementId: string};
  ElementEdit: {elementId: string};
};

export type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;
