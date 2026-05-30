/**
 * Culpeos React Native app entry.
 *
 * @format
 */

import {ApolloProvider} from '@apollo/client';
import {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
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
import {
  type AuthUser,
  tokenStore,
  useAuth,
  useAuthHydrated,
} from './src/auth/tokenStore';
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
      <AccountMenu user={auth.user} />
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AccountMenu({user}: {user: AuthUser}) {
  const safeAreaInsets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const initial = user.email.trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [open, anim]);

  // The hardware back button closes the sheet (Modal used to handle this).
  useEffect(() => {
    if (!open) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 320, 0],
  });

  return (
    <>
      <Pressable
        accessibilityLabel="Account menu"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({pressed}) => [
          styles.avatarButton,
          {top: safeAreaInsets.top + 12},
          pressed && styles.avatarPressed,
        ]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
      {/* Rendered in-tree (not in a separate Modal window) so the scrim and
          sheet extend behind the status and navigation bars, matching the map. */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents={open ? 'auto' : 'none'}>
        <AnimatedPressable
          accessibilityLabel="Close account menu"
          style={[styles.sheetBackdrop, {opacity: anim}]}
          onPress={() => setOpen(false)}
        />
        <Animated.View
          style={[styles.sheetWrap, {transform: [{translateY}]}]}
          pointerEvents="box-none">
          <View
            onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
            style={[styles.sheet, {paddingBottom: safeAreaInsets.bottom + 12}]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEmail} numberOfLines={1}>
              {user.email}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                logout();
              }}
              style={({pressed}) => [
                styles.sheetItem,
                pressed && styles.sheetItemPressed,
              ]}>
              <Text style={styles.sheetItemText}>Log out</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </>
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
  avatarButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d6fe0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
  },
  avatarPressed: {opacity: 0.8},
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d0d0d0',
    marginBottom: 12,
  },
  sheetEmail: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  sheetItem: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
  },
  sheetItemPressed: {
    backgroundColor: '#f2f2f2',
  },
  sheetItemText: {
    fontSize: 16,
    color: '#222',
  },
});

export default App;
