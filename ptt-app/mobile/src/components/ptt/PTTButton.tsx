import React, { useCallback } from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Text,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { PTTState } from '../../store/pttStore';

interface Props {
  pttState: PTTState;
  onPressIn: () => void;
  onPressOut: () => void;
  disabled?: boolean;
}

const STATE_COLORS: Record<PTTState, string> = {
  idle: '#f0a500',
  requesting: '#888',
  transmitting: '#22c55e',
  listening: '#3b82f6',
};

const STATE_LABELS: Record<PTTState, string> = {
  idle: 'HOLD TO TALK',
  requesting: 'REQUESTING...',
  transmitting: 'TRANSMITTING',
  listening: 'LISTENING',
};

export default function PTTButton({ pttState, onPressIn, onPressOut, disabled }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Vibration.vibrate(30);
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
    onPressIn();
  }, [onPressIn, scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    onPressOut();
  }, [onPressOut, scale]);

  const color = STATE_COLORS[pttState];

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}>
      <Animated.View style={[styles.outer, { transform: [{ scale }] }]}>
        <View style={[styles.inner, { backgroundColor: color, shadowColor: color }]}>
          {/* Pulsing ring when transmitting */}
          {pttState === 'transmitting' && (
            <View style={[styles.pulse, { borderColor: color }]} />
          )}
          <Text style={styles.icon}>📻</Text>
          <Text style={styles.label}>{STATE_LABELS[pttState]}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const BTN = 180;

const styles = StyleSheet.create({
  outer: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignSelf: 'center',
  },
  inner: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  pulse: {
    position: 'absolute',
    width: BTN + 20,
    height: BTN + 20,
    borderRadius: (BTN + 20) / 2,
    borderWidth: 3,
    opacity: 0.4,
  },
  icon: { fontSize: 44, marginBottom: 8 },
  label: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },
});
