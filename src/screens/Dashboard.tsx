import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import Voice from "@react-native-voice/voice";
import { ActivityIndicator } from "react-native";

const Dashboard = ({ navigation }) => {
  const [lastFeedbackTime, setLastFeedbackTime] = useState(null);
  const [proactivePrompt, setProactivePrompt] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");

  // Function to store the user's response and timestamp
  const storeFeedback = async (response:any) => {
    try {
      const timestamp = new Date().toLocaleString();
      await AsyncStorage.setItem("latestInteraction", response);
      await AsyncStorage.setItem("lastResponseTime", timestamp);
      console.log("Stored feedback:", response, "at", timestamp);
    } catch (error) {
      console.error("Error storing feedback:", error);
    }
  };

  useEffect(() => {
  Voice.onSpeechResults = onSpeechResultsHandler;
  Voice.onSpeechError = onSpeechErrorHandler;

  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
}, []);

const onSpeechResultsHandler = (e:any) => {
  const text = e.value[0];
  setRecognizedText(text);
//   sendToBackend(text);
    Alert.alert(text);
  setIsListening(false);
};

const onSpeechErrorHandler = (e:any) => {
  console.error("Speech recognition error: ", e);
  Alert.alert("Error", "Could not recognize speech. Try again.");
  setIsListening(false);
};

const startListening = async () => {
  try {
    setIsListening(true);
    setRecognizedText("");
    await Voice.start("en-US");
  } catch (error) {
    console.error("Voice start error: ", error);
    setIsListening(false);
  }
};

const sendToBackend = async (text: string) => {
  try {
    const response = await fetch("https://your-api-endpoint.com/voice-input", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: text }),
    });

    const data = await response.json();
    console.log("Backend response:", data);
    Alert.alert("Response", data.reply || "Got it!");
  } catch (error) {
    console.error("Error sending to backend:", error);
    Alert.alert("Error", "Failed to send to backend");
  }
};

  // Feedback check every 4 hours
  useEffect(() => {
    const checkFeedback = () => {
      const now = new Date();
      if (lastFeedbackTime && now - lastFeedbackTime >= 4 * 60 * 60 * 1000) {
        Alert.alert(
          "How Are You?",
          "Hello! How are you feeling right now?",
          [
            {
              text: "Good",
              onPress: () => {
                console.log("Good");
                storeFeedback("I’m feeling good");
              },
            },
            {
              text: "Okay",
              onPress: () => {
                console.log("Okay");
                storeFeedback("I’m feeling okay");
              },
            },
            {
              text: "Not Great",
              onPress: () => {
                console.log("Not Great");
                storeFeedback("I’m not feeling great");
              },
            },
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

  // Proactive prompts every 30 seconds (for demo purposes)
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
    }, 30000); // 30 seconds for demo; adjust as needed

    return () => clearInterval(interval);
  }, []);

  // Handle prompt responses
  const handlePromptResponse = (action, response) => {
    if (action === "suggestWalk") {
      if (response === "yes") {
        Alert.alert("Great!", "Let’s plan a short walk. I’ll remind you in 10 minutes.");
      } else {
        Alert.alert("Okay", "Maybe later! Let me know if you change your mind.");
      }
    } else if (action === "suggestMusic") {
      if (response === "yes") {
        navigation.navigate("Music");
      } else {
        Alert.alert("Okay", "Let me know if you’d like to listen to music later!");
      }
    } else if (action === "suggestContact") {
      if (response === "yes") {
        navigation.navigate("Call");
      } else {
        Alert.alert("Okay", "I’ll check back later!");
      }
    } else if (action === "suggestMessages") {
      if (response === "yes") {
        navigation.navigate("Messages");
      } else {
        Alert.alert("Okay", "You can check your messages later!");
      }
    }
    setProactivePrompt(null);
  };

  // Sample reminder data
  const reminders = [
    {
      id: "1",
      title: "Take your medicine",
      subtitle: "9:00 A.M. Blood Pressure",
      icon: "local-pharmacy",
    },
    {
      id: "2",
      title: "Morning walk",
      subtitle: "10:00 AM - 15 minutes",
      icon: "directions-walk",
    },
    {
      id: "3",
      title: "TG5",
      subtitle: "11:00 AM - 60 minutes",
      icon: "tv",
    },
  ];

  // Render each reminder item
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
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("Menu")}
        >
          <Icon name="menu" size={35} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Icon name="account-circle" size={35} color="#333" />
        </TouchableOpacity>
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

      {/* Placeholder for the blurred card number */}
      <Text style={styles.cardNumber}>xxxxxxxxxxxxxxxxxxxx</Text>

      {/* Proactive Prompt */}
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

      {/* Microphone and Surrounding Icons Section */}
      <View style={styles.iconContainer}>
        {/* Microphone Button */}
        <TouchableOpacity
        style={styles.microphoneButton}
        onPress={startListening}
        disabled={isListening}
        >
        {isListening ? (
            <ActivityIndicator size="large" color="#000" />
        ) : (
            <Icon name="mic" size={50} color="#000" />
        )}
        </TouchableOpacity>

        {/* Row of Buttons (Music, Call, Message) */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.smallButton, styles.musicButton]}
            onPress={() => navigation.navigate("Music")}
          >
            <Icon name="headset" size={45} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.callButton]}
            onPress={() => navigation.navigate("Call")}
          >
            <Icon name="call" size={45} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.messageButton]}
            onPress={() => navigation.navigate("Messages")}
          >
            <Icon name="chat" size={45} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reminder List */}
      <FlatList
        data={reminders}
        renderItem={renderReminder}
        keyExtractor={(item) => item.id}
        style={styles.reminderList}
      />
    </SafeAreaView>
  );
};

// Get screen width for dynamic sizing
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
    width: 80,
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
  musicButton: {},
  callButton: {},
  messageButton: {},
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
});

export default Dashboard;