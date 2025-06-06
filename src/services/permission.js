import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { Alert } from 'react-native';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {

    getFCMToken(); // Get the FCM token after permission is granted
  }
}

async function getFCMToken() {
  const token = await messaging().getToken();
  // Send this token to your backend!
  // e.g., YourApiClient.registerPushToken(token);
}

const ProfileScreen = ({ navigation }) => {
  useEffect(() => {
    requestUserPermission();

    // Handle foreground messages
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('Foreground Message:', remoteMessage);
      Alert.alert(
        remoteMessage.notification.title,
        remoteMessage.notification.body
      );
    });

    // Handle messages when app is in background or quit and opened by tapping notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app from background/quit state:', remoteMessage);
      // Navigate to a specific screen or handle data
    });

    // Get initial notification when app is opened from a quit state
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from quit state by notification:', remoteMessage);
        // Handle initial notification
      }
    });

    return () => {
      unsubscribeOnMessage();
    };
  }, []);

  // ... rest of your App component
}
export default ProfileScreen;