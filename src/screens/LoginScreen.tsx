import React, { useState, useEffect } from "react";
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
import { loginUser, logout } from "../services/api";
import Ionicons from "react-native-vector-icons/Ionicons";


const LoginScreen = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFamilyMember, setIsFamilyMember] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    if (emailOrPhone && password) {
      setLoading(true);
      try {
        const account_type = isFamilyMember ? 'family' : 'child';
        const result = await loginUser(emailOrPhone, password, account_type);

        if (result.status === "success") {
          // Navigate to FamilyMemberProfileSetup if isFamilyMember is true, otherwise to Dashboard
          navigation.replace(isFamilyMember ? "FamilyMemberProfileSetup" : "Dashboard");
        } else {
          setLoading(false);
          }
      } catch (error) {
        setLoading(false);
          console.error("Login error:", error);
      }
    } else {
      Alert.alert("Email/Phone and password are required.");
    }
  };
  useEffect(() => {
    logout();
  });

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3B82F6"
            style={{ transform: [{ scale: 1.5 }] }} />
          <Text style={styles.loadingText}>Logging in...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "center", width: "100%" }}
        >
          <View style={styles.innerContainer}>
            <Text style={styles.title}>
              Welcome <Text style={styles.highlight}>Back!</Text>
            </Text>
            <Text style={styles.subtitle}>Our Journey to Well-being Continues Here.</Text>

            <TextInput
              style={styles.input}
              placeholder="Email or Phone Number"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setPasswordVisible((prev) => !prev)}
              >
                <Ionicons
                  name={passwordVisible ? "eye" : "eye-off"}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsFamilyMember((prev) => !prev)}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
            >
              <View
                style={{
                  height: 20,
                  width: 20,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: "#3B82F6",
                  backgroundColor: isFamilyMember ? "#3B82F6" : "transparent",
                  marginRight: 8,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {isFamilyMember && <Text style={{ color: "white", fontSize: 14 }}>✓</Text>}
              </View>
              <Text style={{ color: "#374151", fontSize: 14 }}>
                This account is for a family member
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Let's Begin</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("SignUpScreen")}>
              <Text style={styles.registerText}>
                New here? <Text style={styles.highlight}>Register now</Text>
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
    color: 'black',
  },
  highlight: {
    color: "#3B82F6",
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
  passwordContainer: {
    width: "100%",
    height: 50,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "black",
  },
  eyeButton: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    color: "#3B82F6",
    fontSize: 14,
    marginBottom: 20,
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
  registerText: {
    marginTop: 15,
    fontSize: 14,
    color: "#6B7280",
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

export default LoginScreen;