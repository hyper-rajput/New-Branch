import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  SafeAreaView, // Corrected import
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from "axios";
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

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
}

// Use SafeAreaView from react-native with platform handling
const SafeAreaComponent = Platform.OS === "ios" ? SafeAreaView : View;

const MedicationReminder: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { newMedicineFromHealth } = route.params || {};

  const [medicineName, setMedicineName] = useState<string>("");
  const [dosage, setDosage] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [duration, setDuration] = useState<Date>(new Date());
  const [tempDuration, setTempDuration] = useState<Date>(new Date());
  const [amountPerBox, setAmountPerBox] = useState<number>(10);
  const [currentQuantity, setCurrentQuantity] = useState<number>(10);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [time, setTime] = useState<Date>(new Date());
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [enableTakeAlert, setEnableTakeAlert] = useState<boolean>(false);
  const [ringPhone, setRingPhone] = useState<boolean>(false);
  const [sendMessage, setSendMessage] = useState<boolean>(false);
  const [refillReminder, setRefillReminder] = useState<boolean>(false);
  const [refillDays, setRefillDays] = useState<number>(3);
  const [showRefillDatePicker, setShowRefillDatePicker] = useState<boolean>(false);
  const [refillDate, setRefillDate] = useState<Date>(new Date());
  const [tempRefillDate, setTempRefillDate] = useState<Date>(new Date());
  const [showRefillDaysPicker, setShowRefillDaysPicker] = useState<boolean>(false);
  const [refillReminderText, setRefillReminderText] = useState<string>("");
  const [startFromToday, setStartFromToday] = useState<boolean>(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sound, setSound] = useState<Sound | null>(null);

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
  
  const saveReminder = async (medicine:any) => {
    try {
      const tokens = await getAuthTokens();
      const idToken = tokens?.idToken;
  
      if (!idToken) {
        Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
        throw new Error("ID token not available.");
      }
      
  
  const payload = {
        idToken,
        reminder_id: medicine.id,
        medicine_name: medicine.name,
        pill_details: medicine.dosage,
        time: medicine.time.toISOString(),
        end_date: medicine.duration.toISOString(),
        amount_per_box: medicine.amountPerBox.toString(),
        current_quantity: medicine.currentQuantity.toString(),
        take_medicine_alert: medicine.enableTakeAlert.toString(),
        ring_phone: medicine.ringPhone.toString(),
        send_message: medicine.sendMessage.toString(),
        refill_reminder: medicine.refillReminder.toString(),
        set_day_before_refill: medicine.refillDays.toString(),
        set_refill_date: medicine.refillDate.toISOString(),
        start_from_today: medicine.startFromToday.toString(),
      };
  
      const response = await api.post("/save-medicine-reminder", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
  if (response.status !== 200) {
    Alert.alert("Server Error", "Unexpected response status: " + response.status);
  }
      return response.data;
    } catch (error) {
      Alert.alert("API call error (saveReminder)");
    }
  };

  // Pre-populate form fields with data from HealthTrackingScreen
  useEffect(() => {
    if (newMedicineFromHealth) {
      setMedicineName(newMedicineFromHealth.name || "");
      setDosage(newMedicineFromHealth.dosage || "");
      setAmountPerBox(newMedicineFromHealth.initialQuantity || 10);
      setCurrentQuantity(newMedicineFromHealth.currentQuantity || 10);

      // Prompt user to set reminder time
      Alert.alert("Set Reminder", "Please set the reminder time for your medicine.");
    }
  }, [newMedicineFromHealth]);

  // Notifee setup: channel, permissions, and action handler
  useEffect(() => {
    const setupNotifications = async () => {
      // Only setup notifications if user is logged in
      const tokens = await EncryptedStorage.getItem("authTokens");
      if (!tokens) return;
      if (Platform.OS === "android") {
        try {
          await notifee.createChannel({
            id: "alarm",
            name: "Alarm Channel",
            importance: AndroidImportance.HIGH,
            sound: "alarm",
            vibration: true,
            bypassDnd: true,
          });
        } catch (error) {
          console.error("Failed to create notification channel:", error);
          Alert.alert("Error", "Failed to set up notifications. Please try again.");
          return;
        }
      }
      const permission = await notifee.requestPermission();
      if (permission.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        Alert.alert("Permission Required", "Please enable notifications for reminders.");
        return;
      }

      // Handler for notification actions (Yes/No)
      const handleNotificationAction = async (detail: any) => {
        const { pressAction, notification } = detail;
        const medicineId: any = notification?.data?.medicineId;
        const medicineName: any = notification?.data?.medicineName;
        if (pressAction?.id === 'yes' || pressAction?.id === 'no') {
          const response = pressAction.id;
          await sendReminderResponse({
            medicine_name: medicineName,
            reminder_id: medicineId,
            response,
          });
        }
      };

      // Foreground event listener
      const unsubscribeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
          await handleNotificationAction(detail);
        }
      });

      // Background event listener
      const unsubscribeBackground = notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
          await handleNotificationAction(detail);
        }
      });

      return () => {
        unsubscribeForeground();
        unsubscribeBackground();
      };
    };
    setupNotifications();
  }, [medicines]);
  
  const getMedicineRemindersApi = async () => {
  try {
    const tokens = await getAuthTokens();
    const idToken = tokens?.idToken;

    if (!idToken) {
      Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
      throw new Error("ID token not available.");
    }

    const response = await api.post("/get-medicine-reminders", { idToken }, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200 && response.data) {
      return response.data.reminders;
    } else {
      const errorMessage = response.data?.message || "Failed to fetch medicine reminders.";
      Alert.alert("Medicine Reminders Error", errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred.";
    Alert.alert("API call error (getMedicineRemindersApi):", errorMessage);
    throw error;
  }
};

  const registerForPushNotifications = async () => {
    const permission = await notifee.requestPermission();
    if (permission.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
      Alert.alert("Permission Required", "Please enable notifications for reminders.");
      return false;
    }
    return true;
  };

  const playSound = async () => {
    try {
      const soundObj = new Sound(require("../../assets/ringtone.mp3"), (error) => {
        if (error) {
          console.log("Error loading sound:", error);
          return;
        }
        setSound(soundObj);
        soundObj.play((success) => {
          if (!success) {
            console.log("Sound playback failed");
          }
        });
      });
    } catch (error) {
      console.log("Error playing sound:", error);
    }
  };

  // --- SCHEDULE NOTIFICATIONS ---
  const scheduleNotification = async (medicine: Medicine) => {
    if (!medicine.enableTakeAlert) return;
    const now = new Date();
    const selectedHour = medicine.time.getHours();
    const selectedMinute = medicine.time.getMinutes();
    // Scheduled time (e.g., 10:00 AM)
    const scheduledDate = new Date();
    scheduledDate.setHours(selectedHour, selectedMinute, 0, 0);
    // 10 minutes before scheduled time
    const beforeDate = new Date(scheduledDate.getTime() - 10 * 60 * 1000);
    if (beforeDate <= now) beforeDate.setDate(beforeDate.getDate() + 1);
    if (scheduledDate <= now) scheduledDate.setDate(scheduledDate.getDate() + 1);
    // --- 1. Notification 10 minutes before ---
    const beforeTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: beforeDate.getTime(),
    };
    try {
      await notifee.createTriggerNotification(
        {
          id: `${medicine.id}-before`,
          title: "Medicine Reminder",
          body: `Reminder: Your time to take ‘${medicine.name}’ medicine is after 10 minutes.`,
          data: { medicineId: medicine.id, medicineName: medicine.name },
          android: {
            channelId: "alarm",
            pressAction: { id: "default" },
            sound: "alarm",
          },
        },
        beforeTrigger
      );
    } catch (error) {
      console.error("Failed to schedule 'before' notification:", error);
    }
    // --- 2. Notification at scheduled time with actions ---
    const atTimeTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: scheduledDate.getTime(),
    };
    try {
      await notifee.createTriggerNotification(
        {
          id: `${medicine.id}-ontime`,
          title: "Did you take your medicine?",
          body: `Did you take your ‘${medicine.name}’ medicine?`,
          data: { medicineId: medicine.id },
          android: {
            channelId: "alarm",
            pressAction: { id: "default" },
            sound: "alarm",
            actions: [
              { title: "Yes", pressAction: { id: "yes" } },
              { title: "No", pressAction: { id: "no" } },
            ],
          },
          ios: {
            categoryId: "med_reminder",
          },
        },
        atTimeTrigger
      );
    } catch (error) {
      console.error("Failed to schedule 'ontime' notification:", error);
    }
    // Optionally, handle refill reminder as before
    if (medicine.refillReminder && medicine.refillDate) {
      const now = new Date();
      const refillTriggerDate = new Date(medicine.refillDate);
      refillTriggerDate.setDate(refillTriggerDate.getDate() - medicine.refillDays);
      if (refillTriggerDate > now) {
        const refillTrigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: refillTriggerDate.getTime(),
        };
        try {
          await notifee.createTriggerNotification(
            {
              id: `refill-${medicine.id}`,
              title: "Refill Reminder",
              body: `Time to refill ${medicine.name}. Only ${medicine.refillDays} days left!`,
              android: {
                channelId: "default",
                pressAction: { id: "default" },
              },
            },
            refillTrigger
          );
        } catch (error) {
          console.error("Failed to schedule refill notification:", error);
        }
      }
    }
  };

  const clearAllNotifications = async () => {
    await notifee.cancelAllNotifications();
    Alert.alert("Success", "All notifications cleared.");
  };

  const sendReminderResponse = async ({ medicine_name, reminder_id, response }: { medicine_name: string, reminder_id: string, response: string }) => {
  try {
    const tokens = await getAuthTokens();
    const idToken = tokens?.idToken;

    if (!idToken) {
      Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
      throw new Error("ID token not available.");
    }

    const result = await api.post("/save-reminder-response", { idToken:idToken, medicine_name:medicine_name, reminder_id:reminder_id, response:response }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to send reminder response:", error);
    Alert.alert("Error", "Failed to send reminder response.");
  }
};
  // Fetch medicines from AsyncStorage on mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const stored = await AsyncStorage.getItem('medicines');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          const revived = parsed.map((m: any) => ({
            ...m,
            time: new Date(m.time),
            duration: new Date(m.duration),
            refillDate: m.refillDate ? new Date(m.refillDate) : null,
          }));
          setMedicines(revived);
        } else {
          // If not in AsyncStorage, fetch from API
          const apiReminders = await getMedicineRemindersApi();
          if (Array.isArray(apiReminders)) {
            const mapped = mapApiRemindersToMedicines(apiReminders);
            setMedicines(mapped);
            await AsyncStorage.setItem('medicines', JSON.stringify(mapped));
          }
        }
      } catch (e) {
        console.error('Failed to load medicines from storage or API', e);
      }
    };
    fetchMedicines();
  }, []);

  // Save medicines to AsyncStorage whenever medicines state changes
  useEffect(() => {
    const saveMedicines = async () => {
      try {
        await AsyncStorage.setItem('medicines', JSON.stringify(medicines));
      } catch (e) {
        console.error('Failed to save medicines to storage', e);
      }
    };
    saveMedicines();
  }, [medicines]);

  const addMedicine = async () => {
    if (!medicineName || !dosage) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    const newMedicine: Medicine = {
      id: `${medicineName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
      name: medicineName,
      dosage,
      time: new Date(time),
      duration: new Date(duration),
      amountPerBox,
      currentQuantity,
      initialQuantity: currentQuantity,
      enableTakeAlert,
      ringPhone,
      sendMessage,
      refillReminder,
      refillDays,
      refillDate: new Date(refillDate),
      startFromToday,
    };

    setMedicines((prev) => [...prev, newMedicine]);

    if (enableTakeAlert || refillReminder) {
      try {
        await saveReminder(newMedicine);
        scheduleNotification(newMedicine);
        const timeString = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        Alert.alert("Success", `Medicine added with reminder at ${timeString}`);
        resetForm();
      } catch (error) {
        Alert.alert("Error", "Failed to save reminder. Please try again.");
      }
    } else {
      Alert.alert(
        "Reminder Not Scheduled",
        "You haven't enabled the 'Take Medicine Alert' or 'Refill Reminder'. Enable at least one to receive notifications."
      );
    }
  };

  const resetForm = () => {
    setMedicineName("");
    setDosage("");
    setTime(new Date());
    setDuration(new Date());
    setTempTime(new Date());
    setTempDuration(new Date());
    setAmountPerBox(10);
    setCurrentQuantity(10);
    setEnableTakeAlert(false);
    setRingPhone(false);
    setSendMessage(false);
    setRefillReminder(false);
    setRefillDays(3);
    setRefillDate(new Date());
    setTempRefillDate(new Date());
    setShowRefillDaysPicker(false);
    setRefillReminderText("");
    setStartFromToday(false);
  };

  const confirmIntake = (id: string) => {
    Alert.alert("Confirm Intake", "Have you taken this medicine?", [
      {
        text: "Yes",
        onPress: () => {
          setMedicines((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, currentQuantity: m.currentQuantity - (m.dailyIntake || 1) } : m
            )
          );
        },
      },
      { text: "No" },
    ]);
  };

  const deleteMedicine = (id: string) => {
    Alert.alert(`Delete Reminder`, "Are you sure you want to delete this medicine reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const tokens = await getAuthTokens();
            const idToken = tokens?.idToken;
            if (!idToken) {
              Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
              return;
            }
            // Call API to delete reminder (use DELETE as per backend expectation)
            const response = await api.delete("/delete-medicine-reminder", {
              data: {
                idToken: idToken,
                reminder_id: id,
              },
              headers: { "Content-Type": "application/json" },
            });
            if (response.status === 200) {
              const updated = medicines.filter((m) => m.id !== id);
              setMedicines(updated);
              try {
                await AsyncStorage.setItem('medicines', JSON.stringify(updated));
              } catch (e) {
                console.error('Failed to update medicines in storage', e);
              }
              notifee.cancelNotification(id);
              Alert.alert("Success", "Medicine reminder deleted successfully.");
            } else {
              Alert.alert("Delete Failed", "Failed to delete reminder from server.");
            }
          } catch (error) {
            Alert.alert("API call error (deleteMedicine)", error?.message || "Unknown error");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setTempTime(selectedTime);
      if (Platform.OS === "android") {
        setTime(selectedTime);
        setShowTimePicker(false);
      }
    }
  };

  const handleTimeConfirm = () => {
    setTime(tempTime);
    setShowTimePicker(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setTempDuration(selectedDate);
      if (Platform.OS === "android") {
        setDuration(selectedDate);
        setShowDatePicker(false);
      }
    }
  };

  const handleDateConfirm = () => {
    setDuration(tempDuration);
    setShowDatePicker(false);
  };

  const handleRefillDateChange = (event: any, selectedDate?: Date) => {
    setShowRefillDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setTempRefillDate(selectedDate);
      if (Platform.OS === "android") {
        setRefillDate(selectedDate);
        setShowRefillDatePicker(false);
      }
    }
  };

  const handleRefillDateConfirm = () => {
    setRefillDate(tempRefillDate);
    setShowRefillDatePicker(false);
  };

  const handleRefillDaysConfirm = () => {
    setShowRefillDaysPicker(false);
    setRefillReminderText(
      `Refill reminder set to ${refillDays} days before ${
        refillDate ? refillDate.toLocaleDateString() : "Not set"
      }`
    );
  };

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
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={() => deleteMedicine(item.id)}
          accessibilityLabel={`Delete ${item.name} reminder`}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => confirmIntake(item.id)}
          accessibilityLabel={`Confirm intake for ${item.name}`}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaComponent style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
            >
              <Icon name="arrow-back" size={24} color="#1F2A44" />
            </TouchableOpacity>
            <Text style={styles.header}>Medicine Reminder</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Medicine Details</Text>
            <View style={styles.inputContainer}>
              <Icon name="medication" size={24} color="#3498db" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Medicine Name"
                placeholderTextColor="#A0AEC0"
                value={medicineName}
                onChangeText={setMedicineName}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                accessibilityLabel="Enter medicine name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon name="pill" size={24} color="#3498db" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Dosage (e.g., 2 pills)"
                placeholderTextColor="#A0AEC0"
                value={dosage}
                onChangeText={setDosage}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                accessibilityLabel="Enter dosage"
              />
            </View>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowDatePicker(true);
              }}
              accessibilityLabel="Set end date for medicine"
            >
              <Icon name="calendar-today" size={20} color="#3498db" />
              <View style={styles.timeContent}>
                <Text style={styles.timeLabel}>Set End Date</Text>
                <Text style={styles.timeValue}>{duration ? duration.toLocaleDateString() : "Not set"}</Text>
              </View>
            </TouchableOpacity>
            {showDatePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDuration}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity style={styles.doneButton} onPress={handleDateConfirm} accessibilityLabel="Confirm end date">
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Amount per Box: {amountPerBox}</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={amountPerBox}
                onValueChange={setAmountPerBox}
                minimumTrackTintColor="#3498db"
                accessibilityLabel="Set amount per box"
              />
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Current Quantity: {currentQuantity}</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={amountPerBox}
                step={1}
                value={currentQuantity}
                onValueChange={setCurrentQuantity}
                minimumTrackTintColor="#3498db"
                accessibilityLabel="Set current quantity"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowTimePicker(true);
              }}
              accessibilityLabel="Set reminder time"
            >
              <Icon name="access-time" size={20} color="#3498db" />
              <View style={styles.timeContent}>
                <Text style={styles.timeLabel}>Set Reminder Time</Text>
                <Text style={styles.timeValue}>
                  {time ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not set"}
                </Text>
              </View>
            </TouchableOpacity>
            {showTimePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity style={styles.doneButton} onPress={handleTimeConfirm} accessibilityLabel="Confirm reminder time">
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={styles.notificationSettings}>
              <Text style={styles.notificationLabel}>Start From Today</Text>
              <Switch
                value={startFromToday}
                onValueChange={setStartFromToday}
                accessibilityLabel="Toggle start from today"
              />
            </View>
            <View style={styles.notificationSettings}>
              <Text style={styles.notificationLabel}>Take Medicine Alert</Text>
              <Switch
                value={enableTakeAlert}
                onValueChange={setEnableTakeAlert}
                accessibilityLabel="Toggle medicine alert"
              />
            </View>
            <View style={styles.notificationSettings}>
              <Text style={styles.notificationLabel}>Ring Phone</Text>
              <Switch
                value={ringPhone}
                onValueChange={setRingPhone}
                accessibilityLabel="Toggle ring phone"
              />
            </View>
            <View style={styles.notificationSettings}>
              <Text style={styles.notificationLabel}>Send Message</Text>
              <Switch
                value={sendMessage}
                onValueChange={setSendMessage}
                accessibilityLabel="Toggle send message"
              />
            </View>
            <View style={styles.notificationSettings}>
              <Text style={styles.notificationLabel}>Refill Reminder</Text>
              <Switch
                value={refillReminder}
                onValueChange={setRefillReminder}
                accessibilityLabel="Toggle refill reminder"
              />
            </View>
            {refillReminder && (
              <>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowRefillDatePicker(true);
                  }}
                  accessibilityLabel="Set refill date"
                >
                  <Icon name="calendar-today" size={20} color="#3498db" />
                  <View style={styles.timeContent}>
                    <Text style={styles.timeLabel}>Set Refill Date</Text>
                    <Text style={styles.timeValue}>{refillDate ? refillDate.toLocaleDateString() : "Not set"}</Text>
                  </View>
                </TouchableOpacity>
                {showRefillDatePicker && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={tempRefillDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleRefillDateChange}
                    />
                    {Platform.OS === "ios" && (
                      <TouchableOpacity style={styles.doneButton} onPress={handleRefillDateConfirm} accessibilityLabel="Confirm refill date">
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowRefillDaysPicker(true)}
                  accessibilityLabel="Set days before refill"
                >
                  <Icon name="access-time" size={20} color="#3498db" />
                  <View style={styles.timeContent}>
                    <Text style={styles.timeLabel}>Set Days Before Refill</Text>
                    <Text style={styles.timeValue}>{refillDays} days</Text>
                  </View>
                </TouchableOpacity>
                {showRefillDaysPicker && (
                  <View style={styles.pickerContainer}>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>Notify {refillDays} Days Before Refill</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={7}
                        step={1}
                        value={refillDays}
                        onValueChange={setRefillDays}
                        minimumTrackTintColor="#3498db"
                        accessibilityLabel="Set days before refill notification"
                      />
                    </View>
                    <TouchableOpacity style={styles.doneButton} onPress={handleRefillDaysConfirm} accessibilityLabel="Confirm days before refill">
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {refillReminderText !== "" && (
                  <Text style={styles.confirmationText}>{refillReminderText}</Text>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addMedicine}
              accessibilityLabel="Add new medicine"
            >
              <Text style={styles.addButtonText}>Add Medicine</Text>
            </TouchableOpacity>
            {/* Debug Button to Clear Notifications */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#FF5733', marginTop: 8 }]}
              onPress={clearAllNotifications}
              accessibilityLabel="Clear all notifications"
            >
              <Text style={styles.addButtonText}>Clear All Notifications</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.medicineListContainer}>
            {medicines.length === 0 ? (
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

// Function to send reminder response to API


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

export default MedicationReminder;