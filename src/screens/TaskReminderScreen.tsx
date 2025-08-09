import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
  Keyboard,
  SafeAreaView,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Task = {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: Date;
  recurring: boolean;
  days: string[];
  completed: boolean;
  addedBy: 'you' | 'ai';
};

const TaskReminderScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    date: Date;
    time: Date;
    recurring: boolean;
    days: string[];
    addedBy: 'you' | 'ai';
  }>({
    title: "",
    description: "",
    date: new Date(),
    time: new Date(),
    recurring: false,
    days: [],
    addedBy: 'you',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [viewMode, setViewMode] = useState("upcoming"); // upcoming, completed, missed

  useEffect(() => {
    // Dummy data for demo
    setTasks([
      {
        id: "1",
        title: "Take medicine",
        description: "Morning medicine",
        date: new Date(Date.now() + 3600 * 1000),
        time: new Date(Date.now() + 3600 * 1000),
        recurring: false,
        days: [],
        completed: false,
        addedBy: 'you',
      },
      {
        id: "2",
        title: "Go for walk",
        description: "Suggested by AI",
        date: new Date(), // Added missing 'date' property
        recurring: true,
        days: ["Mon", "Wed", "Fri"],
        time: new Date(),
        completed: false,
        addedBy: 'ai',
      },
    ]);
  }, []);

  const addOrEditTask = () => {
    if (!newTask.title) {
      Alert.alert("Please enter a task title");
      return;
    }
    if (newTask.recurring && newTask.days.length === 0) {
      Alert.alert("Please select days for recurring task");
      return;
    }
    if (!newTask.recurring && !newTask.date) {
      Alert.alert("Please select a date for the task");
      return;
    }
    if (editTaskId) {
      setTasks(tasks.map(task => task.id === editTaskId ? {
        ...task,
        ...newTask,
      } : task));
    } else {
      const task: Task = {
        ...newTask,
        id: `${Date.now()}`,
        completed: false,
      };
      setTasks([...tasks, task]);
    }
    setShowAddModal(false);
    setEditTaskId(null);
    setNewTask({ title: "", description: "", date: new Date(), time: new Date(), recurring: false, days: [], addedBy: 'you' });
    Keyboard.dismiss();
  };

  const markTaskDone = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: true } : task));
  };

  // Helper to format date as YYYY-MM-DD (local time)
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get start and end dates for 4 weeks
  const today = new Date();
  today.setHours(0,0,0,0);
  const startDate = new Date(today);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 27); // 4 weeks

  // Filter and group tasks by date for each tab
  function groupTasksByDate(tasksList: Task[], filterFn: (task: Task) => boolean, sortAsc = true) {
    // Only include tasks within the 4 week window
    const filtered = tasksList.filter(task => {
      const d = new Date(task.date);
      d.setHours(0,0,0,0);
      return d >= startDate && d <= endDate && filterFn(task);
    });
    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Group by date
    const groups: { [date: string]: Task[] } = {};
    filtered.forEach(task => {
      const key = formatDateKey(new Date(task.date));
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    // Return sorted array of {date, tasks}
    const sortedKeys = Object.keys(groups).sort((a, b) => sortAsc ? a.localeCompare(b) : b.localeCompare(a));
    return sortedKeys.map(date => ({ date, tasks: groups[date] }));
  }

  // Upcoming: today and future (group by date only, ignore time)
  const upcomingGroups = groupTasksByDate(
    tasks,
    (task) => {
      if (task.completed) return false;
      // Compare only the date part
      const taskDate = new Date(task.date);
      taskDate.setHours(0,0,0,0);
      return taskDate >= today;
    },
    true
  );

  // Completed: any completed task (regardless of date)
  const completedGroups = groupTasksByDate(
    tasks,
    (task) => task.completed,
    false
  );

  // Missed: past days only
  const missedGroups = groupTasksByDate(
    tasks,
    (task) => {
      if (task.completed) return false;
      const taskDate = new Date(task.date);
      taskDate.setHours(0,0,0,0);
      return taskDate < today;
    },
    false
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Reminder</Text>
      </View>
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setViewMode("upcoming")} style={[styles.tabButton, viewMode === "upcoming" && styles.tabActive]}>
          <Text style={[styles.tabText, viewMode === "upcoming" && styles.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewMode("completed")} style={[styles.tabButton, viewMode === "completed" && styles.tabActive]}>
          <Text style={[styles.tabText, viewMode === "completed" && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewMode("missed")} style={[styles.tabButton, viewMode === "missed" && styles.tabActive]}>
          <Text style={[styles.tabText, viewMode === "missed" && styles.tabTextActive]}>Missed</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
        {(() => {
          const groups = viewMode === 'upcoming' ? upcomingGroups : viewMode === 'completed' ? completedGroups : missedGroups;
          if (groups.length === 0) return <Text style={styles.emptyText}>No tasks found.</Text>;
          return groups.map(group => (
            <View key={group.date}>
              <Text style={styles.dateHeader}>{new Date(group.date).toDateString()}</Text>
              {group.tasks.map(item => (
                <View key={item.id} style={styles.taskCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{item.title}</Text>
                      <Text style={styles.taskMeta}>{item.date ? item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                      {item.recurring && (
                        <Text style={styles.taskMeta}>Recurring: {item.days.join(", ")}</Text>
                      )}
                    </View>
                    {viewMode === 'upcoming' && (
                      <TouchableOpacity
                        style={[styles.completeButton, item.completed && styles.completeButtonDone]}
                        onPress={() => {
                          Alert.alert(
                            'Mark as Complete',
                            'Are you sure you want to mark this task as completed?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Yes', style: 'default', onPress: () => markTaskDone(item.id) },
                            ]
                          );
                        }}
                      >
                        <MaterialIcons name="check" size={24} color={item.completed ? '#FFF' : '#4CAF50'} />
                      </TouchableOpacity>
                    )}
                    {viewMode === 'upcoming' && (
                      <TouchableOpacity style={styles.editButton} onPress={() => {
                        setShowAddModal(true);
                        setEditTaskId(item.id);
                        setNewTask({
                          title: item.title,
                          description: item.description,
                          date: item.date || new Date(),
                          time: item.time,
                          recurring: item.recurring,
                          days: item.days,
                          addedBy: item.addedBy,
                        });
                      }}>
                        <MaterialIcons name="edit" size={22} color="#0288D1" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.addedBy}>{item.addedBy === 'you' ? 'Added by you' : 'Suggested by AI'}</Text>
                </View>
              ))}
            </View>
          ));
        })()}
      </ScrollView>
      {viewMode === 'upcoming' && (
        <TouchableOpacity style={styles.fabAddButton} onPress={() => { setShowAddModal(true); setEditTaskId(null); }}>
          <MaterialIcons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editTaskId ? 'Edit Task' : 'Add Task'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={newTask.title}
              onChangeText={title => setNewTask({ ...newTask, title })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newTask.description}
              onChangeText={description => setNewTask({ ...newTask, description })}
            />
            <TouchableOpacity style={styles.inputRow} onPress={() => setNewTask({ ...newTask, recurring: !newTask.recurring })}>
              <MaterialIcons name="repeat" size={24} color="#0288D1" />
              <Text style={styles.inputLabel}>Recurring?</Text>
              <MaterialIcons name={newTask.recurring ? "toggle-on" : "toggle-off"} size={32} color={newTask.recurring ? "#0288D1" : "#BDBDBD"} style={{ marginLeft: 10 }} />
            </TouchableOpacity>
            {newTask.recurring ? (
              <View style={styles.daysRowWrap}>
                {daysOfWeek.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayButton, newTask.days.includes(day) && styles.daySelected]}
                    onPress={() => {
                      setNewTask({
                        ...newTask,
                        days: newTask.days.includes(day)
                          ? newTask.days.filter(d => d !== day)
                          : [...newTask.days, day],
                      });
                    }}
                  >
                    <Text style={[styles.dayText, newTask.days.includes(day) && styles.dayTextSelected]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                  <MaterialIcons name="event" size={24} color="#0288D1" />
                  <Text style={styles.inputLabel}>Date: {newTask.date ? newTask.date.toDateString() : ''}</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.inputRow} onPress={() => setShowTimePicker(true)}>
              <MaterialIcons name="access-time" size={24} color="#0288D1" />
              <Text style={styles.inputLabel}>Time: {newTask.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveButton} onPress={addOrEditTask}>
                <Text style={styles.saveButtonText}>{editTaskId ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowAddModal(false); setEditTaskId(null); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={newTask.date || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setNewTask({ ...newTask, date: selectedDate });
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={newTask.time}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) setNewTask({ ...newTask, time: selectedTime });
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E1",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#0288D1",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
  },
  addButton: {
    // Deprecated, replaced by fabAddButton
  },
  fabAddButton: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -32 }],
    backgroundColor: '#4CAF50',
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: "#0288D1",
  },
  tabText: {
    fontSize: 16,
    color: "#2E2E2E",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#FFF",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
  },
  taskCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 18,
    color: "#2E2E2E",
    fontWeight: "700",
    marginBottom: 2,
  },
  taskMeta: {
    fontSize: 15,
    color: "#666",
    marginBottom: 2,
  },
  addedBy: {
    fontSize: 13,
    color: "#888",
    marginTop: 6,
    textAlign: 'right',
  },
  completeButton: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4CAF50",
    marginLeft: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  completeButtonDone: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2E2E',
    marginTop: 18,
    marginBottom: 6,
    marginLeft: 16,
  },
  editButton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    padding: 6,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 24,
    width: Dimensions.get('window').width - 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0288D1",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    marginBottom: 12,
    color: "#2E2E2E",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    color: "#2E2E2E",
    marginLeft: 10,
  },
  recurringSwitch: {
    marginLeft: 10,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  daysRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
    gap: 6,
  },
  dayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 2,
  },
  daySelected: {
    backgroundColor: "#0288D1",
  },
  dayText: {
    fontSize: 15,
    color: "#2E2E2E",
  },
  dayTextSelected: {
    color: "#FFF",
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  saveButton: {
    backgroundColor: "#0288D1",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#BDBDBD",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default TaskReminderScreen;
