import Contacts from 'react-native-contacts';
import { Platform } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { api } from './api';
import { createLogger } from '../utils/logger';

const log = createLogger('contacts');

export interface DeviceContact {
  recordID: string;
  displayName: string;
  phoneNumbers: string[];
  thumbnailPath?: string;
}

export interface AppContact extends DeviceContact {
  appUserId: string;
  appUserName: string;
}

export async function requestContactsPermission(): Promise<boolean> {
  const permission =
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CONTACTS : PERMISSIONS.ANDROID.READ_CONTACTS;
  log.info('requesting contacts permission', { platform: Platform.OS });
  const result = await request(permission);
  const granted = result === RESULTS.GRANTED;
  log.info('contacts permission result', { result, granted });
  return granted;
}

export async function loadContacts(): Promise<DeviceContact[]> {
  const granted = await requestContactsPermission();
  if (!granted) {
    log.warn('contacts permission denied');
    return [];
  }

  log.info('loading device contacts');
  const raw = await Contacts.getAll();
  const contacts = raw
    .filter((c) => c.phoneNumbers.length > 0)
    .map((c) => ({
      recordID: c.recordID,
      displayName: `${c.givenName} ${c.familyName}`.trim() || c.phoneNumbers[0].number,
      phoneNumbers: c.phoneNumbers.map((p) => p.number.replace(/\D/g, '')),
      thumbnailPath: c.thumbnailPath || undefined,
    }));

  log.info('device contacts loaded', { total: raw.length, withPhone: contacts.length });
  return contacts;
}

export async function matchContactsWithApp(contacts: DeviceContact[]): Promise<AppContact[]> {
  const allPhones = contacts.flatMap((c) => c.phoneNumbers);
  if (allPhones.length === 0) {
    log.debug('matchContactsWithApp: no phone numbers to match');
    return [];
  }

  log.info('matching contacts with app users', { phoneCount: allPhones.length });
  const matched = await api.matchContacts(allPhones);
  log.info('contacts matched', { matchCount: matched.length });

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
        log.debug('contact matched', { name: contact.displayName, phone, appUserId: appUser.id });
        break;
      }
    }
  }
  return result;
}
