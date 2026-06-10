/**
 * Culpeos React Native app entry.
 *
 * @format
 */

import {ApolloProvider} from '@apollo/client/react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {useCallback, useEffect} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {apolloClient} from './src/auth/authClient';
import {useDeepLinkListener} from './src/auth/deepLinks';
import {LoginScreen} from './src/auth/LoginScreen';
import {tokenStore, useAuth, useAuthHydrated} from './src/auth/tokenStore';
import {RootNavigator} from './src/navigation/RootNavigator';
import type {RootStackParamList} from './src/navigation/types';
import {
  consumePendingShare,
  usePendingShare,
  useShareListener,
} from './src/share/shareImport';
import {useTheme} from './src/theme/useTheme';

function App() {
  const theme = useTheme();

  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
        />
        <AppContent />
      </SafeAreaProvider>
    </ApolloProvider>
  );
}

function AppContent() {
  const theme = useTheme();
  const hydrated = useAuthHydrated();
  const auth = useAuth();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const pendingShare = usePendingShare();

  useDeepLinkListener();
  useShareListener();

  useEffect(() => {
    tokenStore.hydrate();
  }, []);

  // Route a shared payload to the import screen once navigation is mounted. A
  // cold-start share (or one captured before login) is held in the reactive var
  // until the container is ready; `onReady` below drains it then. Warm shares
  // arrive while ready and route immediately via this effect.
  const routePendingShare = useCallback(() => {
    if (!navigationRef.isReady()) return;
    const content = consumePendingShare();
    if (content) navigationRef.navigate('ImportShare', {content});
  }, [navigationRef]);

  useEffect(() => {
    if (pendingShare) routePendingShare();
  }, [pendingShare, routePendingShare]);

  if (!hydrated) {
    return (
      <View
        style={[
          styles.container,
          styles.splash,
          {backgroundColor: theme.background},
        ]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!auth) {
    return <LoginScreen />;
  }

  // Match React Navigation's container background to the active scheme so the
  // gap shown during the slide transition between screens isn't a white flash
  // in dark mode.
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={routePendingShare}
      theme={theme.scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
