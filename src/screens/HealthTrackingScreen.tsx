import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Keyboard,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Custom Dropdown Component for Health Metrics
const CustomDropdown = ({ label, value, options, onSelect }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.dropdown} onPress={() => setVisible(true)}>
        <Text style={styles.dropdownText}>{value || label}</Text>
        <MaterialIcons name="arrow-drop-down" size={28} color="#2E2E2E" />
      </TouchableOpacity>
      <Modal transparent visible={visible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)}>
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

const HealthTrackingScreen = ({ navigation, route }) => {
  const [medicines, setMedicines] = useState(route.params?.medicines || []);
  const [medicineName, setMedicineName] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("");
  const [dailyIntake, setDailyIntake] = useState("");
  const [dosage, setDosage] = useState("");
  const [healthMetric, setHealthMetric] = useState({ type: "Heart Rate", value: "" });
  const [healthData, setHealthData] = useState([]);

  const metricOptions = ["Heart Rate", "Blood Pressure", "Glucose", "Weight", "Oxygen Level"];

  const addMedicine = () => {
    if (!medicineName || !initialQuantity || !dailyIntake || isNaN(initialQuantity) || isNaN(dailyIntake) || !dosage || isNaN(dosage)) {
      Alert.alert("Oops!", "Please fill in all fields with valid numbers (e.g., Dosage in mg).", [
        { text: "OK", style: "default" }
      ]);
      return;
    }

    const newMedicine = {
      id: `${medicineName.toLowerCase()}-${Date.now()}`,
      name: medicineName,
      initialQuantity: parseInt(initialQuantity),
      currentQuantity: parseInt(initialQuantity),
      dailyIntake: parseInt(dailyIntake),
      dosage: parseFloat(dosage),
      fromHealthTracking: true,
    };

    const updatedMedicines = [...medicines, newMedicine];
    setMedicines(updatedMedicines);
    Alert.alert("Success!", `${medicineName} has been added to your list.`, [
      { text: "OK", style: "default" }
    ]);
    resetForm();
    Keyboard.dismiss();
  };

  const resetForm = () => {
    setMedicineName("");
    setInitialQuantity("");
    setDailyIntake("");
    setDosage("");
  };

  const addHealthMetric = () => {
    if (!healthMetric.value || isNaN(healthMetric.value)) {
      Alert.alert("Oops!", `Please enter a valid number for ${healthMetric.type}.`, [
        { text: "OK", style: "default" }
      ]);
      return;
    }

    const newMetric = {
      id: Date.now(),
      type: healthMetric.type,
      value: parseFloat(healthMetric.value),
      timestamp: new Date().toLocaleString(),
    };

    setHealthData([...healthData, newMetric]);

    const abnormal = {
      "Heart Rate": newMetric.value < 30 || newMetric.value > 200,
      "Blood Pressure": newMetric.value < 80 || newMetric.value > 180,
      Glucose: newMetric.value < 70 || newMetric.value > 200,
      Weight: newMetric.value < 20 || newMetric.value > 300,
      "Oxygen Level": newMetric.value < 80 || newMetric.value > 100,
    };

    if (abnormal[healthMetric.type]) {
      Alert.alert("Warning!", `Your ${healthMetric.type} value seems unusual. Please consult your doctor.`, [
        { text: "OK", style: "default" }
      ]);
    }

    setHealthMetric({ type: "Heart Rate", value: "" });
    Keyboard.dismiss();
  };

  const deleteMedicine = (id) => {
    Alert.alert("Delete Medicine", "Are you sure you want to remove this medicine?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => setMedicines(medicines.filter((m) => m.id !== id)),
        style: "destructive",
      },
    ]);
  };

  const navigateToReminder = (medicine) => {
    navigation.navigate("MedicationReminder", {
      newMedicineFromHealth: {
        id: medicine.id,
        name: medicine.name,
        dosage: `${medicine.dailyIntake} pill(s) of ${medicine.dosage}mg`,
        initialQuantity: medicine.initialQuantity,
        currentQuantity: medicine.currentQuantity,
        dailyIntake: medicine.dailyIntake,
        fromHealthTracking: true,
      },
      medicines: medicines, // Pass the full medicines array
    });
  };

  // Dynamic icon mapping for health metrics
  const getMetricIcon = (type) => {
    const icons = {
      "Heart Rate": "favorite",
      "Blood Pressure": "monitor-heart",
      Glucose: "bloodtype",
      Weight: "scale",
      "Oxygen Level": "air",
    };
    return icons[type] || "favorite";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#2E2E2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Health Tracker</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a Medicine</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="medication" size={28} color="#D32F2F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Medicine Name"
              value={medicineName}
              onChangeText={setMedicineName}
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="medication" size={28} color="#D32F2F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Dosage (in mg)"
              keyboardType="numeric"
              value={dosage}
              onChangeText={setDosage}
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="inventory" size={28} color="#D32F2F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Initial Quantity"
              keyboardType="numeric"
              value={initialQuantity}
              onChangeText={setInitialQuantity}
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="medication" size={28} color="#D32F2F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Daily Intake"
              keyboardType="numeric"
              value={dailyIntake}
              onChangeText={setDailyIntake}
              placeholderTextColor="#666"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addMedicine}>
            <Text style={styles.addButtonText}>Add Medicine</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Track Health Metric</Text>
          <CustomDropdown
            label="Select Metric"
            value={healthMetric.type}
            options={metricOptions}
            onSelect={(type) => setHealthMetric({ ...healthMetric, type })}
          />
          <View style={styles.inputContainer}>
            <MaterialIcons name="favorite" size={28} color="#D32F2F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={`Enter ${healthMetric.type}`}
              keyboardType="numeric"
              value={healthMetric.value}
              onChangeText={(value) => setHealthMetric({ ...healthMetric, value })}
              placeholderTextColor="#666"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addHealthMetric}>
            <Text style={styles.addButtonText}>Save Health Metric</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Health History</Text>
          {healthData.length === 0 ? (
            <Text style={styles.emptyText}>No health metrics recorded yet.</Text>
          ) : (
            healthData.map((item) => (
              <View key={item.id} style={styles.metricItem}>
                <MaterialIcons name={getMetricIcon(item.type)} size={28} color="#D32F2F" style={styles.itemIcon} />
                <Text style={styles.metricText}>{item.type}: {item.value} ({item.timestamp})</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Medicines</Text>
          {medicines.length === 0 ? (
            <Text style={styles.emptyText}>No medicines added yet.</Text>
          ) : (
            medicines.map((item) => (
              <View key={item.id} style={styles.medicineItem}>
                <MaterialIcons name="medication" size={28} color="#D32F2F" style={styles.itemIcon} />
                <Text style={styles.medicineText}>
                  {item.name} ({item.dosage}mg) - {item.dailyIntake} pill/day
                </Text>
                <View style={styles.medicineActions}>
                  <TouchableOpacity onPress={() => navigateToReminder(item)} style={styles.actionButton}>
                    <MaterialIcons name="notifications" size={28} color="#0288D1" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteMedicine(item.id)} style={styles.actionButton}>
                    <MaterialIcons name="delete" size={28} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E1", // Warm cream background for comfort
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E2E2E",
  },
  headerPlaceholder: {
    width: 28, // Maintains balance in header layout
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
    color: "#2E2E2E",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  dropdownText: {
    fontSize: 18,
    color: "#2E2E2E",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 30,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 10,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalItemText: {
    fontSize: 18,
    color: "#2E2E2E",
  },
  addButton: {
    backgroundColor: "#0288D1",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  medicineItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemIcon: {
    marginRight: 12,
  },
  medicineText: {
    flex: 1,
    fontSize: 18,
    color: "#2E2E2E",
  },
  metricText: {
    flex: 1,
    fontSize: 18,
    color: "#2E2E2E",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
  },
  medicineActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 15,
  },
});

export default HealthTrackingScreen;