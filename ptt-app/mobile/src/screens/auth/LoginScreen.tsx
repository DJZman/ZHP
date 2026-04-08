import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { connectSocket } from '../../services/socket';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  async function handleSubmit() {
    if (!phone.trim()) return Alert.alert('Enter your phone number');
    if (isNew && !displayName.trim()) return Alert.alert('Enter your name');

    setLoading(true);
    try {
      const result = isNew
        ? await api.register(phone.trim(), displayName.trim())
        : await api.login(phone.trim());

      setAuth(result.token, result.user);
      connectSocket();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>PTT Walkie</Text>
        <Text style={styles.subtitle}>Walkie-talkie for your pocket</Text>

        {isNew && (
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#888"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="+1 555 000 0000"
          placeholderTextColor="#888"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{isNew ? 'Create Account' : 'Sign In'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsNew((v) => !v)}>
          <Text style={styles.toggle}>
            {isNew ? 'Already have an account? Sign in' : "New here? Create account"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#161b22', borderRadius: 16, padding: 28 },
  title: { fontSize: 32, fontWeight: '800', color: '#f0a500', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8b949e', textAlign: 'center', marginBottom: 28 },
  input: {
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 14,
    color: '#e6edf3',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  btn: { backgroundColor: '#f0a500', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  toggle: { color: '#58a6ff', textAlign: 'center', marginTop: 16, fontSize: 13 },
});
