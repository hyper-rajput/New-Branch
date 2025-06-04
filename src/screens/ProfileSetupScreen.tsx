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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [hobby, setHobby] = useState("");
  const [customHobby, setCustomHobby] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [customMedicalHistory, setCustomMedicalHistory] = useState("");

  const hobbyOptions = ["Walking", "Reading", "Gardening", "Knitting", "Puzzles", "Other"];
  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const medicalHistoryOptions = [
    "Diabetes",
    "High Blood Pressure",
    "Arthritis",
    "Heart Disease",
    "Asthma",
    "None",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!name || !dob) {
      Alert.alert("Oops!", "Please enter all required fields (Name and DOB).");
      return;
    }

    const profile = {
      name,
      dob,
      phone,
      address,
      height,
      weight,
      bloodGroup,
      hobby: hobby === "Other" ? customHobby : hobby,
      emergencyContact: emergencyContact || "None",
      medication: medName && medDosage ? `${medName} - ${medDosage}` : "None",
     medicalHistory: medicalHistory + (customMedicalHistory ? ` - ${customMedicalHistory}` : ""),

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
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#666"
              />

       {/* Address Field */}
<TextInput
  style={[styles.customInput, styles.multiLineInput]}
  placeholder="Enter your full address here"
  value={address}
  onChangeText={setAddress}
  placeholderTextColor="#666"
  multiline
  numberOfLines={4}
  textAlignVertical="top"
/>

{/* Height and Weight Fields Side by Side */}
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <TextInput
    style={[styles.customInput, { flex: 1, marginRight: 8 }]}
    placeholder="Height (cm)"
    value={height}
    onChangeText={setHeight}
    keyboardType="numeric"
    placeholderTextColor="#666"
  />
  <TextInput
    style={[styles.customInput, { flex: 1, marginLeft: 8 }]}
    placeholder="Weight (kg)"
    value={weight}
    onChangeText={setWeight}
    keyboardType="numeric"
    placeholderTextColor="#666"
  />
</View>


              <CustomDropdown
                label="Blood Group"
                value={bloodGroup}
                options={bloodGroupOptions}
                onSelect={setBloodGroup}
              />

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
                placeholder="Medication Name"
                value={medName}
                onChangeText={setMedName}
                placeholderTextColor="#666"
              />
              <TextInput
                style={styles.customInput}
                placeholder="Dosage"
                value={medDosage}
                onChangeText={setMedDosage}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medical History</Text>
              <CustomDropdown
                label="Select Condition"
                value={medicalHistory}
                options={medicalHistoryOptions}
                onSelect={setMedicalHistory}
              />
              
              <TextInput
  style={[styles.customInput, styles.multiLineInput]}
  placeholder="Describe your experience or specific condition (optional)"
  value={customMedicalHistory}
  onChangeText={setCustomMedicalHistory}
  placeholderTextColor="#666"
  multiline
  numberOfLines={4}
  textAlignVertical="top"
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
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2E2E2E",
  },
  customInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 14,
    color: "#2E2E2E",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    fontSize: 18,
    flex: 1,
  },
  multiLineInput: {
  height: 100,
  paddingVertical: 10,
}
,
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
  },
  dropdownText: {
    fontSize: 18,
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
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 18,
    color: "#2E2E2E",
  },

unitInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#DDD',
  borderRadius: 8,
  paddingHorizontal: 10,
  marginBottom: 12,
  backgroundColor: '#FFF',
},

unitInput: {
  fontSize: 16,
  paddingVertical: 12,
  color: '#2E2E2E',
},

unitLabel: {
  fontSize: 16,
  marginLeft: 6,
  color: '#555',
  fontWeight: '500',
},

  submitButton: {
    backgroundColor: "#FF7043",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
});

export default ProfileSetupScreen;
