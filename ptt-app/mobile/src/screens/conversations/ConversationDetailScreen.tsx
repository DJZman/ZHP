import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

type Params = {
  ConversationDetail: { conversationId: string; conversationName: string };
};

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  type: string;
  createdAt: string;
  sender: { id: string; displayName: string };
}

export default function ConversationDetailScreen() {
  const route = useRoute<RouteProp<Params, 'ConversationDetail'>>();
  const { conversationId, conversationName } = route.params;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    api.getMessages(conversationId).then(setMessages);

    const socket = getSocket();
    socket.emit('presence:join-rooms', [conversationId]);

    socket.on('message:receive', (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, msg]);
      listRef.current?.scrollToEnd({ animated: true });
    });

    return () => { socket.off('message:receive'); };
  }, [conversationId]);

  const sendMessage = useCallback(() => {
    const body = text.trim();
    if (!body) return;
    setText('');
    getSocket().emit('message:send', { conversationId, body, type: 'TEXT' });
  }, [conversationId, text]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{conversationName}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
                {!isMine && (
                  <Text style={styles.senderName}>{item.sender?.displayName}</Text>
                )}
                <Text style={[styles.msgText, isMine && styles.msgTextMine]}>
                  {item.type === 'PTT_CLIP' ? '🎙 PTT recording' : item.body}
                </Text>
                <Text style={[styles.time, isMine && styles.timeMine]}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim()}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  title: { color: '#e6edf3', fontWeight: '800', fontSize: 18 },
  list: { padding: 12, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10 },
  mine: { backgroundColor: '#f0a500', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirs: { backgroundColor: '#21262d', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  senderName: { color: '#8b949e', fontSize: 11, marginBottom: 3 },
  msgText: { color: '#0d1117', fontSize: 15 },
  msgTextMine: { color: '#000' },
  time: { color: '#555', fontSize: 10, textAlign: 'right', marginTop: 4 },
  timeMine: { color: '#333' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#21262d' },
  input: {
    flex: 1,
    backgroundColor: '#161b22',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#e6edf3',
    fontSize: 15,
    maxHeight: 120,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0a500', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: '#000', fontSize: 18, fontWeight: '800' },
});
