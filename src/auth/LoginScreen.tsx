import {useMutation} from '@apollo/client/react';
import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {LoginDocument} from '../graphql/__generated__/types';
import type {Theme} from '../theme/colors';
import {useTheme} from '../theme/useTheme';
import {TextField} from '../ui/TextField';
import {clearSecurityWarning, useSecurityWarning} from './authClient';
import {tokenStore} from './tokenStore';

function deviceLabel(): string {
  // The guide recommends device model + Android version; we don't have a
  // device-info module installed, so fall back to the OS version. Users can
  // still identify the entry in the session list.
  return `Android ${Platform.Version}`;
}

function errorCode(err: unknown): string | undefined {
  const arr =
    err && typeof err === 'object' && 'graphQLErrors' in err
      ? (err as {graphQLErrors?: ReadonlyArray<{extensions?: {code?: string}}>})
          .graphQLErrors
      : undefined;
  return arr?.[0]?.extensions?.code;
}

function messageForCode(code: string | undefined): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password.';
    case 'ACCOUNT_UNCONFIRMED':
      return 'Please confirm your email address before logging in.';
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait a minute and try again.';
    default:
      return 'Login failed. Please try again.';
  }
}

export function LoginScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [login, {loading}] = useMutation(LoginDocument);
  const securityWarning = useSecurityWarning();

  const canSubmit = email.length > 0 && password.length > 0 && !loading;

  async function onSubmit() {
    setErrorMessage(null);
    clearSecurityWarning();
    try {
      const {data} = await login({
        variables: {input: {email, password, deviceLabel: deviceLabel()}},
      });
      if (!data?.login) {
        setErrorMessage('Login failed. Please try again.');
        return;
      }
      tokenStore.set({
        accessToken: data.login.accessToken,
        refreshToken: data.login.refreshToken,
        expiresAtMs: new Date(data.login.expiresAt).getTime(),
        user: data.login.user,
      });
    } catch (err) {
      setErrorMessage(messageForCode(errorCode(err)));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign in to Culpeos</Text>

        <TextField
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <TextField
          placeholder="Password"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          onSubmitEditing={canSubmit ? onSubmit : undefined}
        />

        {securityWarning ? (
          <Text style={styles.warning}>{securityWarning}</Text>
        ) : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          onPress={onSubmit}
          style={({pressed}) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}>
          {loading ? (
            <ActivityIndicator color={theme.onAccent} />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: {flex: 1, backgroundColor: theme.canvas},
    container: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
      gap: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
      color: theme.ink,
    },
    error: {
      color: theme.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    warning: {
      color: theme.danger,
      fontSize: 13,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    // The screen's one CTA, so this is where accent is spent. The pressed
    // state is the fill at 85%, which is what the opacity below amounts to
    // over the canvas.
    button: {
      backgroundColor: theme.accent,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {opacity: 0.5},
    buttonPressed: {opacity: 0.85},
    buttonText: {
      color: theme.onAccent,
      fontSize: 16,
      fontWeight: '600',
    },
  });
