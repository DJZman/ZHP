import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

export interface ContactCardProps {
  id?: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  isAppUser?: boolean;
  onPress?: () => void;
}

export default function ContactCard({ name, phone, avatarUrl, isAppUser, onPress }: ContactCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.initials}>{name.charAt(0).toUpperCase()}</Text>
        )}
        {isAppUser && <View style={styles.badge} />}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {phone && <Text style={styles.phone}>{phone}</Text>}
      </View>
      {isAppUser && <Text style={styles.pttBadge}>PTT</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#21262d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  initials: { color: '#e6edf3', fontWeight: '700', fontSize: 18 },
  badge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0d1117',
  },
  info: { flex: 1 },
  name: { color: '#e6edf3', fontWeight: '600', fontSize: 15 },
  phone: { color: '#8b949e', fontSize: 12, marginTop: 2 },
  pttBadge: {
    backgroundColor: '#f0a500',
    color: '#000',
    fontWeight: '800',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
