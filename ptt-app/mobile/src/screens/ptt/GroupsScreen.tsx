import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';

interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  members: Array<{ user: { id: string; displayName: string } }>;
}

export default function GroupsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.filter((c: Conversation) => c.type === 'GROUP'));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openChannel = useCallback(
    (conv: Conversation) => {
      navigation.navigate('PTT', {
        conversationId: conv.id,
        conversationName: conv.name ?? 'Group',
        participants: conv.members.map((m) => ({ id: m.user.id, displayName: m.user.displayName })),
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Channels</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openChannel(item)}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>#</Text>
            </View>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.members.length} members</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No groups yet — create one to get started</Text>
        }
      />

      {/* Create group modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Group Channel</Text>
            <TextInput
              style={styles.input}
              placeholder="Channel name"
              placeholderTextColor="#888"
              value={groupName}
              onChangeText={setGroupName}
            />
            <TouchableOpacity
              style={styles.createBtn}
              onPress={async () => {
                if (!groupName.trim()) return;
                // For now create with just self — members can be invited later
                const conv = await api.createGroup(groupName.trim(), []);
                setGroupName('');
                setShowCreate(false);
                load();
              }}>
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { color: '#e6edf3', fontWeight: '800', fontSize: 22 },
  newBtn: { backgroundColor: '#f0a500', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  newBtnText: { color: '#000', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  icon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#21262d', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconText: { color: '#f0a500', fontWeight: '800', fontSize: 20 },
  name: { color: '#e6edf3', fontWeight: '600', fontSize: 15 },
  meta: { color: '#8b949e', fontSize: 12, marginTop: 2 },
  empty: { color: '#8b949e', textAlign: 'center', marginTop: 48 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#161b22', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: '#e6edf3', fontWeight: '800', fontSize: 18, marginBottom: 16 },
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
  createBtn: { backgroundColor: '#f0a500', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
  createBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  cancel: { color: '#8b949e', textAlign: 'center', fontSize: 14 },
});
