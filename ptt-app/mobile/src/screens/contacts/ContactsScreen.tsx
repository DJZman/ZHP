import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ContactCard from '../../components/contacts/ContactCard';
import { loadContacts, matchContactsWithApp, AppContact, DeviceContact } from '../../services/contacts';

export default function ContactsScreen() {
  const [appContacts, setAppContacts] = useState<AppContact[]>([]);
  const [otherContacts, setOtherContacts] = useState<DeviceContact[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    setLoading(true);
    const all = await loadContacts();
    const matched = await matchContactsWithApp(all);
    const matchedIds = new Set(matched.map((m) => m.recordID));
    setAppContacts(matched);
    setOtherContacts(all.filter((c) => !matchedIds.has(c.recordID)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openContact = useCallback(
    (contact: AppContact) => {
      navigation.navigate('ContactDetail', {
        userId: contact.appUserId,
        displayName: contact.appUserName,
        phone: contact.phoneNumbers[0],
      });
    },
    [navigation],
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator color="#f0a500" size="large" />
      </SafeAreaView>
    );
  }

  const sections = [
    { title: 'On PTT Walkie', data: appContacts },
    { title: 'Invite to PTT Walkie', data: otherContacts },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Contacts</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.recordID}
        renderSectionHeader={({ section: { title, data } }) =>
          data.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          ) : null
        }
        renderItem={({ item, section }) => {
          const isApp = section.title === 'On PTT Walkie';
          return (
            <ContactCard
              name={item.displayName}
              phone={item.phoneNumbers[0]}
              isAppUser={isApp}
              onPress={isApp ? () => openContact(item as AppContact) : undefined}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { color: '#e6edf3', fontWeight: '800', fontSize: 22, padding: 16 },
  sectionHeader: { backgroundColor: '#161b22', paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { color: '#8b949e', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
});
