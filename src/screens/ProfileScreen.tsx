import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    emergencyContact: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const name = await AsyncStorage.getItem("user_name");
        const email = await AsyncStorage.getItem("user_email");
        const emergencyContact = await AsyncStorage.getItem("emergency_contact");

        setUserData({
          name: name || "Name not set",
          email: email || "Email not set",
          emergencyContact: emergencyContact || "Emergency contact not set",
        });
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace("LoginScreen");
    } catch (error) {
      Alert.alert("Error", "Failed to logout. Try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Icon name="account-circle" size={100} color="#333" style={styles.avatar} />

      <Text style={styles.name}>{userData.name}</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.info}>{userData.email}</Text>

        <Text style={styles.label}>Emergency Contact</Text>
        <Text style={styles.info}>{userData.emergencyContact}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: "center",
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  avatar: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003087",
    marginBottom: 30,
  },
  infoContainer: {
    alignSelf: "stretch",
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
  },
  info: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
    paddingLeft: 5,
  },
  logoutButton: {
    backgroundColor: "#c62828",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
