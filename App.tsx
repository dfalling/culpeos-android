/**
 * Culpeos React Native app entry.
 *
 * @format
 */

import {ApolloProvider} from '@apollo/client';
import {useEffect} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {apolloClient, logout} from './src/auth/authClient';
import {useDeepLinkListener} from './src/auth/deepLinks';
import {LoginScreen} from './src/auth/LoginScreen';
import {tokenStore, useAuth, useAuthHydrated} from './src/auth/tokenStore';
import {MapScreen} from './src/map/MapScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </SafeAreaProvider>
    </ApolloProvider>
  );
}

function AppContent() {
  const hydrated = useAuthHydrated();
  const auth = useAuth();
  const safeAreaInsets = useSafeAreaInsets();

  useDeepLinkListener();

  useEffect(() => {
    tokenStore.hydrate();
  }, []);

  if (!hydrated) {
    return (
      <View style={[styles.container, styles.splash]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!auth) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <MapScreen />
      <View
        style={[styles.logoutBar, {paddingBottom: safeAreaInsets.bottom + 12}]}>
        <Text style={styles.signedInAs}>Signed in as {auth.user.email}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            logout();
          }}
          style={({pressed}) => [
            styles.logoutButton,
            pressed && styles.logoutPressed,
          ]}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </View>
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
  logoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signedInAs: {
    fontSize: 12,
    color: '#444',
    flex: 1,
    marginRight: 12,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  logoutPressed: {opacity: 0.7},
  logoutText: {
    fontSize: 14,
    color: '#222',
  },
});

export default App;
