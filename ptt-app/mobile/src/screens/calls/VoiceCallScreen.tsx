import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RNCallKeep from 'react-native-callkeep';
import { useCallStore } from '../../store/callStore';
import { setMicEnabled, cleanup } from '../../services/webrtc';
import { getSocket } from '../../services/socket';

export default function VoiceCallScreen() {
  const navigation = useNavigation();
  const { callId, peerId, peerName, status, clearCall } = useCallStore();

  // Unmute mic unconditionally (not PTT-gated) when call is active
  useEffect(() => {
    if (status === 'active') setMicEnabled(true);
  }, [status]);

  function hangUp() {
    if (callId) {
      RNCallKeep.endCall(callId);
      getSocket().emit('call:end', { callId, to: peerId });
    }
    setMicEnabled(false);
    cleanup();
    clearCall();
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>
            {(peerName ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{peerName ?? 'Unknown'}</Text>
        <Text style={styles.status}>
          {status === 'outgoing' ? 'Calling...' : status === 'incoming' ? 'Incoming...' : 'Connected'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.hangup} onPress={hangUp}>
          <Text style={styles.hangupIcon}>📵</Text>
          <Text style={styles.hangupLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#21262d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  initials: { color: '#e6edf3', fontWeight: '800', fontSize: 52 },
  name: { color: '#e6edf3', fontWeight: '800', fontSize: 26 },
  status: { color: '#8b949e', fontSize: 15, marginTop: 8 },
  controls: { paddingBottom: 56, alignItems: 'center' },
  hangup: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangupIcon: { fontSize: 28 },
  hangupLabel: { color: '#fff', fontWeight: '700', fontSize: 11, marginTop: 2 },
});
