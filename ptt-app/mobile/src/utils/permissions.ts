import { Platform } from 'react-native';
import { PERMISSIONS, requestMultiple, RESULTS } from 'react-native-permissions';

export async function requestAppPermissions(): Promise<void> {
  const permissions =
    Platform.OS === 'ios'
      ? [
          PERMISSIONS.IOS.MICROPHONE,
          PERMISSIONS.IOS.CAMERA,
          PERMISSIONS.IOS.CONTACTS,
          PERMISSIONS.IOS.BLUETOOTH,        // iOS 13+ — was BLUETOOTH_PERIPHERAL in older library versions
        ]
      : [
          PERMISSIONS.ANDROID.RECORD_AUDIO,
          PERMISSIONS.ANDROID.CAMERA,
          PERMISSIONS.ANDROID.READ_CONTACTS,
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        ];

  await requestMultiple(permissions as any);
}
