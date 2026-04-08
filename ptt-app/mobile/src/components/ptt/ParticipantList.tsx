import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { usePttStore } from '../../store/pttStore';

interface Participant {
  id: string;
  displayName: string;
}

interface Props {
  participants: Participant[];
}

export default function ParticipantList({ participants }: Props) {
  const { floorHolder } = usePttStore();

  return (
    <FlatList
      data={participants}
      keyExtractor={(item) => item.id}
      horizontal
      contentContainerStyle={styles.row}
      renderItem={({ item }) => {
        const isTalking = item.id === floorHolder;
        return (
          <View style={[styles.avatar, isTalking && styles.talking]}>
            <Text style={styles.initials}>
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
            {isTalking && <View style={styles.dot} />}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#21262d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#30363d',
  },
  talking: { borderColor: '#22c55e', borderWidth: 3 },
  initials: { color: '#e6edf3', fontWeight: '700', fontSize: 20 },
  dot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0d1117',
  },
});
