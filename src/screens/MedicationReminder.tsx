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
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';
import Sound from 'react-native-sound';
import { useNavigation } from '@react-navigation/native';

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
  fromHealthTracking?: boolean;
  initialQuantity?: number;
  dailyIntake?: number;
}

// Use SafeAreaView from react-native with platform handling
const SafeAreaComponent = Platform.OS === "ios" ? SafeAreaView : View;

const MedicationReminder: React.FC = () => {
  const navigation = useNavigation();
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

  useEffect(() => {
    // Initialize notification channel for Android
    if (Platform.OS === "android") {
      notifee.createChannel({
        id: "default",
        name: "Default Channel",
        importance: AndroidImportance.HIGH,
        vibration: true,
        lightColor: "#FF231F7C",
        sound: "default",
      });
    }

    // Request notification permissions
    registerForPushNotifications();

    // Listen for foreground notification events
    const subscription = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === notifee.EventType.DELIVERED) {
        const medicineId = detail.notification?.data?.medicineId as string;
        const medicine = medicines.find((m) => m.id === medicineId);
        if (medicine && medicine.ringPhone) await playSound();
      }
    });

    return () => {
      subscription();
      if (sound) sound.release();
    };
  }, [medicines]);

  const registerForPushNotifications = async () => {
    const permission = await notifee.requestPermission();
    if (!permission) {
      Alert.alert("Permission Required", "Please enable notifications for reminders.");
    }
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

  const scheduleNotification = async (medicine: Medicine) => {
    if (!medicine.enableTakeAlert) return;

    const now = new Date();
    const selectedHour = medicine.time.getHours();
    const selectedMinute = medicine.time.getMinutes();
    let triggerDate = medicine.startFromToday
      ? new Date(now.setHours(selectedHour, selectedMinute, 0, 0))
      : new Date(now.getTime() + 10 * 1000);

    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1); // Schedule for the next day if time has passed
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id: medicine.id,
        title: "Medication Reminder",
        body: `Time to take ${medicine.dosage} of ${medicine.name}`,
        data: { medicineId: medicine.id },
        android: {
          channelId: "default",
          pressAction: { id: "default" },
        },
      },
      trigger
    );

    if (medicine.refillReminder && medicine.refillDate) {
      const refillTriggerDate = new Date(medicine.refillDate);
      refillTriggerDate.setDate(refillTriggerDate.getDate() - medicine.refillDays);

      if (refillTriggerDate > now) {
        const refillTrigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: refillTriggerDate.getTime(),
        };

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
      }
    }
  };

  const addMedicine = () => {
    if (!medicineName || !dosage) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    const newMedicine: Medicine = {
      id: medicineName.toLowerCase(),
      name: medicineName,
      dosage,
      time: new Date(time),
      duration: new Date(duration),
      amountPerBox,
      currentQuantity,
      enableTakeAlert,
      ringPhone,
      sendMessage,
      refillReminder,
      refillDays,
      refillDate: new Date(refillDate),
      startFromToday,
      fromHealthTracking: false,
    };

    setMedicines((prev) => [...prev, newMedicine]);

    if (enableTakeAlert || refillReminder) scheduleNotification(newMedicine);

    const timeString = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    Alert.alert("Success", `Medicine added with reminder at ${timeString}`);
    resetForm();
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
    Alert.alert("Delete Reminder", "Are you sure you want to delete this medicine reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          setMedicines((prev) => prev.filter((m) => m.id !== id));
          notifee.cancelNotification(id);
        },
        style: "destructive",
      },
    ]);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios"); // Keep picker open on iOS until "Done" is pressed
    if (selectedTime) {
      setTempTime(selectedTime);
      if (Platform.OS === "android") {
        setTime(selectedTime); // Auto-confirm on Android
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
      {item.fromHealthTracking ? (
        <>
          <Text style={styles.statusText}>Initial Quantity: {item.initialQuantity}</Text>
          <Text style={styles.statusText}>Current Quantity: {item.currentQuantity}</Text>
          <Text style={styles.statusText}>Daily Intake: {item.dailyIntake} pill(s)</Text>
          <Text style={styles.promptText}>Please add timing and notification details above.</Text>
        </>
      ) : (
        <>
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
        </>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={() => deleteMedicine(item.id)}
          accessibilityLabel={`Delete ${item.name} reminder`}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
        {!item.fromHealthTracking && (
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => confirmIntake(item.id)}
            accessibilityLabel={`Confirm intake for ${item.name}`}
          >
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        )}
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
              onPress={() => navigation.navigate("Dashboard")}
              accessibilityLabel="Go back to dashboard"
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
                maximumValue={20}
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
                maximumValue={20}
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
  promptText: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
    fontStyle: 'italic',
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