import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  members: Array<{ user: { id: string; displayName: string } }>;
  messages: Array<{ body: string; createdAt: string; type: string }>;
}

export default function ConversationsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.getConversations();
    setConversations(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function getName(conv: Conversation) {
    if (conv.name) return conv.name;
    const other = conv.members.find((m) => m.user.id !== user?.id);
    return other?.user.displayName ?? 'Unknown';
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#f0a500" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => {
          const lastMsg = item.messages[0];
          const name = getName(item);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate('ConversationDetail', {
                  conversationId: item.id,
                  conversationName: name,
                })
              }>
              <View style={styles.avatar}>
                <Text style={styles.initials}>{name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                {lastMsg && (
                  <Text style={styles.preview} numberOfLines={1}>
                    {lastMsg.type === 'PTT_CLIP' ? '🎙 PTT recording' : lastMsg.body}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No messages yet</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  title: { color: '#e6edf3', fontWeight: '800', fontSize: 22, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#21262d', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  initials: { color: '#e6edf3', fontWeight: '700', fontSize: 20 },
  info: { flex: 1 },
  name: { color: '#e6edf3', fontWeight: '600', fontSize: 15 },
  preview: { color: '#8b949e', fontSize: 13, marginTop: 2 },
  empty: { color: '#8b949e', textAlign: 'center', marginTop: 48 },
});
