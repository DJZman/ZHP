import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { useCallKeep } from '../hooks/useCallKeep';

import LoginScreen from '../screens/auth/LoginScreen';
import ContactsScreen from '../screens/contacts/ContactsScreen';
import ContactDetailScreen from '../screens/contacts/ContactDetailScreen';
import GroupsScreen from '../screens/ptt/GroupsScreen';
import PTTScreen from '../screens/ptt/PTTScreen';
import ConversationsScreen from '../screens/conversations/ConversationsScreen';
import ConversationDetailScreen from '../screens/conversations/ConversationDetailScreen';
import VoiceCallScreen from '../screens/calls/VoiceCallScreen';
import VideoCallScreen from '../screens/calls/VideoCallScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DARK_HEADER = {
  headerStyle: { backgroundColor: '#161b22' },
  headerTintColor: '#e6edf3',
  headerTitleStyle: { fontWeight: '700' as const },
};

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#161b22', borderTopColor: '#21262d' },
        tabBarActiveTintColor: '#f0a500',
        tabBarInactiveTintColor: '#8b949e',
        headerShown: false,
      }}>
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          title: 'Channels',
          tabBarIcon: ({ focused }) => <TabIcon icon="📻" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={ConversationsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token } = useAuthStore();

  // Register CallKeep listeners at the root level
  useCallKeep();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={DARK_HEADER}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="PTT" component={PTTScreen} options={({ route }) => ({
              title: (route.params as any)?.conversationName ?? 'PTT',
            })} />
            <Stack.Screen name="ContactDetail" component={ContactDetailScreen} options={({ route }) => ({
              title: (route.params as any)?.displayName ?? 'Contact',
            })} />
            <Stack.Screen name="ConversationDetail" component={ConversationDetailScreen} options={({ route }) => ({
              title: (route.params as any)?.conversationName ?? 'Chat',
            })} />
            <Stack.Screen
              name="VoiceCall"
              component={VoiceCallScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="VideoCall"
              component={VideoCallScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
