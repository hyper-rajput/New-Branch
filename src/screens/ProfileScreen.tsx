import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import { logout } from "../services/api";
import { GlobalStyles, COLORS } from '../styles/GlobalStyles';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: "",
    uid: "",
    email: "",
    dob: "",
    phone: "",
    address: "",
    height: "",
    weight: "",
    bloodGroup: "",
    hobby: "",
    dietaryPreference: "",
    allergies: "",
    emergencyContact: "",
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
            uid,
            email,
            dob,
            phone,
            address,
            height,
            weight,
            bloodGroup,
            selectedInterests,
            dietaryPreference,
            allergies,
            emergencyContact,
            medicalHistory,
          } = userDetails;

          const computedHobby = Array.isArray(selectedInterests)
            ? selectedInterests.join(", ")
            : selectedInterests || "Not set";
          const computedAllergies = Array.isArray(allergies)
            ? allergies.join(", ")
            : allergies || "None";
          const computedMedicalHistory = medicalHistory || "None";

          setUserData({
            name: name || "Not set",
            uid: uid || "Not set",
            email: email || "Not set",
            dob: dob || "Not set",
            phone: phone || "Not set",
            address: address || "Not set",
            height: height || "Not set",
            weight: weight || "Not set",
            bloodGroup: bloodGroup || "Not set",
            hobby: computedHobby || "Not set",
            dietaryPreference: dietaryPreference || "Not set",
            allergies: computedAllergies,
            emergencyContact: emergencyContact || "None",
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
    <ScrollView contentContainerStyle={profileStyles.bgContainer}>
      {/* Back Button */}
      <View style={profileStyles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={profileStyles.backButton}>
          <Icon name="arrow-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <View style={profileStyles.cardContainer}>
        <Icon name="account-circle" size={100} color={COLORS.primary} style={profileStyles.avatar} />
        <Text style={profileStyles.name}>{userData.name}</Text>
        <View style={profileStyles.uidRow}>
          <Text style={profileStyles.uidText}>UID: {userData.uid}</Text>
          <TouchableOpacity
            onPress={() => {
              if (userData.uid !== "Not set") {
                import("react-native").then(({ Clipboard }) => {
                  Clipboard.setString(userData.uid);
                  Alert.alert("Copied", "UID copied to clipboard!");
                });
              }
            }}
            style={{ padding: 4 }}
          >
            <Icon name="content-copy" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={profileStyles.infoList}>
          {Object.entries(userData).map(([label, value]) => (
            <View key={label} style={profileStyles.infoCard}>
              <Text style={profileStyles.label}>
                {label.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
              </Text>
              <Text style={profileStyles.info}>{value}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={profileStyles.logoutButton} onPress={handleLogout}>
          <Text style={profileStyles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};



const profileStyles = StyleSheet.create({
  bgContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 0,
    alignItems: 'center',
    paddingBottom: 30,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: Platform.OS === 'ios' ? 0 : 10,
    paddingLeft: 10,
  },
  backButton: {
    marginLeft: 0,
    marginBottom: 0,
    padding: 4,
  },
  cardContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    marginTop: 10,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    marginBottom: 18,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 18,
    textAlign: 'center',
  },
  uidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  uidText: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
    fontWeight: '600',
  },
  infoList: {
    width: '100%',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  info: {
    fontSize: 15,
    color: '#666',
    marginTop: 1,
    paddingLeft: 2,
  },
  logoutButton: {
    backgroundColor: '#c62828',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 18,
    elevation: 3,
    marginTop: 10,
    marginBottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;
