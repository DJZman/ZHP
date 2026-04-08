import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { requestAppPermissions } from './src/utils/permissions';
import { connectSocket } from './src/services/socket';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const { token } = useAuthStore();

  useEffect(() => {
    requestAppPermissions();
    if (token) connectSocket();
  }, [token]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
