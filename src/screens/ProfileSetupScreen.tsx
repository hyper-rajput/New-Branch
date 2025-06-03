import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { saveUserDetails } from "../services/api";

const CustomDropdown = ({ label, value, options, onSelect }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => {
          Keyboard.dismiss();
          setVisible(true);
        }}
      >
        <Text style={styles.dropdownText}>{value || label}</Text>
        <MaterialIcons name="arrow-drop-down" size={28} color="#2E2E2E" />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalItem}
                onPress={() => {
                  onSelect(option);
                  setVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const ProfileSetupScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(2000, 0, 1));
  const [hobby, setHobby] = useState("");
  const [customHobby, setCustomHobby] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");

  const hobbyOptions = ["Walking", "Reading", "Gardening", "Knitting", "Puzzles", "Other"];

  const handleSubmit = async () => {
    if (!name || !dob) {
      Alert.alert("Oops!", "Please enter all required fields (Name and DOB).");
      return;
    }

    const profile = {
      name,
      dob,
      hobby: hobby === "Other" ? customHobby : hobby,
      emergencyContact: emergencyContact || "None",
      medication: medName && medDosage ? `${medName} - ${medDosage}` : "None",
    };

    try {
      await saveUserDetails(profile);
      Alert.alert("Success!", "Your profile has been saved!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Dashboard"),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Could not save profile.");
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString("en-US");
      setDob(formatted);
      setTempDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>✨ Tell Us About You ✨</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Information</Text>

              <TextInput
                style={styles.customInput}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#666"
              />

              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDatePicker(true);
                }}
                style={styles.inputContainer}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={28}
                  color="#D32F2F"
                  style={styles.inputIcon}
                />
                <Text style={[styles.input, { paddingVertical: 12, color: dob ? "#2E2E2E" : "#999" }]}>
                  {dob || "Select Date of Birth"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )}

              <TextInput
                style={styles.customInput}
                placeholder="Emergency Contact (Optional)"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                keyboardType="phone-pad"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Interests</Text>
              <CustomDropdown
                label="Favorite Hobby (Optional)"
                value={hobby}
                options={hobbyOptions}
                onSelect={setHobby}
              />
              {hobby === "Other" && (
                <TextInput
                  style={styles.customInput}
                  placeholder="Please enter your hobby"
                  value={customHobby}
                  onChangeText={setCustomHobby}
                  placeholderTextColor="#666"
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medication</Text>
              <TextInput
                style={styles.customInput}
                placeholder="Medication Name (e.g., Paracetamol)"
                value={medName}
                onChangeText={setMedName}
                placeholderTextColor="#666"
              />
              <TextInput
                style={styles.customInput}
                placeholder="Dosage (e.g., 625mg)"
                value={medDosage}
                onChangeText={setMedDosage}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save My Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E1",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFE082",
    borderWidth: 1,
    borderColor: "#FFB300",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E2E2E",
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 10,
    color: "#2E2E2E",
  },
  customInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: "#2E2E2E",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    fontSize: 16,
    flex: 1,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: "#2E2E2E",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 30,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
  },
  modalItem: {
    paddingVertical: 10,
  },
  modalItemText: {
    fontSize: 16,
    color: "#2E2E2E",
  },
  submitButton: {
    backgroundColor: "#FF7043",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default ProfileSetupScreen;
