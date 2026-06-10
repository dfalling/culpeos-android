import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ElementDetailScreen} from '../map/ElementDetailScreen';
import {ElementEditScreen} from '../map/ElementEditScreen';
import {MapScreen} from '../map/MapScreen';
import {ImportShareScreen} from '../share/ImportShareScreen';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The authenticated app's screen stack. Headers are hidden — each screen draws
 * its own chrome edge-to-edge and applies its own safe-area padding. The detail
 * screen slides in from the right as a standard forward push.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="ElementDetail" component={ElementDetailScreen} />
      <Stack.Screen name="ElementEdit" component={ElementEditScreen} />
      <Stack.Screen name="ImportShare" component={ImportShareScreen} />
    </Stack.Navigator>
  );
}
