import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import notifee from '@notifee/react-native';

export default function App() {
  useEffect(() => {
    const initNotifications = async () => {
      await notifee.requestPermission();

      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: 4,
      });
    };

    initNotifications();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
}
