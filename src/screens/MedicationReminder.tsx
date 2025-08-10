import React, { useState, useEffect } from 'react';
import { View, FlatList, Modal, StyleSheet, Alert, SafeAreaView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, Card, Text, Button, TextInput, IconButton, Switch } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from '@react-native-async-storage/async-storage';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Type for medicine
interface Medicine {
  id: string;
  name: string;
  dosage: string;
  remindersEnabled: boolean;
  selectedDays: string[];
  reminderTimes: string[];
  refillDate: Date | null;
}

export default function MedicationReminder() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  // Load medicines from AsyncStorage on mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const stored = await AsyncStorage.getItem('medicines');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert refillDate back to Date object if present
          setMedicines(parsed.map((m: any) => ({
            ...m,
            refillDate: m.refillDate ? new Date(m.refillDate) : null,
          })));
        }
      } catch (e) {
        // Handle error
      }
    };
    fetchMedicines();
  }, []);
  const [modalVisible, setModalVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editMedicineId, setEditMedicineId] = useState<string | null>(null);

  const [newMedicine, setNewMedicine] = useState<Omit<Medicine, 'id'> & {
    refillReminderEnabled?: boolean;
    refillReminderTime?: string;
  }>({
    name: '',
    dosage: '',
    remindersEnabled: true,
    selectedDays: [],
    reminderTimes: [],
    refillDate: null,
    refillReminderEnabled: false,
    refillReminderTime: '',
  });

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [refillDatePickerVisible, setRefillDatePickerVisible] = useState(false);
  const [refillTimePickerVisible, setRefillTimePickerVisible] = useState(false);

  const toggleDay = (day: string) => {
    setNewMedicine((prev) => {
      const isSelected = prev.selectedDays.includes(day);
      return {
        ...prev,
        selectedDays: isSelected
          ? prev.selectedDays.filter((d) => d !== day)
          : [...prev.selectedDays, day],
      };
    });
  };

  // Remove reminder time
  const removeReminderTime = (idx: number) => {
    setNewMedicine((prev) => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((_, i) => i !== idx),
    }));
  };

  const addReminderTime = (event: any, selectedDate: Date | undefined) => {
    if (event?.type === 'dismissed') {
      setTimePickerVisible(false);
      return;
    }
    if (selectedDate) {
      const timeString = selectedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setNewMedicine((prev) => {
        if (prev.reminderTimes.includes(timeString)) return prev; // Prevent duplicates
        return {
          ...prev,
          reminderTimes: [...prev.reminderTimes, timeString],
        };
      });
    }
    setTimePickerVisible(false);
  };

  const openEditMedicine = (medicine: Medicine) => {
    setEditMedicineId(medicine.id);
    setNewMedicine({
      name: medicine.name,
      dosage: medicine.dosage,
      remindersEnabled: medicine.remindersEnabled,
      selectedDays: medicine.selectedDays,
      reminderTimes: medicine.reminderTimes,
      refillDate: medicine.refillDate,
      refillReminderEnabled: (medicine as any).refillReminderEnabled || false,
      refillReminderTime: (medicine as any).refillReminderTime || '',
    });
    setModalVisible(true);
  };

  const saveMedicine = () => {
    if (!newMedicine.name.trim() || !newMedicine.dosage.trim()) {
      setValidationError('Medicine name and dosage are required!');
      return;
    }
    const updateStorage = async (updated: Medicine[]) => {
      try {
        await AsyncStorage.setItem('medicines', JSON.stringify(updated));
      } catch (e) {
        // Handle error
      }
    };
    if (editMedicineId) {
      setMedicines((prev) => {
        const updated = prev.map((m) => m.id === editMedicineId ? { ...m, ...newMedicine } : m);
        updateStorage(updated);
        return updated;
      });
      setEditMedicineId(null);
    } else {
      setMedicines((prev) => {
        const updated = [...prev, { ...newMedicine, id: Date.now().toString() }];
        updateStorage(updated);
        return updated;
      });
    }
    setModalVisible(false);
    setValidationError(null);
    setNewMedicine({
      name: '',
      dosage: '',
      remindersEnabled: true,
      selectedDays: [],
      reminderTimes: [],
      refillDate: null,
      refillReminderEnabled: false,
      refillReminderTime: '',
    });
  };

  const deleteMedicine = (id: string) => {
    Alert.alert('Delete Medicine?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setMedicines((prev) => {
            const updated = prev.filter((m) => m.id !== id);
            AsyncStorage.setItem('medicines', JSON.stringify(updated));
            return updated;
          });
        },
      },
    ]);
  };

  const renderMedicineCard = ({ item }: { item: Medicine }) => {
    return (
      <Card style={styles.cardCompact}>
        <View style={styles.cardRowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>Dosage: {item.dosage}</Text>
          </View>
          <View style={styles.cardActionsRow}>
            <IconButton icon="pencil" iconColor="#1976D2" onPress={() => openEditMedicine(item)} />
            <IconButton icon="delete" iconColor="#D32F2F" onPress={() => deleteMedicine(item.id)} />
          </View>
        </View>
        <View style={styles.cardRowBottom}>
          <View style={{ flex: 1 }}>
            {item.remindersEnabled ? (
              <>
                <Text style={styles.cardRemindersTitle}>Reminders:</Text>
                <Text style={styles.cardReminders}>{item.reminderTimes.length ? item.reminderTimes.join(', ') : 'No times set'}</Text>
                <Text style={styles.cardRemindersDays}>Days: {item.selectedDays.length ? item.selectedDays.join(', ') : 'None'}</Text>
              </>
            ) : (
              <Text style={styles.cardRemindersDisabled}>Reminders Disabled</Text>
            )}
            {(item as any).refillReminderEnabled && (
              <View style={styles.cardRefillRow}>
                <Text style={styles.cardRefillLabel}>Refill:</Text>
                <Text style={styles.cardRefillValue}>{item.refillDate ? item.refillDate.toLocaleDateString() : 'No date'}{(item as any).refillReminderTime ? `, ${(item as any).refillReminderTime}` : ''}</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => {/* Add navigation logic here if needed */}} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.heading}>Medicine</Text>
        </View>
        {medicines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No medicines added yet</Text>
            <Text style={styles.emptyStateSubtitle}>Add a medicine using the <Text style={{color: '#1976D2', fontWeight: 'bold'}}>+</Text> button below</Text>
          </View>
        ) : (
          <FlatList
            data={medicines}
            renderItem={renderMedicineCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.newFab} activeOpacity={0.7} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="add" size={32} color="#fff" style={styles.newFabIcon} />
          </TouchableOpacity>
        </View>
        {/* Add Medicine Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContainer}>
              <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderRow}>
                  <TouchableOpacity onPress={() => { setModalVisible(false); setValidationError(null); }} style={styles.backButtonModal}>
                    <MaterialIcons name="arrow-back" size={28} color="#1976D2" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Add New Medicine</Text>
                </View>
                <TextInput
                  label="Medicine Name"
                  value={newMedicine.name}
                  onChangeText={(text) => {
                    setNewMedicine((prev) => ({ ...prev, name: text }));
                    setValidationError(null);
                  }}
                  style={styles.input}
                  mode="outlined"
                                    placeholderTextColor="#000"
                  textColor="#000"
                  theme={{ colors: { background: '#fff', primary: '#1976D2', placeholder: '#000' } }}
                />
                <TextInput
                  label="Dosage"
                  value={newMedicine.dosage}
                  onChangeText={(text) => {
                    setNewMedicine((prev) => ({ ...prev, dosage: text }));
                    setValidationError(null);
                  }}
                  style={styles.input}
                  mode="outlined"
                                    placeholderTextColor="#000"
                  textColor="#000"
                  theme={{ colors: { background: '#fff', primary: '#1976D2', placeholder: '#000' } }}
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
                  />
                </View>
                {newMedicine.remindersEnabled && (
                  <>
                    <Text style={styles.sectionTitle}>Select Days</Text>
                    <View style={styles.daysGridContainer}>
                      <View style={styles.daysRowGrid}>
                        {daysOfWeek.slice(0, 4).map((d) => {
                          const selected = newMedicine.selectedDays.includes(d);
                          return (
                            <Text
                              key={d}
                              style={[styles.dayCircle, selected ? styles.dayCircleSelected : styles.dayCircleUnselected]}
                              onPress={() => toggleDay(d)}
                            >
                              {d}
                            </Text>
                          );
                        })}
                      </View>
                      <View style={styles.daysRowGrid}>
                        {daysOfWeek.slice(4).map((d) => {
                          const selected = newMedicine.selectedDays.includes(d);
                          return (
                            <Text
                              key={d}
                              style={[styles.dayCircle, selected ? styles.dayCircleSelected : styles.dayCircleUnselected]}
                              onPress={() => toggleDay(d)}
                            >
                              {d}
                            </Text>
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
                        <IconButton icon="close" size={18} onPress={() => removeReminderTime(idx)} />
                      </View>
                    ))}
                    <Button
                      icon="clock"
                      mode="outlined"
                      style={styles.addTimeButton}
                      onPress={() => setTimePickerVisible(true)}
                      labelStyle={styles.outlinedButtonLabel}
                    >
                      Add Time
                    </Button>
                  </>
                )}
                {/* Refill Reminder Section */}
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Enable Refill Reminder</Text>
                  <Switch
                    value={!!newMedicine.refillReminderEnabled}
                    onValueChange={(val) => setNewMedicine((prev) => ({ ...prev, refillReminderEnabled: val }))}
                    color="#1976D2"
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
                    >
                      {newMedicine.refillDate ? newMedicine.refillDate.toLocaleDateString() : 'Select Date'}
                    </Button>
                    {refillDatePickerVisible && (
                      <DateTimePicker
                        mode="date"
                        value={newMedicine.refillDate || new Date()}
                        onChange={(event: any, date?: Date) => {
                          if (event?.type === 'dismissed') {
                            setRefillDatePickerVisible(false);
                            return;
                          }
                          if (date) setNewMedicine((prev) => ({ ...prev, refillDate: date }));
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
                    >
                      {newMedicine.refillReminderTime ? newMedicine.refillReminderTime : 'Select Time'}
                    </Button>
                    {refillTimePickerVisible && (
                      <DateTimePicker
                        mode="time"
                        value={new Date()}
                        onChange={(event: any, date?: Date) => {
                          if (event?.type === 'dismissed') {
                            setRefillTimePickerVisible(false);
                            return;
                          }
                          if (date) {
                            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            setNewMedicine((prev) => ({ ...prev, refillReminderTime: timeString }));
                          }
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
                  <Button mode="text" onPress={() => { setModalVisible(false); setValidationError(null); }} style={styles.cancelButton} labelStyle={styles.cancelButtonLabel}>
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={saveMedicine} style={styles.saveButton} labelStyle={styles.saveButtonLabel}>
                    Save
                  </Button>
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  cardCompact: {
    marginBottom: 12,
    borderRadius: 14,
    elevation: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 90,
    justifyContent: 'center',
  },
  cardRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  cardRowBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  // ...existing code...
  // Updated compact card styles below
  cardRemindersTitle: {
    fontWeight: 'bold',
    color: '#1976D2',
    fontSize: 13,
    marginTop: 2,
  },
  cardReminders: {
    color: '#333',
    fontSize: 13,
    marginBottom: 2,
  },
  cardRemindersDays: {
    color: '#555',
    fontSize: 12,
    marginBottom: 2,
  },
  cardRefillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardRefillLabel: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 4,
  },
  cardRefillValue: {
    color: '#333',
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
    borderRadius: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButtonModal: {
    marginRight: 8,
    padding: 4,
    borderRadius: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 0,
    position: 'relative',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 18,
    marginBottom: 10,
    alignSelf: 'center',
  },
  outlinedButtonLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    backgroundColor: '#f9f9f9',
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 10,
  },
  newFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 10,
  },
  newFabIcon: {
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 18,
    elevation: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    paddingHorizontal: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#222',
  },
  cardRemindersTitle: {
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
  cardReminders: {
    color: '#000',
    marginBottom: 2,
  },
  cardRemindersDisabled: {
    color: '#D32F2F',
    fontWeight: 'bold',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 0,
    padding: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#000',
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    fontSize: 20,
    color: '#000',

  },
  validationError: {
    color: '#D32F2F',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  sectionTitle: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 17,
    color: '#000',
    marginBottom: 8,
  },
  daysGridContainer: {
    marginVertical: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRowGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginHorizontal: 4,
    marginVertical: 2,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    lineHeight: 56,
    overflow: 'hidden',
  },
  dayCircleSelected: {
    backgroundColor: '#000',
    color: '#fff',
    borderWidth: 0,
  },
  dayCircleUnselected: {
    backgroundColor: '#e3e3e3',
    color: '#000',
    borderWidth: 0,
  },
  noTimes: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  reminderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  reminderTimeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 4,
  },
  addTimeButton: {
    marginTop: 8,
    borderColor: '#1976D2',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#1976D2',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  cancelButton: {
    backgroundColor: '#e3e3e3',
    borderRadius: 8,
    color: '#000',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelButtonLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginLeft: 8,
  },
  saveButtonLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalScrollContent: {
    paddingBottom: 32,
  },
});
