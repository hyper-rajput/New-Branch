import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, FlatList, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native";
import Voice from "@react-native-community/voice";
import Tts from 'react-native-tts';
import EncryptedStorage from 'react-native-encrypted-storage';
import {initializeNotifications} from '../services/NotificationService';


const Dashboard = ({ navigation }) => {
  const [lastFeedbackTime, setLastFeedbackTime] = useState(null);
  const [proactivePrompt, setProactivePrompt] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const VOICE_ASSISTANT_API_URL = "http://lumia-env.eba-smvczc8e.us-east-1.elasticbeanstalk.com/chat"; // EXAMPLE URL
  
  useEffect(() => {
    // Initialize notifications and get the cleanup function
    const unsubscribeNotifications = initializeNotifications();

    // Clean up listeners when the component unmounts
    return () => {
      unsubscribeNotifications();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

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
      console.log("Stored feedback:", response, "at", timestamp);
    } catch (error) {
      console.error("Error storing feedback:", error);
    }
  };

  const onSpeechStart = useCallback((e) => {
    console.log("onSpeechStart: ", e);
    setIsListening(true);
    setRecognizedText("");
    setIsProcessingVoice(false);
  }, []);

  const onSpeechEnd = useCallback((e) => {
    console.log("onSpeechEnd: ", e);
    setIsListening(false);
    // Voice.destroy() is usually called AFTER processing the speech result
    // or when the component unmounts. Not typically right after onSpeechEnd,
    // as you might still need to retrieve results.
  }, []);

  const onSpeechResults = useCallback((e) => {
    console.log("onSpeechResults: ", e);
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
    console.log("onSpeechError: ", e);
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
    if(!isListening){
      try {
        // Always destroy before starting to ensure a clean slate.
        // This is the key to preventing the "every second time" error.
        await Voice.destroy().catch(err => console.error("Error destroying Voice before new session:", err));
        Voice.removeAllListeners(); // Ensure all old listeners are truly gone

        // Re-add listeners just before starting, to ensure they are fresh
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

        Tts.stop();
        setRecognizedText("");
        setIsProcessingVoice(false);

        await Voice.start("en-US");
        console.log("Started listening...");
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

    const tokens = await EncryptedStorage.getItem("authTokens");
    let idToken = null;
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens);
        idToken = parsedTokens.idToken;
      } catch (e) {
        console.error("Failed to parse authTokens from EncryptedStorage", e);
      }
    }

    try {
      const response = await fetch(VOICE_ASSISTANT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: command,
          idToken:idToken
        }),
      });

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

  useEffect(() => {
    const prompts = [
      { message: "Good morning! The weather today is sunny, 72°F. Would you like to go for a walk?", action: "suggestWalk" },
      { message: "Would you like to listen to some music?", action: "suggestMusic" },
      { message: "It’s been a while since you talked to someone. Want me to suggest a contact?", action: "suggestContact" },
      { message: "You have new messages! Would you like to read them?", action: "suggestMessages" },
    ];

    const interval = setInterval(() => {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setProactivePrompt(randomPrompt);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  const reminders = [
    { id: "1", title: "Take your medicine", subtitle: "9:00 A.M. Blood Pressure", icon: "local-pharmacy" },
    { id: "2", title: "Morning walk", subtitle: "10:00 AM - 15 minutes", icon: "directions-walk" },
    { id: "3", title: "TG5", subtitle: "11:00 AM - 60 minutes", icon: "tv" },
  ];

  const renderReminder = ({ item }) => (
    <TouchableOpacity style={styles.reminderItem}>
      <Icon name={item.icon} size={30} color="#00351D" style={styles.reminderIcon} />
      <View style={styles.reminderTextContainer}>
        <Text style={styles.reminderTitle}>{item.title}</Text>
        <Text style={styles.reminderSubtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
    <View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.navigate("ProfileScreen")}>
    <Icon name="account-circle" size={35} color="#333" />
  </TouchableOpacity>

  <View style={{ width: 35 }} /> 

  <TouchableOpacity
    style={styles.headerButton}
    onPress={() => navigation.navigate("Notifications")}
  >
    <View style={styles.notificationIcon}>
      <Icon name="notifications" size={24} color="#333" />
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationBadgeText}>1</Text>
      </View>
    </View>
  </TouchableOpacity>
</View>


      <Text style={styles.cardNumber}>xxxxxxxxxxxxxxxxxxxx</Text>

      {proactivePrompt && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>{proactivePrompt.message}</Text>
          <View style={styles.promptButtons}>
            <TouchableOpacity
              style={styles.promptButton}
              onPress={() => handlePromptResponse(proactivePrompt.action, "yes")}
            >
              <Text style={styles.promptButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.promptButton}
              onPress={() => handlePromptResponse(proactivePrompt.action, "no")}
            >
              <Text style={styles.promptButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
{recognizedText ? (
        <View style={styles.recognizedTextContainer}>
          <Text style={styles.recognizedText}>You said: "{recognizedText}"</Text>
        </View>
      ) : null}

      {/* Microphone and Surrounding Icons Section */}
      <View style={styles.iconContainer}>
        {/* Microphone Button */}
        <TouchableOpacity
          style={[styles.microphoneButton, isListening ? { borderColor: "red" } : {}]}
          onPress={startListening}
          disabled={isProcessingVoice || (Platform.OS !== 'ios' && Platform.OS !== 'android')}
        >
          {isProcessingVoice ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <Icon name="mic" size={50} color={isListening ? 'red' : "#000"} />
          )}
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.smallButton, styles.familyButton]}
            onPress={() => navigation.navigate("FamilyMemberScreen")}
          >
            <Icon name="group" size={45} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.healthButton]}
            onPress={() => navigation.navigate("HealthTrackingScreen")}
          >
            <Icon name="health-and-safety" size={45} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.messageButton]}
            onPress={() => navigation.navigate("Messages")}
          >
            <Icon name="chat" size={45} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={reminders}
        renderItem={renderReminder}
        keyExtractor={(item) => item.id}
        style={styles.reminderList}
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerButton: {
    backgroundColor: "#FFF",
    width: 50,
    height: 50,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 6,
    borderColor: "#E6F0FA",
  },
  notificationIcon: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardNumber: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 2,
  },
  promptContainer: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promptText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  promptButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  promptButton: {
    backgroundColor: "#003087",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  promptButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    position: "relative",
    width: "100%",
    height: 220,
  },
  microphoneButton: {
    backgroundColor: "#FFF",
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 8,
    borderColor: "#E6F0FA",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  smallButton: {
    backgroundColor: "#FFF",
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 7,
    borderColor: "#E6F0FA",
    width: width * 0.333 - 20,
  },
  reminderList: {
    flex: 1,
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: "#E6F0FA",
    marginVertical: 5,
  },
  reminderIcon: {
    marginRight: 15,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textTransform: "uppercase",
  },
  reminderSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
    recognizedTextContainer: {
    backgroundColor: "#e0ffe0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  recognizedText: {
    fontSize: 16,
    color: "#006400",
    fontStyle: 'italic',
  },
});

export default Dashboard;