/**
 * Hardware button hook
 *
 * Abstracts three physical PTT trigger sources into one unified event:
 *   - Volume Up key (Android: native module, iOS: AVAudioSession KVO)
 *   - Bluetooth HID PTT button (via react-native-ble-manager)
 *   - Headset inline button (via Android AudioManager)
 *
 * Consumer provides onDown/onUp callbacks — same API as the on-screen PTTButton.
 */

import { useEffect } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';

const { HardwareButtonModule } = NativeModules;
const bleEmitter = new NativeEventEmitter(NativeModules.BleManager);

// Known PTT button HID report patterns (vendor-specific, extend as needed)
const PTT_HID_DOWN = 0x01;
const PTT_HID_UP = 0x00;

interface Options {
  onDown: () => void;
  onUp: () => void;
  enabled?: boolean;
}

export function useHardwareButton({ onDown, onUp, enabled = true }: Options) {
  useEffect(() => {
    if (!enabled || !HardwareButtonModule) return;

    const emitter = new NativeEventEmitter(HardwareButtonModule);

    // Volume key events from native module
    const volSub = emitter.addListener('volumeButtonEvent', (action: 'down' | 'up') => {
      if (action === 'down') onDown();
      else onUp();
    });

    // Bluetooth HID PTT button
    const bleSub = bleEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value }: { value: number[] }) => {
        if (value?.[0] === PTT_HID_DOWN) onDown();
        else if (value?.[0] === PTT_HID_UP) onUp();
      },
    );

    // Start BLE scanning for known PTT accessories
    BleManager.start({ showAlert: false }).then(() => {
      BleManager.scan([], 5, false);
    }).catch(() => {/* BLE unavailable */});

    return () => {
      volSub.remove();
      bleSub.remove();
    };
  }, [onDown, onUp, enabled]);
}
