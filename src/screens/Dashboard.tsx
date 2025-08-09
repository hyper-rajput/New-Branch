import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, FlatList, Dimensions, Platform, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native";
import Voice from "@react-native-community/voice";
import Tts from 'react-native-tts';
import {initializeNotifications} from '../services/NotificationService';
import {fetchAndStoreUserDetails,generateTodoApi, getWeatherApi} from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import Geolocation from 'react-native-geolocation-service';
const { PermissionsAndroid } = require('react-native');
import { getAuthTokens } from '../services/api'; // Adjust the import path as necessary

const Dashboard = ({ navigation  }) => {
  const [lastFeedbackTime, setLastFeedbackTime] = useState(null);
  const [proactivePrompt, setProactivePrompt] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");

  const [Name, setName] = useState("Hey, User");  // Hardcoded for design match
  const VOICE_ASSISTANT_API_URL = "https://zupkiai.onrender.com/proactive-talk"; // EXAMPLE URL
  
  useEffect(() => {
    fetchAndStoreUserDetails();
    
    // Initialize notifications and get the cleanup function
    const unsubscribeNotifications = initializeNotifications();

    // Clean up listeners when the component unmounts
    return () => {
      unsubscribeNotifications();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  useEffect(() => {
    const initializeAppData = async () => {
      // First, fetch and store user details
      await fetchAndStoreUserDetails();

      // Then, fetch user data from AsyncStorage to set the name
      try {
        const userDetailsString = await AsyncStorage.getItem("userDetails");
        if (userDetailsString) {
          const userDetails = JSON.parse(userDetailsString);
          userDetails.name ? setName(`Hey, ${userDetails.name}`) :null ;
        } else {
          setName("Hey there!"); // Fallback if user details are not found
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setName("Hello!"); // Fallback on error
      }

      // Initialize notifications and get the cleanup function
      const unsubscribeNotifications = initializeNotifications();

      // Clean up listeners when the component unmounts
      return () => {
        unsubscribeNotifications();
      };
    };

    initializeAppData();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // useEffect(() => {
  //   if (remoteMessage){
  //     sendVoiceCommandToBackend(`Ask user-,${remoteMessage}`)
  //   }
  // }, [remoteMessage]);


  // Initialize TTS
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Tts.setDefaultLanguage('en-US');
      Tts.setDefaultRate(0.5);

      Tts.addEventListener('tts-start', (event) => console.log('TTS Start', event));
      Tts.addEventListener('tts-finish', (event) => console.log('TTS Finish', event));
      Tts.addEventListener('tts-cancel', (event) => console.log('TTS Cancel', event));
    }

    return () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Tts.stop();
      }
    };
  }, []);

  const storeFeedback = async (response: any) => {
    try {
      const timestamp = new Date().toLocaleString();
      await AsyncStorage.setItem("latestInteraction", response);
      await AsyncStorage.setItem("lastResponseTime", timestamp);
    } catch (error) {
      console.error("Error storing feedback:", error);
    }
  };

  const onSpeechStart = useCallback((e) => {
    setIsListening(true);
    setRecognizedText("");
    setIsProcessingVoice(false);
  }, []);

  const onSpeechEnd = useCallback((e) => {
    setIsListening(false);
    // Voice.destroy() is usually called AFTER processing the speech result
    // or when the component unmounts. Not typically right after onSpeechEnd,
    // as you might still need to retrieve results.
  }, []);

  const onSpeechResults = useCallback((e) => {
    if (e.value && e.value.length > 0) {
      const text = e.value[0];
      setRecognizedText(text);
      sendVoiceCommandToBackend(text);
    } else {
      Alert.alert("No speech recognized", "Please try speaking more clearly.");
      Tts.speak("I didn't catch that. Could you please repeat?");
      // If no speech recognized, we can destroy to reset the engine for the next attempt
      Voice.destroy().catch(err => console.error("Error destroying Voice after no speech results:", err));
    }
  }, []);

  const onSpeechError = useCallback((e) => {
    setIsListening(false);
    setIsProcessingVoice(false);

    // Crucially, destroy the Voice instance on error to reset its state
    // This is the most likely place where the "every second time" error is resolved.
    Voice.destroy();
    Tts.speak("I'm sorry, Could not understand your speech. Please try speaking again.");
  }, []);

  // Voice Assistant Hooks and Functions
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
    }

    return () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Correct way to remove all listeners and destroy Voice
        Voice.destroy().catch(err => console.error("Error destroying Voice on unmount:", err));
        // Voice.removeAllListeners() is typically called after destroy.
        // It's also safe to call it directly.
        Voice.removeAllListeners();
      }
    };
  }, [onSpeechStart, onSpeechEnd, onSpeechResults, onSpeechError]); // Depend on memoized callbacks

  const startListening = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      Alert.alert("Unsupported", "Voice recognition is only supported on iOS and Android devices.");
      return;
    }

    // Microphone permission check
    let hasPermission = true;
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "This app needs access to your microphone to recognize your speech.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn("Permission error:", err);
        hasPermission = false;
      }
    } else if (Platform.OS === 'ios') {
      // iOS: Voice.start will prompt for permission if not already granted
      // Optionally, you can use react-native-permissions for a more robust check
      hasPermission = true;
    }

    if (!hasPermission) {
      Alert.alert("Permission Denied", "Microphone permission is required to use voice recognition.");
      return;
    }

    if (!isListening) {
      try {
        // Always destroy before starting to ensure a clean slate.
        await Voice.destroy().catch(err => console.error("Error destroying Voice before new session:", err));
        Voice.removeAllListeners();

        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

        Tts.stop();
        setRecognizedText("");
        setIsProcessingVoice(false);

        await Voice.start("en-US");
      } catch (error) {
        console.error("Error starting speech recognition: ", error);
        setIsListening(false);
        setIsProcessingVoice(false);
        Alert.alert("Error", "Failed to start speech recognition. Please check microphone permissions.");
        Tts.speak("I couldn't start listening. Please check your microphone permissions.");
      }
    }
  };

    const stopListening = async () => {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
      try {
        await Voice.stop();
        setIsListening(false);
        console.log("Stopped listening.");
      } catch (error) {
        console.error("Error stopping speech recognition: ", error);
      }
  };

  // Function to send voice command to backend and handle response
  const sendVoiceCommandToBackend = async (command) => {
    setIsProcessingVoice(true);
    console.log("Sending command to backend:", command);
      const tokens = await getAuthTokens();
      const idToken = tokens?.idToken;

      if (!idToken) {
        Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
        throw new Error("ID token not available.");
      }

    try {
      const response = await fetch(VOICE_ASSISTANT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reply: command,
          idToken:idToken
        }),
      });
      console.log("Backend response status:", response.status);

      if (!response.ok) {
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson && errorJson.detail) {
            errorDetail += ` - Detail: ${errorJson.detail}`;
          }
        } catch (jsonError) {
          console.warn("Could not parse error JSON:", jsonError);
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      console.log("Backend response:", data);

      const responseText = data.response || "I didn't get a clear response from the server.";

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Tts.speak(responseText);
      }

    } catch (error) {
      console.error("Error sending voice command to backend:", error);
      Alert.alert("Communication Error", `Could not connect to the voice assistant service: ${error.message}`);
      Tts.speak("I'm sorry, I'm having trouble connecting to my service. Please try again later.");
    } finally {
      setIsProcessingVoice(false);
      // Destroy Voice after backend processing is complete to reset for the next user interaction
      Voice.destroy().catch(err => console.error("Error destroying Voice after backend call:", err));
      Voice.removeAllListeners(); // Clean up listeners after destroy
    }
  };

  useEffect(() => {
    const checkFeedback = () => {
      const now = new Date();
      if (lastFeedbackTime && now.getTime() - lastFeedbackTime >= 4 * 60 * 60 * 1000) {
        Alert.alert(
          "How Are You?",
          "Hello! How are you feeling right now?",
          [
            { text: "Good", onPress: () => storeFeedback("I’m feeling good") },
            { text: "Okay", onPress: () => storeFeedback("I’m feeling okay") },
            { text: "Not Great", onPress: () => storeFeedback("I’m not feeling great") },
          ]
        );
        setLastFeedbackTime(now);
      }
    };

    if (!lastFeedbackTime) {
      setLastFeedbackTime(new Date());
    }

    const interval = setInterval(checkFeedback, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lastFeedbackTime]);



  const handlePromptResponse = (action, response) => {
    if (action === "suggestWalk") {
      response === "yes"
        ? Alert.alert("Great!", "Let’s plan a short walk. I’ll remind you in 10 minutes.")
        : Alert.alert("Okay", "Maybe later!");
    } else if (action === "suggestMusic") {
      response === "yes" ? navigation.navigate("Music") : Alert.alert("Okay", "Let me know later!");
    } else if (action === "suggestContact") {
      response === "yes" ? navigation.navigate("Call") : Alert.alert("Okay", "I’ll check back later!");
    } else if (action === "suggestMessages") {
      response === "yes" ? navigation.navigate("Messages") : Alert.alert("Okay", "Check your messages later!");
    }
    setProactivePrompt(null);
  };

  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const storedTodosString = await AsyncStorage.getItem("todos");
        const storedTodosDate = await AsyncStorage.getItem("todosDate");

        let todosData = null;

        if (storedTodosString && storedTodosDate === today) {
          // Use cached todos
          todosData = JSON.parse(storedTodosString);
        } else {
          // Fetch new todos and cache them
          const response = await generateTodoApi();
          todosData = response;
          await AsyncStorage.setItem("todos", JSON.stringify(response));
          await AsyncStorage.setItem("todosDate", today);
        }

        // Get current hour
        const now = new Date();
        const hour = now.getHours();

        // Determine current period
        let currentPeriod = "";
        if (hour >= 5 && hour < 12) {
          currentPeriod = "morning";
        } else if (hour >= 12 && hour < 18) {
          currentPeriod = "evening";
        } else {
          currentPeriod = "night";
        }

        // Only include current and future periods
        const periodOrder = ["morning", "evening", "night"];
        const currentIndex = periodOrder.indexOf(currentPeriod);
        const periodsToShow = periodOrder.slice(currentIndex);

        let allTodos = [];
        periodsToShow.forEach(period => {
          if (todosData[period]) {
            todosData[period].forEach(todo => {
              allTodos.push({
                id: `${period}-${todo["to-do-list"]}-${todo.time}`,
                title: todo["to-do-list"],
                subtitle: `(${period.charAt(0).toUpperCase() + period.slice(1)})`,
                icon: "check-circle",
                period,
              });
            });
          }
        });

        // Sort by period order, then by time
        allTodos.sort((a, b) => {
          const periodCmp = periodsToShow.indexOf(a.period) - periodsToShow.indexOf(b.period);
          if (periodCmp !== 0) return periodCmp;
          const t1 = a.subtitle.match(/\d{2}:\d{2}/)?.[0] || "";
          const t2 = b.subtitle.match(/\d{2}:\d{2}/)?.[0] || "";
          return t1.localeCompare(t2);
        });

        setReminders(allTodos);
      } catch (e) {
        console.error("Failed to fetch todos", e);
        setReminders([]);
      }
    };
    fetchTodos();
  }, []);

  // Add a title above the reminders list



  
  useEffect(() => {

        onAppResume();
    
  }, []);

  const onAppResume = async () => {
    const now = Date.now();

    const lastOpened = await AsyncStorage.getItem('last_opened');
    const openCountRaw = await AsyncStorage.getItem('open_count');
    const openCount = openCountRaw ? parseInt(openCountRaw, 10) : 0;

    const hoursSinceLast = lastOpened ? (now - parseInt(lastOpened)) / (1000 * 60 * 60) : Infinity;
    const currentHour = new Date().getHours();

    let message: string | null = null;

    // Inactivity trigger

      message = ' ';
      await sendVoiceCommandToBackend(message);
    

    await AsyncStorage.setItem('last_opened', now.toString());
  };

  useFocusEffect(
    useCallback(() => {
      // On focus: do nothing
      return () => {
        // On unfocus: stop voice and TTS
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          Voice.destroy().catch(err => console.error('Error destroying Voice on unfocus:', err));
          Voice.removeAllListeners();
          Tts.stop();
        }
      };
    }, [])
  );

  useEffect(() => {
    const beforeRemoveListener = (e: any) => {
      e.preventDefault();
      BackHandler.exitApp(); // Close the app if user tries to go back
    };
    navigation.addListener('beforeRemove', beforeRemoveListener);
    return () => navigation.removeListener('beforeRemove', beforeRemoveListener);
  }, [navigation]);

  useEffect(() => {
    const getLocationAndSend = async () => {
      let hasPermission = false;
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to provide personalized services.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else if (Platform.OS === 'ios') {
        // iOS: Geolocation.requestAuthorization() can be used, but Geolocation.getCurrentPosition will prompt if not granted
        hasPermission = true;
      }
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location permission is required for this feature.');
        return;
      }
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {

            await getWeatherApi(latitude, longitude);
          } catch (error) {
            console.error('Error sending location to backend:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          Alert.alert('Location Error', 'Could not fetch your location.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };
    getLocationAndSend();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar with logo and small profile button */}
      <View style={styles.topBarNew}>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate("ProfileScreen")}> 
          <Icon name="person" size={32} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logoRowNew}>
          <Icon name="favorite" size={28} color="#F47C4B" style={{marginRight: 6}} />
          <Text style={styles.appName}>CareMitra</Text>
        </View>
      </View>

      {/* Greeting */}
      <Text style={styles.greetingNew}>{Name}</Text>

      {/* Main cards grid with new options */}
      <View style={styles.cardGridNew}>
        <TouchableOpacity style={[styles.cardNew, styles.medicationCardNew]} onPress={() => navigation.navigate("MedicationReminder")}> 
          <Icon name="medication" size={40} color="#2B6E53" />
          <Text style={styles.cardTextNew}>Medication</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardNew, styles.familyCardNew]} onPress={() => navigation.navigate("FamilyMemberScreen")}> 
          <Icon name="diversity-3" size={40} color="#2B4B3A" />
          <Text style={styles.cardTextNew}>Family</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardNew, styles.healthCardNew]} onPress={() => navigation.navigate("HealthTrackingScreen")}> 
          <Icon name="favorite" size={40} color="#3A5E8C" />
          <Text style={styles.cardTextNew}>Health</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardNew, styles.chatCardNew]} onPress={() => navigation.navigate("MessagesScreen")}> 
          <Icon name="chat" size={40} color="#F47C4B" />
          <Text style={styles.cardTextNew}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardNew, styles.taskCardNew]} onPress={() => navigation.navigate("TaskReminderScreen")}> 
          <Icon name="event-note" size={40} color="#4B5E7A" />
          <Text style={styles.cardTextNew}>Task Reminder</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardNew, styles.callCardNew]} onPress={() => navigation.navigate("AutoCallScreen")}> 
          <Icon name="call" size={40} color="#2B6E53" />
          <Text style={styles.cardTextNew}>Auto Call</Text>
        </TouchableOpacity>
      </View>

      {/* Large Microphone Button at the bottom */}
      <View style={styles.bottomMicRow}>
        <TouchableOpacity  style={[styles.bottomMicButton, isListening ? { borderColor: "red" } : {}]} onPress={startListening} disabled={isProcessingVoice} >
          {isProcessingVoice ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <Icon name="mic" size={72} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7E3',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  topBarNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2B2B2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  logoRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B2B2B',
    letterSpacing: 0.5,
  },
  greetingNew: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginLeft: 24,
    marginBottom: 12,
    marginTop: 0,
  },
  cardGridNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: 0,
    marginBottom: 18,
  },
  cardNew: {
    width: 120,
    height: 100,
    borderRadius: 18,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3EAF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medicationCardNew: {
    backgroundColor: '#D6F2E6',
  },
  familyCardNew: {
    backgroundColor: '#E6F2D6',
  },
  healthCardNew: {
    backgroundColor: '#D6E6F2',
  },
  chatCardNew: {
    backgroundColor: '#FCE5D6',
  },
  taskCardNew: {
    backgroundColor: '#E3EAF6',
  },
  cardTextNew: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomMicRow: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    marginBottom: 32,
  },
  bottomMicButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2B2B2B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  callCardNew: {
    backgroundColor: '#F2E6D6',
  },
});

// Helper for icon background color
function getTodoIconBg(icon: string) {
  switch (icon) {
    case 'notifications':
      return '#FECF6A';
    case 'medication':
      return '#7AC7C4';
    case 'call':
      return '#7AC77A';
    default:
      return '#B0B0B0';
  }
}

export default Dashboard;