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
import { createLogger } from '../utils/logger';

const log = createLogger('hardwareBtn');

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
    if (!enabled) {
      log.debug('hardware button hook disabled');
      return;
    }

    if (!HardwareButtonModule) {
      log.warn('HardwareButtonModule not available — native module not linked?');
    }

    // Volume key events from native module (Android & iOS)
    let volSub: { remove: () => void } | null = null;
    if (HardwareButtonModule) {
      const emitter = new NativeEventEmitter(HardwareButtonModule);
      volSub = emitter.addListener('volumeButtonEvent', (action: 'down' | 'up') => {
        log.debug('volume button', { action, platform: Platform.OS });
        if (action === 'down') onDown();
        else onUp();
      });
      log.info('volume button listener registered', { platform: Platform.OS });
    }

    // Bluetooth HID PTT button
    const bleSub = bleEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic }: { value: number[]; peripheral: string; characteristic: string }) => {
        if (value?.[0] === PTT_HID_DOWN) {
          log.info('BLE PTT button pressed', { peripheral, characteristic });
          onDown();
        } else if (value?.[0] === PTT_HID_UP) {
          log.info('BLE PTT button released', { peripheral, characteristic });
          onUp();
        }
      },
    );

    // Start BLE scanning for known PTT accessories
    BleManager.start({ showAlert: false })
      .then(() => {
        log.info('BLE manager started, scanning for PTT accessories');
        return BleManager.scan([], 5, false);
      })
      .catch((err: Error) => log.warn('BLE unavailable', { err: err.message }));

    return () => {
      volSub?.remove();
      bleSub.remove();
      log.debug('hardware button listeners removed');
    };
  }, [onDown, onUp, enabled]);
}
