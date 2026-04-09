import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onMessage: () => void;
}

export default function CallActionBar({ onVoiceCall, onVideoCall, onMessage }: Props) {
  return (
    <View style={styles.bar}>
      <ActionBtn label="Voice" icon="📞" color="#22c55e" onPress={onVoiceCall} />
      <ActionBtn label="Video" icon="📹" color="#3b82f6" onPress={onVideoCall} />
      <ActionBtn label="Message" icon="💬" color="#a855f7" onPress={onMessage} />
    </View>
  );
}

function ActionBtn({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 24, gap: 12 },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  icon: { fontSize: 22, marginBottom: 4 },
  label: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
