
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text, TextInput, Switch, Button, IconButton, Provider as PaperProvider } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

// Type for medicine
interface Medicine {
  id: string;
  name: string;
  dosage: string;
  remindersEnabled: boolean;
  selectedDays: string[];
  reminderTimes: string[];
  refillDate: Date | null;
  refillReminderEnabled?: boolean;
  refillReminderTime?: string;
  takenDates: string[];
  startFromToday?: boolean; // New field to track initial "Start from Today" status
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MedicationReminder: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editMedicineId, setEditMedicineId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'today' | 'completed' | 'missed' | 'upcoming'>('today');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [refillDatePickerVisible, setRefillDatePickerVisible] = useState(false);
  const [refillTimePickerVisible, setRefillTimePickerVisible] = useState(false);
  const [now, setNow] = useState(new Date()); // Current time: 01:22 AM IST, Tuesday, August 12, 2025

  const [newMedicine, setNewMedicine] = useState<Omit<Medicine, 'id'> & {
    refillReminderEnabled?: boolean;
    refillReminderTime?: string;
    startFromToday?: boolean;
  }>({
    name: '',
    dosage: '',
    remindersEnabled: true,
    selectedDays: [],
    reminderTimes: [],
    refillDate: null,
    refillReminderEnabled: false,
    refillReminderTime: '',
    takenDates: [],
    startFromToday: false,
  });

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const stored = await AsyncStorage.getItem('medicines');
        if (stored) {
          const parsed = JSON.parse(stored);
          setMedicines(
            parsed.map((m: any) => ({
              ...m,
              refillDate: m.refillDate ? new Date(m.refillDate) : null,
              takenDates: m.takenDates || [],
              startFromToday: m.startFromToday || false,
            }))
          );
        }
      } catch (e) {
        console.error('Error loading medicines:', e);
        Alert.alert('Error', 'Failed to load medicines.');
      }
    };
    loadMedicines();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const toggleDay = useCallback((day: string) => {
    setNewMedicine((prev) => {
      const isSelected = prev.selectedDays.includes(day);
      return {
        ...prev,
        selectedDays: isSelected
          ? prev.selectedDays.filter((d) => d !== day)
          : [...prev.selectedDays, day],
      };
    });
  }, []);

  const removeReminderTime = useCallback((idx: number) => {
    setNewMedicine((prev) => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((_, i) => i !== idx),
    }));
  }, []);

  const addReminderTime = useCallback((event: any, selectedDate: Date | undefined) => {
    if (event?.type === 'dismissed') {
      setTimePickerVisible(false);
      return;
    }
    if (selectedDate) {
      const timeString = selectedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setNewMedicine((prev) => {
        if (prev.reminderTimes.includes(timeString)) return prev;
        return {
          ...prev,
          reminderTimes: [...prev.reminderTimes, timeString].sort((a, b) => {
            const timeA = parseTime(a, new Date());
            const timeB = parseTime(b, new Date());
            return timeA && timeB ? timeA.getTime() - timeB.getTime() : 0;
          }),
        };
      });
    }
    setTimePickerVisible(false);
  }, []);

  const openEditMedicine = useCallback((medicine: Medicine) => {
    setEditMedicineId(medicine.id);
    setNewMedicine({
      name: medicine.name,
      dosage: medicine.dosage,
      remindersEnabled: medicine.remindersEnabled,
      selectedDays: medicine.selectedDays,
      reminderTimes: medicine.reminderTimes,
      refillDate: medicine.refillDate,
      refillReminderEnabled: medicine.refillReminderEnabled || false,
      refillReminderTime: medicine.refillReminderTime || '',
      takenDates: medicine.takenDates,
      startFromToday: medicine.startFromToday || false,
    });
    setModalVisible(true);
  }, []);

  const saveMedicine = useCallback(async () => {
    if (!newMedicine.name.trim() || !newMedicine.dosage.trim()) {
      setValidationError('Medicine name and dosage are required!');
      return;
    }
    if (newMedicine.remindersEnabled && newMedicine.reminderTimes.length === 0) {
      setValidationError('At least one reminder time is required when reminders are enabled.');
      return;
    }
    if (!/^\d+\s*(mg|g|ml|tablet(s)?|capsule(s)?)$/i.test(newMedicine.dosage.trim())) {
      setValidationError('Dosage must be a number followed by a unit (e.g., "500 mg", "2 tablets").');
      return;
    }
    try {
      const updatedMedicines = editMedicineId
        ? medicines.map((m) =>
            m.id === editMedicineId ? { ...newMedicine, id: editMedicineId } : m
          )
        : [...medicines, { ...newMedicine, id: Date.now().toString(), startFromToday: newMedicine.startFromToday }];
      await AsyncStorage.setItem('medicines', JSON.stringify(updatedMedicines));
      setMedicines(updatedMedicines);
      setModalVisible(false);
      setValidationError(null);
      setEditMedicineId(null);
      setNewMedicine({
        name: '',
        dosage: '',
        remindersEnabled: true,
        selectedDays: [],
        reminderTimes: [],
        refillDate: null,
        refillReminderEnabled: false,
        refillReminderTime: '',
        takenDates: [],
        startFromToday: false,
      });
    } catch (e) {
      console.error('Error saving medicine:', e);
      Alert.alert('Error', 'Failed to save medicine.');
    }
  }, [newMedicine, editMedicineId, medicines]);

  const deleteMedicine = useCallback((id: string) => {
    Alert.alert('Delete Medicine?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedMedicines = medicines.filter((m) => m.id !== id);
            await AsyncStorage.setItem('medicines', JSON.stringify(updatedMedicines));
            setMedicines(updatedMedicines);
          } catch (e) {
            console.error('Error deleting medicine:', e);
            Alert.alert('Error', 'Failed to delete medicine.');
          }
        },
      },
    ]);
  }, [medicines]);

  const parseTime = (timeStr: string, currentDate: Date): Date | null => {
    let hours: number, minutes: number;
    if (timeStr.includes(' ')) {
      const [time, modifier] = timeStr.split(' ');
      const [hoursStr, minutesStr] = time.split(':');
      hours = parseInt(hoursStr, 10);
      minutes = parseInt(minutesStr, 10);
      if (isNaN(hours) || isNaN(minutes)) return null;
      if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    } else {
      const [hoursStr, minutesStr] = timeStr.split(':');
      hours = parseInt(hoursStr, 10);
      minutes = parseInt(minutesStr, 10);
      if (isNaN(hours) || isNaN(minutes)) return null;
    }
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
  };

  const todayISO = now.toISOString().split('T')[0];
  const currentDayIndex = now.getDay(); // 2 for Tuesday
  const currentDay = currentDayIndex === 0 ? 'Sun' : daysOfWeek[currentDayIndex - 1]; // "Tue"

  const isScheduledToday = useCallback((m: Medicine) => {
    // Check if the medicine is scheduled for today based on selectedDays or startFromToday
    const isDayMatch = m.selectedDays.length === 0 || m.selectedDays.includes(currentDay);
    return m.remindersEnabled && (isDayMatch || (m.startFromToday && todayISO === now.toISOString().split('T')[0]));
  }, [currentDay, now]);

  const completed = useMemo(() => medicines.filter(m => isScheduledToday(m) && m.takenDates.includes(todayISO)), [medicines, now, isScheduledToday]);

  const missed = useMemo(() => medicines.filter(m =>
    isScheduledToday(m) &&
    m.reminderTimes.length > 0 &&
    m.reminderTimes.every(t => {
      const medTime = parseTime(t, now);
      return medTime && medTime < now;
    }) &&
    !m.takenDates.includes(todayISO)
  ), [medicines, now, isScheduledToday]);

  const upcoming = useMemo(() => medicines.filter(m =>
    m.remindersEnabled &&
    m.selectedDays.length > 0 &&
    !m.selectedDays.includes(currentDay) &&
    !m.takenDates.includes(todayISO)
  ), [medicines, now, currentDay]);

  const todayMedicines = useMemo(() => medicines.filter(m =>
    isScheduledToday(m) &&
    (m.reminderTimes.length === 0 ||
    m.reminderTimes.every(t => {
      const medTime = parseTime(t, now);
      return medTime && medTime <= now;
    })) &&
    !completed.includes(m) &&
    !missed.includes(m) &&
    !upcoming.includes(m)
  ), [medicines, completed, missed, upcoming, isScheduledToday, now]);

  const tabData = {
    today: todayMedicines,
    completed,
    missed,
    upcoming,
  }[selectedTab];

  const getFrequencyText = (m: Medicine) => {
    return m.selectedDays.length === 0 ? 'Daily' : m.selectedDays.join(', ');
  };

  const getStreakText = (m: Medicine) => {
    if (m.takenDates.length === 0) return '';
    const sortedDates = m.takenDates.sort();
    let streak = 0;
    let current = new Date(todayISO);
    while (sortedDates.includes(current.toISOString().split('T')[0])) {
      streak++;
      current.setDate(current.getDate() - 1);
    }
    return streak > 0 ? `${streak} day streak` : '';
  };

  const renderMedicineCard = useCallback(({ item }: { item: Medicine }) => {
    const handleComplete = () => {
      setMedicines((prev) =>
        prev.map((m) =>
          m.id === item.id && !m.takenDates.includes(todayISO)
            ? { ...m, takenDates: [...m.takenDates, todayISO] }
            : m
        )
      );
    };

    const refillText = item.refillDate
      ? `Refill due: ${item.refillDate.toLocaleDateString()} ${item.refillReminderTime || ''}`
      : null;
    const isRefillPast = item.refillDate && item.refillDate < now;
    const streakText = getStreakText(item);

    if (selectedTab === 'completed') {
      return (
        <View style={[styles.medicineCard, styles.medicineCardCompletedList]} accessibilityLabel={`Completed: ${item.name}`}>
          <View style={styles.medicineCardRow}>
            <MaterialIcons name="check-circle" size={22} color="#4CAF50" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.medicineDosage}>{item.dosage} • {getFrequencyText(item)}</Text>
              {streakText && <Text style={styles.streakText}>{streakText}</Text>}
              {refillText && <Text style={[styles.refillText, isRefillPast && styles.refillPast]}>{refillText}</Text>}
            </View>
            <Text style={styles.completedLabel}>Completed</Text>
            <TouchableOpacity onPress={() => deleteMedicine(item.id)} style={styles.deleteButton} accessibilityLabel={`Delete ${item.name}`}>
              <MaterialIcons name="delete" size={20} color="#D32F2F" />
            </TouchableOpacity>
          </View>
          <Text style={styles.completedDate}>Completed today</Text>
        </View>
      );
    }
    if (selectedTab === 'missed') {
      return (
        <View style={[styles.medicineCard, styles.medicineCardMissedList]} accessibilityLabel={`Missed: ${item.name}`}>
          <View style={styles.medicineCardRow}>
            <MaterialIcons name="error-outline" size={22} color="#D32F2F" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.medicineDosage}>{item.dosage} • {getFrequencyText(item)}</Text>
              {streakText && <Text style={styles.streakText}>{streakText}</Text>}
              {refillText && <Text style={[styles.refillText, isRefillPast && styles.refillPast]}>{refillText}</Text>}
            </View>
            <Text style={styles.missedLabel}>Missed</Text>
            <TouchableOpacity onPress={() => deleteMedicine(item.id)} style={styles.deleteButton} accessibilityLabel={`Delete ${item.name}`}>
              <MaterialIcons name="delete" size={20} color="#D32F2F" />
            </TouchableOpacity>
          </View>
          <Text style={styles.missedDate}>Missed today</Text>
        </View>
      );
    }
    if (selectedTab === 'upcoming') {
      return (
        <View style={[styles.medicineCard, styles.medicineCardUpcomingList]} accessibilityLabel={`Upcoming: ${item.name}`}>
          <View style={styles.medicineCardRow}>
            <MaterialIcons name="access-time" size={22} color="#1976D2" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.medicineDosage}>{item.dosage} • {getFrequencyText(item)}</Text>
              {streakText && <Text style={styles.streakText}>{streakText}</Text>}
              {refillText && <Text style={[styles.refillText, isRefillPast && styles.refillPast]}>{refillText}</Text>}
            </View>
            <Text style={styles.upcomingLabel}>Upcoming</Text>
            <TouchableOpacity onPress={() => deleteMedicine(item.id)} style={styles.deleteButton} accessibilityLabel={`Delete ${item.name}`}>
              <MaterialIcons name="delete" size={20} color="#D32F2F" />
            </TouchableOpacity>
          </View>
          {item.reminderTimes.map((time, idx) => (
            <Text key={idx} style={styles.upcomingDate}>
              {item.selectedDays[idx % item.selectedDays.length] || currentDay}, {time}
            </Text>
          ))}
        </View>
      );
    }
    // For 'today' tab
    return (
      <View style={[styles.medicineCard, styles.medicineCardYellow, { borderColor: '#f5eec2', borderWidth: 1 }]} accessibilityLabel={`Today: ${item.name}`}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.medicineName}>{item.name}</Text>
            {streakText && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{streakText}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.editButton} onPress={() => openEditMedicine(item)} accessibilityLabel={`Edit ${item.name}`}>
              <MaterialIcons name="edit" size={20} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteMedicine(item.id)} accessibilityLabel={`Delete ${item.name}`}>
              <MaterialIcons name="delete" size={20} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.medicineDosage, { marginBottom: 4 }]}>{item.dosage} • {getFrequencyText(item)}</Text>
        {refillText && <Text style={[styles.refillText, { marginBottom: 8 }, isRefillPast && styles.refillPast]}>{refillText}</Text>}
        <View>
          {item.reminderTimes.length === 0 ? (
            <Text style={styles.noTimes}>No reminder times set</Text>
          ) : (
            item.reminderTimes.map((time, idx) => (
              <View key={idx} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: 10,
                marginBottom: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 2,
                elevation: 1,
              }}>
                <MaterialIcons name="schedule" size={18} color="#888" />
                <Text style={{ marginLeft: 8, fontSize: 16, color: '#222', flex: 1 }}>{time}</Text>
                <View style={{ marginLeft: 8 }}>
                  <TouchableOpacity
                    onPress={handleComplete}
                    style={{ backgroundColor: '#222', borderRadius: 8, padding: 2, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel={`Mark ${item.name} as taken at ${time}`}
                  >
                    <MaterialIcons name="check" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  }, [selectedTab, todayISO, deleteMedicine, openEditMedicine, now]);

  const renderSummaryCards = () => {
    return (
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryCardCompleted]}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="check" size={24} color="#4CAF50" />
          </View>
          <Text style={[styles.summaryCount, styles.summaryCountCompleted]}>{completed.length}</Text>
          <Text style={[styles.summaryLabel, styles.summaryLabelCompleted]}>Completed</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardMissed]}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="close" size={24} color="#FF5252" />
          </View>
          <Text style={[styles.summaryCount, styles.summaryCountMissed]}>{missed.length}</Text>
          <Text style={[styles.summaryLabel, styles.summaryLabelMissed]}>Missed</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardUpcoming]}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="schedule" size={24} color="#2196F3" />
          </View>
          <Text style={[styles.summaryCount, styles.summaryCountUpcoming]}>{upcoming.length}</Text>
          <Text style={[styles.summaryLabel, styles.summaryLabelUpcoming]}>Upcoming</Text>
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { key: 'today', label: 'Today', badge: todayMedicines.length, badgeColor: '#1976D2' },
      { key: 'completed', label: 'Completed', badge: completed.length, badgeColor: '#4CAF50' },
      { key: 'missed', label: 'Missed', badge: missed.length, badgeColor: '#D32F2F' },
      { key: 'upcoming', label: 'Upcoming', badge: upcoming.length, badgeColor: '#2196F3' },
    ];

    return (
      <View style={styles.tabsBarContainer}>
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabModern, isActive && styles.tabModernActive]}
              onPress={() => setSelectedTab(tab.key)}
              accessibilityLabel={`Switch to ${tab.label} tab`}
            >
              <Text style={[styles.tabModernText, isActive && styles.tabModernTextActive]}>{tab.label}</Text>
              {tab.badge > 0 && (
                <View style={[styles.tabModernBadge, { backgroundColor: tab.badgeColor }]}>
                  <Text style={styles.tabModernBadgeText}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => {}} style={styles.backButton} accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={28} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.heading}>Medicine Tracker</Text>
          <TouchableOpacity
            style={styles.addButtonHeader}
            onPress={() => setModalVisible(true)}
            accessibilityLabel="Add new medicine"
          >
            <MaterialIcons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        {renderSummaryCards()}
        {renderTabs()}
        <FlatList
          data={tabData}
          renderItem={renderMedicineCard}
          keyExtractor={(item) => item.id}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No medicines in this category</Text>}
        />
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => {
            setModalVisible(false);
            setValidationError(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerFixed}>
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setValidationError(null);
                  }}
                  style={styles.backButtonModal}
                  accessibilityLabel="Close modal"
                >
                  <MaterialIcons name="arrow-back" size={28} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editMedicineId ? 'Edit Medicine' : 'Add New Medicine'}
                </Text>
              </View>
              <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                <TextInput
                  label="Medicine Name"
                  value={newMedicine.name}
                  onChangeText={(text) => {
                    setNewMedicine((prev) => ({ ...prev, name: text }));
                    setValidationError(null);
                  }}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="default"
                  placeholderTextColor="#000"
                  textColor="#000"
                  theme={{ colors: { background: '#fff', primary: '#1976D2', placeholder: '#000' } }}
                  accessibilityLabel="Medicine name input"
                />
                <TextInput
                  label="Dosage (e.g., 500 mg, 2 tablets)"
                  value={newMedicine.dosage}
                  onChangeText={(text) => {
                    setNewMedicine((prev) => ({ ...prev, dosage: text }));
                    setValidationError(null);
                  }}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="default"
                  placeholderTextColor="#000"
                  textColor="#000"
                  theme={{ colors: { background: '#fff', primary: '#1976D2', placeholder: '#000' } }}
                  accessibilityLabel="Dosage input"
                />
                {validationError && (
                  <Text style={styles.validationError}>{validationError}</Text>
                )}
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Enable Reminders</Text>
                  <Switch
                    value={newMedicine.remindersEnabled}
                    onValueChange={(val) => setNewMedicine((prev) => ({ ...prev, remindersEnabled: val }))}
                    color="#1976D2"
                    accessibilityLabel="Toggle reminders"
                  />
                </View>
                {newMedicine.remindersEnabled && (
                  <>
                    <Text style={styles.sectionTitle}>Select Days</Text>
                    <View style={styles.daysGridContainer}>
                      <View style={styles.daysRowGrid}>
                        {daysOfWeek.map((d) => {
                          const selected = newMedicine.selectedDays.includes(d);
                          return (
                            <TouchableOpacity
                              key={d}
                              onPress={() => toggleDay(d)}
                              accessibilityLabel={`Select ${d}`}
                            >
                              <Text
                                style={[styles.dayCircle, selected ? styles.dayCircleSelected : styles.dayCircleUnselected]}
                              >
                                {d}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    <Text style={styles.sectionTitle}>Reminder Times</Text>
                    {newMedicine.reminderTimes.length === 0 && (
                      <Text style={styles.noTimes}>No times set</Text>
                    )}
                    {newMedicine.reminderTimes.map((time, idx) => (
                      <View key={idx} style={styles.reminderTimeRow}>
                        <Text style={styles.reminderTimeText}>• {time}</Text>
                        <IconButton
                          icon="close"
                          size={18}
                          onPress={() => removeReminderTime(idx)}
                          accessibilityLabel={`Remove time ${time}`}
                        />
                      </View>
                    ))}
                    <Button
                      icon="clock"
                      mode="outlined"
                      style={styles.addTimeButton}
                      onPress={() => setTimePickerVisible(true)}
                      labelStyle={styles.outlinedButtonLabel}
                      accessibilityLabel="Add reminder time"
                    >
                      Add Time
                    </Button>
                  </>
                )}
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Start from Today</Text>
                  <Switch
                    value={!!newMedicine.startFromToday}
                    onValueChange={(val) => setNewMedicine((prev) => ({ ...prev, startFromToday: val }))}
                    color="#1976D2"
                    accessibilityLabel="Toggle start from today"
                  />
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Enable Refill Reminder</Text>
                  <Switch
                    value={!!newMedicine.refillReminderEnabled}
                    onValueChange={(val) => setNewMedicine((prev) => ({ ...prev, refillReminderEnabled: val }))}
                    color="#1976D2"
                    accessibilityLabel="Toggle refill reminder"
                  />
                </View>
                {newMedicine.refillReminderEnabled && (
                  <>
                    <Text style={styles.sectionTitle}>Refill Date</Text>
                    <Button
                      icon="calendar"
                      mode="outlined"
                      style={styles.addTimeButton}
                      onPress={() => setRefillDatePickerVisible(true)}
                      labelStyle={styles.outlinedButtonLabel}
                      accessibilityLabel="Select refill date"
                    >
                      {newMedicine.refillDate ? newMedicine.refillDate.toLocaleDateString() : 'Select Date'}
                    </Button>
                    {refillDatePickerVisible && (
                      <DateTimePicker
                        mode="date"
                        value={newMedicine.refillDate || new Date()}
                        onChange={(event: any, date?: Date) => {
                          if (event?.type === 'dismissed' || !date) {
                            setRefillDatePickerVisible(false);
                            return;
                          }
                          setNewMedicine((prev) => ({ ...prev, refillDate: date }));
                          setRefillDatePickerVisible(false);
                        }}
                        display="spinner"
                      />
                    )}
                    <Text style={styles.sectionTitle}>Refill Reminder Time</Text>
                    <Button
                      icon="clock"
                      mode="outlined"
                      style={styles.addTimeButton}
                      onPress={() => setRefillTimePickerVisible(true)}
                      labelStyle={styles.outlinedButtonLabel}
                      accessibilityLabel="Select refill time"
                    >
                      {newMedicine.refillReminderTime ? newMedicine.refillReminderTime : 'Select Time'}
                    </Button>
                    {refillTimePickerVisible && (
                      <DateTimePicker
                        mode="time"
                        value={new Date()}
                        onChange={(event: any, date?: Date) => {
                          if (event?.type === 'dismissed' || !date) {
                            setRefillTimePickerVisible(false);
                            return;
                          }
                          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                          setNewMedicine((prev) => ({ ...prev, refillReminderTime: timeString }));
                          setRefillTimePickerVisible(false);
                        }}
                        display="spinner"
                      />
                    )}
                  </>
                )}
                {timePickerVisible && (
                  <DateTimePicker
                    mode="time"
                    value={new Date()}
                    onChange={addReminderTime}
                    display="spinner"
                  />
                )}
                <View style={styles.modalActions}>
                  <Button
                    mode="text"
                    onPress={() => {
                      setModalVisible(false);
                      setValidationError(null);
                    }}
                    style={styles.cancelButton}
                    labelStyle={styles.cancelButtonLabel}
                    accessibilityLabel="Cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={saveMedicine}
                    style={styles.saveButton}
                    labelStyle={styles.saveButtonLabel}
                    accessibilityLabel="Save medicine"
                  >
                    Save
                  </Button>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default MedicationReminder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  addButtonHeader: {
    backgroundColor: '#1976D2',
    borderRadius: 20,
    padding: 4,
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 24,
  },
  medicineCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medicineCardYellow: {
    backgroundColor: '#FFFDE7',
  },
  medicineCardCompletedList: {
    backgroundColor: '#F1F8E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
  },
  medicineCardMissedList: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
  },
  medicineCardUpcomingList: {
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
    borderWidth: 1,
  },
  medicineCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  streakBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  streakText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  medicineDosage: {
    fontSize: 14,
    color: '#666',
  },
  refillText: {
    fontSize: 12,
    color: '#666',
  },
  refillPast: {
    color: '#D32F2F',
  },
  editButton: {
    padding: 8,
    marginTop: -8,
    marginRight: -8,
  },
  deleteButton: {
    padding: 8,
    marginTop: -8,
    marginRight: -8,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginVertical: 16,
  },
  summaryCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryCardCompleted: {
    backgroundColor: '#E8F5E9',
  },
  summaryCardMissed: {
    backgroundColor: '#FFEBEE',
  },
  summaryCardUpcoming: {
    backgroundColor: '#E3F2FD',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryCountCompleted: {
    color: '#4CAF50',
  },
  summaryCountMissed: {
    color: '#FF5252',
  },
  summaryCountUpcoming: {
    color: '#2196F3',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryLabelCompleted: {
    color: '#388E3C',
  },
  summaryLabelMissed: {
    color: '#D32F2F',
  },
  summaryLabelUpcoming: {
    color: '#1976D2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerFixed: {
    width: '92%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButtonModal: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    flex: 1,
    textAlign: 'center',
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 12,
    marginBottom: 8,
  },
  daysGridContainer: {
    marginBottom: 16,
  },
  daysRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    textAlign: 'center',
    lineHeight: 36,
    borderWidth: 1,
    borderColor: '#1976D2',
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dayCircleSelected: {
    backgroundColor: '#1976D2',
    color: '#fff',
  },
  dayCircleUnselected: {
    backgroundColor: '#fff',
  },
  noTimes: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  reminderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reminderTimeText: {
    fontSize: 15,
    color: '#222',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
  },
  cancelButtonLabel: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  saveButtonLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  validationError: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  addTimeButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1976D2',
    marginTop: 8,
  },
  outlinedButtonLabel: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  tabsBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F7',
    borderRadius: 20,
    marginHorizontal: 8,
    marginVertical: 8,
    padding: 4,
  },
  tabModern: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  tabModernActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabModernText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  tabModernTextActive: {
    color: '#111',
    fontWeight: 'bold',
  },
  tabModernBadge: {
    marginLeft: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabModernBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  completedLabel: {
    color: '#388E3C',
    fontWeight: 'bold',
    fontSize: 15,
  },
  completedDate: {
    color: '#388E3C',
    fontSize: 13,
    marginLeft: 30,
    marginTop: 2,
  },
  missedLabel: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 15,
  },
  missedDate: {
    color: '#D32F2F',
    fontSize: 13,
    marginLeft: 30,
    marginTop: 2,
  },
  upcomingLabel: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  upcomingDate: {
    color: '#1976D2',
    fontSize: 13,
    marginLeft: 30,
    marginTop: 2,
  },
});