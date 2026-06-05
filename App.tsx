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
} from '@react-navigation/native';
import {useEffect} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {apolloClient} from './src/auth/authClient';
import {useDeepLinkListener} from './src/auth/deepLinks';
import {LoginScreen} from './src/auth/LoginScreen';
import {tokenStore, useAuth, useAuthHydrated} from './src/auth/tokenStore';
import {RootNavigator} from './src/navigation/RootNavigator';
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

  useDeepLinkListener();

  useEffect(() => {
    tokenStore.hydrate();
  }, []);

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
