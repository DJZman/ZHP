import React, { useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { initLocalStream, addVideoTrack } from '../../services/webrtc';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import { v4 as uuidv4 } from 'uuid';

type Params = {
  ContactDetail: { userId: string; displayName: string; phone?: string };
};

export default function ContactDetailScreen() {
  const route = useRoute<RouteProp<Params, 'ContactDetail'>>();
  const navigation = useNavigation<any>();
  const { userId, displayName, phone } = route.params;
  const { setOutgoingCall } = useCallStore();
  const { user } = useAuthStore();

  const startPTT = useCallback(async () => {
    const conv = await api.findOrCreateDirect(userId);
    navigation.navigate('PTT', {
      conversationId: conv.id,
      conversationName: displayName,
      participants: [{ id: userId, displayName }],
    });
  }, [userId, displayName, navigation]);

  const startCall = useCallback(
    async (callType: 'voice' | 'video') => {
      const conv = await api.findOrCreateDirect(userId);
      await initLocalStream(callType === 'video');
      if (callType === 'video') await addVideoTrack();

      const callId = uuidv4();
      setOutgoingCall(callId, callType, userId, displayName, conv.id);
      getSocket().emit('call:invite', { to: userId, conversationId: conv.id, callType, callId });
      navigation.navigate(callType === 'voice' ? 'VoiceCall' : 'VideoCall');
    },
    [userId, displayName, navigation, setOutgoingCall],
  );

  const openChat = useCallback(async () => {
    const conv = await api.findOrCreateDirect(userId);
    navigation.navigate('ConversationDetail', { conversationId: conv.id, conversationName: displayName });
  }, [userId, displayName, navigation]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {phone && <Text style={styles.phone}>{phone}</Text>}
      </View>

      <View style={styles.actions}>
        <Action icon="📻" label="PTT" color="#f0a500" onPress={startPTT} />
        <Action icon="📞" label="Voice Call" color="#22c55e" onPress={() => startCall('voice')} />
        <Action icon="📹" label="Video Call" color="#3b82f6" onPress={() => startCall('video')} />
        <Action icon="💬" label="Message" color="#a855f7" onPress={openChat} />
      </View>
    </SafeAreaView>
  );
}

function Action({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.action, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  profile: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#21262d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  initials: { color: '#e6edf3', fontWeight: '800', fontSize: 40 },
  name: { color: '#e6edf3', fontWeight: '800', fontSize: 24 },
  phone: { color: '#8b949e', fontSize: 14, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  action: {
    width: '46%',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
