import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView, // Corrected import
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from "axios";
import EncryptedStorage from 'react-native-encrypted-storage';



// Define types for medicine data
interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: Date;
  duration: Date;
  amountPerBox: number;
  currentQuantity: number;
  enableTakeAlert: boolean;
  ringPhone: boolean;
  sendMessage: boolean;
  refillReminder: boolean;
  refillDays: number;
  refillDate: Date;
  startFromToday: boolean;
  initialQuantity?: number;
  dailyIntake?: number;
  response?: string;
}

// Use SafeAreaView from react-native with platform handling
const SafeAreaComponent = Platform.OS === "ios" ? SafeAreaView : View;

const FamilySchedule: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const getAuthTokens = async () => {
  try {
    const tokens = await EncryptedStorage.getItem("authTokens");
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error("Failed to retrieve auth tokens:", error);
    return null;
  }
};
  const BASE_URL = "http://lumia-env.eba-smvczc8e.us-east-1.elasticbeanstalk.com";
  
  const api = axios.create({
    baseURL: BASE_URL,
    timeout: 5000, // 5 seconds timeout
  });
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
const [childName, setChildName] = useState<string>("");
const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const tokens = await EncryptedStorage.getItem("authTokens");
      const idToken = tokens ? JSON.parse(tokens).idToken : null;
      // You may want to get child_id from route.params or another source
      const child_id = route.params?.child_id || "CHILD_CUSTOM_UID";
      const response = await axios.post(
        `${BASE_URL}/get-child-reminders-with-status`,
        { idToken, child_id }
      );
      if (response.data && response.data.status === "success") {
        
        setChildName(response.data.child_name || "");
        setMedicines(mapApiRemindersToMedicines(response.data.reminders || []));
      } else {
        setMedicines([]);
        setChildName("");
      }
    } catch (error) {
      setMedicines([]);
      setChildName("");
      Alert.alert("Error", "Failed to fetch medicine reminders.");
    } finally {
      setLoading(false);
    }
  };
  fetchMedicines();
}, []);


  const renderMedicine = ({ item }: { item: Medicine }) => (
    <View style={styles.memberContainer}>
      <View style={styles.medicineHeader}>
        <Icon name="local-pharmacy" size={24} color="#00351D" style={styles.medicineIcon} />
        <Text style={styles.memberText}>{item.name}</Text>
      </View>
      <Text style={styles.statusText}>Dosage: {item.dosage}</Text>
      <Text style={styles.statusText}>
        Time: {item.time ? item.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not set"}
      </Text>
      <Text style={styles.statusText}>
        Until: {item.duration ? item.duration.toLocaleDateString() : "Not set"}
      </Text>
      <Text style={styles.statusText}>
        Quantity: {item.currentQuantity}/{item.amountPerBox}
      </Text>
      {item.refillReminder && (
        <Text style={styles.statusText}>
          Refill: {item.refillDate ? item.refillDate.toLocaleDateString() : "Not set"} ({item.refillDays} days before)
        </Text>
      )}
      <Text style={styles.statusText}>
        Taken Today: {item.response}
      </Text>
      <View style={styles.buttonContainer}>

      </View>
    </View>
  );

  return (
    <SafeAreaComponent style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={28} color="#2E2E2E" />
            </TouchableOpacity>
            <Text style={styles.header}>Medicine Schedule</Text>
          </View>
          <View style={styles.medicineListContainer}>
            <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#1F2A44', textAlign: 'center'}}>
              {childName ? `${childName}'s Medicine Reminders` : 'Medicine Reminders'}
            </Text>
            {loading ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : medicines.length === 0 ? (
              <Text style={styles.emptyText}>No medicines added yet.</Text>
            ) : (
              medicines.map((item) => <View key={item.id}>{renderMedicine({ item })}</View>)
            )}
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaComponent>
  );
};

// Helper to map API response to Medicine[]
const mapApiRemindersToMedicines = (apiReminders: any[]): Medicine[] => {
  return apiReminders.map((item) => ({
    id: item.reminder_id || item.medicine_name?.toLowerCase() || Math.random().toString(36).substr(2, 9),
    name: item.medicine_name || '',
    dosage: item.pill_details || '',
    time: item.time ? new Date(item.time) : (item.take_medicine_alert && item.take_medicine_alert !== 'true' && item.take_medicine_alert !== 'false' ? parseTimeString(item.take_medicine_alert) : new Date()),
    duration: item.end_date ? new Date(item.end_date) : new Date(),
    amountPerBox: parseInt(item.amount_per_box) || 10,
    currentQuantity: item.current_quantity ? parseInt(item.current_quantity) : 10,
    enableTakeAlert: item.take_medicine_alert === 'true' || (typeof item.take_medicine_alert === 'string' && /^\d{2}:\d{2}$/.test(item.take_medicine_alert)),
    ringPhone: item.ring_phone === 'true',
    sendMessage: item.send_message === 'true' || typeof item.send_message === 'string',
    refillReminder: item.refill_reminder === 'true',
    refillDays: item.set_day_before_refill ? parseInt(item.set_day_before_refill) : 3,
    refillDate: item.set_refill_date ? new Date(item.set_refill_date) : (item.reminder_date ? new Date(item.reminder_date) : new Date()),
    startFromToday: item.start_from_today === 'true',
    initialQuantity: item.current_quantity ? parseInt(item.current_quantity) : undefined,
    dailyIntake: undefined, // Not present in API, can be set if needed
    response: item.response || '', // Map response field
  }));
};

// Helper to parse time string (e.g., '08:00') to Date object (today's date with that time)
function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2A44',
    flex: 1,
  },
  formContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 8,
  },
  inputIcon: {
    marginLeft: 10,
  },
  inputWithIcon: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: '#1F2A44',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  timeContent: {
    marginLeft: 10,
    flex: 1,
  },
  timeLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 16,
    color: '#1F2A44',
    marginTop: 2,
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doneButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sliderContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    width: '100%',
  },
  sliderLabel: {
    fontSize: 16,
    color: '#1F2A44',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  notificationSettings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationLabel: {
    fontSize: 16,
    color: '#1F2A44',
  },
  addButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  medicineListContainer: {
    marginTop: 16,
  },
  memberContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicineIcon: {
    marginRight: 8,
  },
  memberText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2A44',
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  approveButton: {
    backgroundColor: '#16A34A',
  },
  denyButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmationText: {
    fontSize: 14,
    color: '#16A34A',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default FamilySchedule;