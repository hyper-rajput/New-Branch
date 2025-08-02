import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {forgotPasswordApi} from "../services/api"

// Assume forgotPasswordApi is imported or defined somewhere
// import { forgotPasswordApi } from "../api/auth"; // Example import

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      // Call the actual forgotPasswordApi
      const response = await forgotPasswordApi(email);
      Alert.alert(
        "Success",
        (typeof response === "string" ? response : JSON.stringify(response)) +
          "\n\nIf you can't see the email, please check your spam or junk folder."
      );
    } catch (error) {
      Alert.alert("Error", "Failed to send reset link. Please try again.");
      console.error("Send code error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3B82F6" style={{ transform: [{ scale: 1.5 }] }} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "center", width: "100%" }}
        >
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive a reset link.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity style={styles.button} onPress={handleSendCode}>
              <Text style={styles.buttonText}>Send Reset Link</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
              <Text style={styles.backText}>
                Back to <Text style={styles.highlight}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "black",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#3B82F6",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  backText: {
    marginTop: 15,
    fontSize: 14,
    color: "#6B7280",
  },
  highlight: {
    color: "#3B82F6",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#3B82F6",
  },
});

export default ForgotPasswordScreen;
