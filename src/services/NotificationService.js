// src/services/NotificationService.js (or just NotificationService.js in your project root)

import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native'; // Only for displaying simple alerts from service
import EncryptedStorage from 'react-native-encrypted-storage'; // Import EncryptedStorage

// This handler must be defined outside any component or exported function
// as it needs to run in the background process, potentially when the app is closed.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Notification handled in the background by service!', remoteMessage);
  // Perform background tasks here, like updating local storage or making network requests.
  // Example: You could store the notification data for later display.
  // import AsyncStorage from '@react-native-async-storage/async-storage';
  // await AsyncStorage.setItem('latestBackgroundNotification', JSON.stringify(remoteMessage));
});

/**
 * Requests notification permissions and retrieves the FCM device token.
 * Sends the token to the backend.
 */
const requestUserPermissionAndGetToken = async () => {
  try {
    // Moved EncryptedStorage logic inside the function where it's used
    const tokens = await EncryptedStorage.getItem("authTokens");
    if (!tokens) {
      console.log("Missing token. Please log in."); // Log error instead of throwing for a service
      // You might want to handle this more gracefully, e.g., prompt user to log in
      return; // Exit if no token
    }
    const { idToken } = JSON.parse(tokens);

    const authStatus = await messaging().requestPermission();
    // Corrected missing closing parenthesis and semicolon
    const enabled = (authStatus === messaging.AuthorizationStatus.AUTHORIZED) || (authStatus === messaging.AuthorizationStatus.PROVISIONAL);

    if (enabled) {
      console.log('Notification permission granted.');
      const token = await messaging().getToken();
      console.log('Sending push token to backend...');
      await fetch('http://192.168.29.121:8000/save-push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        idToken:idToken,
        push_token:token,
        }),
      });
      Alert.alert(token); // Displaying token in alert, useful for debugging
      console.log('Push token sent to backend successfully!');

    } else {
      console.log('User denied notification permissions.');
      Alert.alert(
        'Notification Permission Denied',
        'Please enable notification permissions in your device settings to receive alerts.'
      );
    }
  } catch (error) {
    console.error('Error in requestUserPermissionAndGetToken:', error);
  }
};

/**
 * Initializes all Firebase Cloud Messaging listeners for foreground,
 * background-opened, and killed-state-opened notifications.
 *
 * @returns {function} A cleanup function to unsubscribe from listeners.
 */
export const initializeNotifications = () => {
  // 1. Request permissions and get token when notifications are initialized
  requestUserPermissionAndGetToken();

  // 2. Listener for messages when the app is in the foreground
  const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
    console.log('Notification received in foreground (via service):', remoteMessage);
    // Display a local alert or custom UI based on the notification payload
    Alert.alert(
      remoteMessage.notification?.title || 'New Notification',
      remoteMessage.notification?.body || 'You have a new message.'
    );
  });

  // 3. Listener for when a user taps on a notification to open the app from background
  // Corrected the commented-out block to be a valid function if uncommented,
  // or a proper empty function if no action is intended.
  // Assuming you want to handle the remoteMessage, so uncommented and added body.
  const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(
    async remoteMessage => {
      console.log(
        'Notification caused app to open from background state (via service):',
        remoteMessage,
      );
      Alert.alert(
        'App opened from Background',
        `Data: ${JSON.stringify(remoteMessage.data)}`
      );
      // Example navigation:
      // import { navigate } from './RootNavigation'; // If you have a global navigation service
      // if (remoteMessage.data?.screen) {
      //   navigate(remoteMessage.data.screen, remoteMessage.data);
      // }
    },
  );

  // 4. Check if the app was opened by a notification from a killed state
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      console.log(
        'Notification caused app to open from quit state (via service):',
        remoteMessage,
      );
      // Handle initial navigation or data processing
      Alert.alert(
        'App opened from Killed State',
        `Data: ${JSON.stringify(remoteMessage.data)}`
      );
      // Example navigation:
      // import { navigate } from './RootNavigation'; // If you have a global navigation service
      // if (remoteMessage.data?.screen) {
      //   navigate(remoteMessage.data.screen, remoteMessage.data);
      // }
    }
  });

  // Return a cleanup function to unsubscribe from all listeners
  return () => {
    unsubscribeForeground();
    unsubscribeOpenedApp();
    // No need to unsubscribe getInitialNotification as it's a one-time promise.
  };
};
