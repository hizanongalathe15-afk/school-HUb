import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton, AppCard, Screen, colors } from '../components';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading, error, user } = useAuth();
  const [email, setEmail] = useState('parent@schoolhub.ac.ke');
  const [password, setPassword] = useState('parent123');

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View>
          <Text style={styles.logo}>School Hub</Text>
          <Text style={styles.title}>Parent sign in</Text>
          <Text style={styles.subtitle}>Access children, fees, results, messages, events, and verified documents.</Text>
        </View>

        <AppCard title="Secure login" subtitle="Demo account is prefilled for fast presentation testing.">
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" style={styles.input} />
          <AppButton label={loading ? 'Signing in...' : 'Sign in'} onPress={() => login({ email, password })} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {user ? <Text style={styles.success}>Signed in as {user.name}</Text> : null}
        </AppCard>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 22 },
  logo: { color: colors.primary, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 36, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#ffffff' },
  error: { color: colors.danger, fontWeight: '800' },
  success: { color: colors.teal, fontWeight: '800' }
});
