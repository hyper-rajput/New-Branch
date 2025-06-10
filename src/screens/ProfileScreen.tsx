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
import { logout } from "../services/api";

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    dob: "",
    phone: "",
    address: "",
    height: "",
    weight: "",
    bloodGroup: "",
    hobby: "",
    emergencyContact: "",
    medication: "",
    medicalHistory: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDetailsString = await AsyncStorage.getItem("userDetails");
        if (userDetailsString) {
          const userDetails = JSON.parse(userDetailsString);

          const {
            name,
            email,
            dob,
            phone,
            address,
            height,
            weight,
            bloodGroup,
            hobby,
            customHobby,
            emergencyContact,
            medName,
            medDosage,
            medicalHistory,
            customMedicalHistory,
          } = userDetails;

          const computedHobby = hobby === "Other" ? customHobby : hobby;
          const computedMedication = medName && medDosage ? `${medName} - ${medDosage}` : "None";
          const computedMedicalHistory = medicalHistory
            ? medicalHistory + (customMedicalHistory ? ` - ${customMedicalHistory}` : "")
            : customMedicalHistory || "None";

          setUserData({
            name: name || "Not set",
            email: email || "Not set",
            dob: dob || "Not set",
            phone: phone || "Not set",
            address: address || "Not set",
            height: height || "Not set",
            weight: weight || "Not set",
            bloodGroup: bloodGroup || "Not set",
            hobby: computedHobby || "Not set",
            emergencyContact: emergencyContact || "None",
            medication: computedMedication,
            medicalHistory: computedMedicalHistory,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace("LoginScreen");
    } catch (error) {
      Alert.alert("Error", "Failed to logout. Try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Icon name="account-circle" size={100} color="#333" style={styles.avatar} />
      <Text style={styles.name}>{userData.name}</Text>
                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        {Object.entries(userData).map(([label, value]) => (
          <View key={label}>
            <Text style={styles.label}>
              {label.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
            </Text>
            <Text style={styles.info}>{value}</Text>
          </View>
        ))}
      </View>
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
    textTransform: "capitalize",
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
