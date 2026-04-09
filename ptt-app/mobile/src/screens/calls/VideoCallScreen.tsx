import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { useNavigation } from '@react-navigation/native';
import RNCallKeep from 'react-native-callkeep';
import { useCallStore } from '../../store/callStore';
import { setMicEnabled, getLocalStream, cleanup, setCallbacks } from '../../services/webrtc';
import { getSocket } from '../../services/socket';

export default function VideoCallScreen() {
  const navigation = useNavigation();
  const { callId, peerId, peerName, status, clearCall } = useCallStore();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStream = getLocalStream();

  useEffect(() => {
    setCallbacks({
      onRemoteStream: (_peerId, stream) => setRemoteStream(stream),
    });

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
      {/* Remote video (full screen) */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noVideo]}>
          <Text style={styles.noVideoText}>Waiting for video…</Text>
        </View>
      )}

      {/* Local video (picture-in-picture) */}
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.pip}
          objectFit="cover"
          mirror
        />
      )}

      {/* Caller name overlay */}
      <View style={styles.nameOverlay}>
        <Text style={styles.name}>{peerName ?? 'Unknown'}</Text>
        <Text style={styles.status}>
          {status === 'outgoing' ? 'Calling...' : status === 'incoming' ? 'Incoming...' : 'Connected'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.hangup} onPress={hangUp}>
          <Text style={styles.hangupIcon}>📵</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  noVideo: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117' },
  noVideoText: { color: '#8b949e', fontSize: 16 },
  pip: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  nameOverlay: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 1 },
  name: { color: '#fff', fontWeight: '800', fontSize: 24, textShadowColor: '#000', textShadowRadius: 6 },
  status: { color: '#ccc', fontSize: 14, marginTop: 4 },
  controls: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  hangup: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangupIcon: { fontSize: 30 },
});
