import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

import PTTButton from '../../components/ptt/PTTButton';
import ParticipantList from '../../components/ptt/ParticipantList';
import CallActionBar from '../../components/calls/CallActionBar';
import { usePTT } from '../../hooks/usePTT';
import { useHardwareButton } from '../../hooks/useHardwareButton';
import { usePttStore } from '../../store/pttStore';
import { useCallStore } from '../../store/callStore';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { initLocalStream, addVideoTrack } from '../../services/webrtc';
import { v4 as uuidv4 } from 'uuid';

export type PTTScreenParams = {
  conversationId: string;
  conversationName: string;
  participants: Array<{ id: string; displayName: string }>;
};

export default function PTTScreen() {
  const route = useRoute<RouteProp<{ PTT: PTTScreenParams }, 'PTT'>>();
  const navigation = useNavigation<any>();
  const { conversationId, conversationName, participants } = route.params;

  const { pttState, requestFloor, releaseFloor } = usePTT(
    conversationId,
    participants.map((p) => p.id),
  );
  const { floorHolder } = usePttStore();
  const { setOutgoingCall } = useCallStore();

  // Wire hardware buttons to the same PTT actions
  useHardwareButton({ onDown: requestFloor, onUp: releaseFloor });

  const startCall = useCallback(
    async (callType: 'voice' | 'video') => {
      await initLocalStream(callType === 'video');
      if (callType === 'video') await addVideoTrack();

      const targetId = participants[0]?.id;
      if (!targetId) return;

      const callId = uuidv4();
      setOutgoingCall(callId, callType, targetId, participants[0]?.displayName ?? '', conversationId);
      getSocket().emit('call:invite', { to: targetId, conversationId, callType, callId });

      navigation.navigate(callType === 'voice' ? 'VoiceCall' : 'VideoCall');
    },
    [conversationId, navigation, participants, setOutgoingCall],
  );

  const openChat = useCallback(() => {
    navigation.navigate('ConversationDetail', { conversationId, conversationName });
  }, [conversationId, conversationName, navigation]);

  const floorUser = participants.find((p) => p.id === floorHolder);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.channelName}>{conversationName}</Text>
        <Text style={styles.status}>
          {floorUser ? `${floorUser.displayName} is talking` : 'Channel open'}
        </Text>
      </View>

      {/* Participants */}
      <ParticipantList participants={participants} />

      {/* PTT Button */}
      <View style={styles.btnArea}>
        <PTTButton
          pttState={pttState}
          onPressIn={requestFloor}
          onPressOut={releaseFloor}
        />
        <Text style={styles.hint}>Hold button or Volume Up to talk</Text>
      </View>

      {/* Call / Chat actions */}
      <View style={styles.actions}>
        <CallActionBar
          onVoiceCall={() => startCall('voice')}
          onVideoCall={() => startCall('video')}
          onMessage={openChat}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 12 },
  channelName: { color: '#e6edf3', fontWeight: '800', fontSize: 22 },
  status: { color: '#8b949e', fontSize: 13, marginTop: 4 },
  btnArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#8b949e', fontSize: 12, marginTop: 16 },
  actions: { paddingBottom: 24, paddingTop: 12 },
});
