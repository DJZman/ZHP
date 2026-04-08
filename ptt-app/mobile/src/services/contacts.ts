import Contacts from 'react-native-contacts';
import { Platform } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { api } from './api';

export interface DeviceContact {
  recordID: string;
  displayName: string;
  phoneNumbers: string[];
  thumbnailPath?: string;
}

export interface AppContact extends DeviceContact {
  appUserId: string;   // matched app user id
  appUserName: string;
}

export async function requestContactsPermission(): Promise<boolean> {
  const permission =
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CONTACTS : PERMISSIONS.ANDROID.READ_CONTACTS;
  const result = await request(permission);
  return result === RESULTS.GRANTED;
}

export async function loadContacts(): Promise<DeviceContact[]> {
  const granted = await requestContactsPermission();
  if (!granted) return [];

  const raw = await Contacts.getAll();
  return raw
    .filter((c) => c.phoneNumbers.length > 0)
    .map((c) => ({
      recordID: c.recordID,
      displayName: `${c.givenName} ${c.familyName}`.trim() || c.phoneNumbers[0].number,
      phoneNumbers: c.phoneNumbers.map((p) => p.number.replace(/\D/g, '')),
      thumbnailPath: c.thumbnailPath || undefined,
    }));
}

export async function matchContactsWithApp(contacts: DeviceContact[]): Promise<AppContact[]> {
  const allPhones = contacts.flatMap((c) => c.phoneNumbers);
  if (allPhones.length === 0) return [];

  const matched = await api.matchContacts(allPhones);
  // matched: Array<{ id, phone, displayName, avatarUrl }>

  const phoneToUser = new Map<string, { id: string; displayName: string }>(
    matched.map((u: any) => [u.phone, u]),
  );

  const result: AppContact[] = [];
  for (const contact of contacts) {
    for (const phone of contact.phoneNumbers) {
      const appUser = phoneToUser.get(phone);
      if (appUser) {
        result.push({
          ...contact,
          appUserId: appUser.id,
          appUserName: appUser.displayName,
        });
        break;
      }
    }
  }
  return result;
}
