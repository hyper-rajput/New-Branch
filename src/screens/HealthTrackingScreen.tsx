import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { saveHealthMetricsApi } from '../services/api';

const HealthTrackingScreen = ({ navigation }) => {
  const [healthScore, setHealthScore] = useState("0%");
  const [readingsCount, setReadingsCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState("BP");
  const [history, setHistory] = useState([
    { value: "120/80 mmHg", timestamp: "1/9/2024, 8:30:00 AM", status: "normal" },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [metricType, setMetricType] = useState("Blood Pressure");
  const [metricValue, setMetricValue] = useState("");
  const [note, setNote] = useState("");
  const metricOptions = ["Blood Pressure", "Heart Rate", "Weight"];

  const handleSync = () => {
    console.log("Syncing with friends...");
  };

  const handleAddHealthReading = () => {
    setModalVisible(true);
  };

  const handleManageSharing = () => {
    console.log("Managing sharing...");
  };

  const getHistoryTitle = () => {
    switch (selectedTab) {
      case "BP":
        return "Blood Pressure History";
      case "Heart":
        return "Heart Rate History";
      case "Weight":
        return "Weight History";
      default:
        return "History";
    }
  };

  const handleAddReading = async () => {
    if (!metricValue || isNaN(parseInt(metricValue.split('/')[0]) || !metricValue)) {
      alert("Please enter a valid value.");
      return;
    }

    const newMetric = {
      id: `${metricType.toLowerCase()}-${Date.now()}`,
      type: metricType,
      value: metricValue,
      timestamp: new Date().toISOString(),
      note: note || "",
      status: "normal", // Default status, can be updated based on logic
    };

    try {
      await saveHealthMetricsApi([newMetric]);
      setHistory([...history, newMetric]);
      setReadingsCount(readingsCount + 1);
      setModalVisible(false);
      setMetricValue("");
      setNote("");
    } catch (error) {
      console.error("Error saving health metric:", error);
      alert("Failed to save health metric. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Tracker</Text>
          <TouchableOpacity onPress={handleSync}>
            <MaterialIcons name="sync" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subHeader}>{readingsCount} readings today - Health score: {healthScore}</Text>
        <View style={styles.healthScoreContainer}>
          <Text style={styles.healthScoreLabel}>Today's Health Score</Text>
          <View style={styles.healthScoreContent}>
            <Text style={styles.healthScoreValue}>{healthScore}</Text>
            <View style={styles.trendIcon}>
              <MaterialIcons name="trending-up" size={20} color="#4CAF50" />
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progress} />
          </View>
          <Text style={styles.readingsStatus}>{readingsCount} of {readingsCount} readings normal</Text>
        </View>
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, styles.cardWeight]}>
            <MaterialIcons name="monitor-weight" size={24} color="#2196F3" />
            <Text style={styles.metricValue}>72.5 kg</Text>
            <Text style={styles.metricLabel}>Current Weight</Text>
          </View>
          <View style={[styles.metricCard, styles.cardHeartRate]}>
            <MaterialIcons name="favorite" size={24} color="#D32F2F" />
            <Text style={styles.metricValue}>72 bpm</Text>
            <Text style={styles.metricLabel}>Heart Rate</Text>
          </View>
          <View style={[styles.metricCard, styles.cardBloodPressure]}>
            <MaterialIcons name="bloodtype" size={24} color="#AB47BC" />
            <Text style={styles.metricValue}>120/80</Text>
            <Text style={styles.metricLabel}>Blood Pressure</Text>
          </View>
          <View style={[styles.metricCard, styles.cardSteps]}>
            <MaterialIcons name="directions-walk" size={24} color="#FF9800" />
            <Text style={styles.metricValue}>8420</Text>
            <Text style={styles.metricLabel}>Steps Today</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddHealthReading}>
          <Text style={styles.addButtonText}>+ Add Health Reading</Text>
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "BP" && styles.selectedTab]}
            onPress={() => setSelectedTab("BP")}
          >
            <Text style={styles.tabText}>BP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "Heart" && styles.selectedTab]}
            onPress={() => setSelectedTab("Heart")}
          >
            <Text style={styles.tabText}>Heart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "Weight" && styles.selectedTab]}
            onPress={() => setSelectedTab("Weight")}
          >
            <Text style={styles.tabText}>Weight</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>
            <MaterialIcons name="favorite" size={20} color="#D32F2F" /> {getHistoryTitle()}
          </Text>
          {history.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyValue}>{item.value}</Text>
              <Text style={styles.historyTimestamp}>{item.timestamp}</Text>
              <View style={styles.historyStatus}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.sharingContainer}>
          <View style={styles.sharingIcon}>
            <MaterialIcons name="people" size={20} color="#4CAF50" />
          </View>
          <Text style={styles.sharingTitle}>Share with Wellness Partners</Text>
          <Text style={styles.sharingDescription}>
            Your connected friends can view your health trends and provide support
          </Text>
          <View style={styles.sharingFriends}>
            <Text style={styles.friendName}>SJ</Text>
            <Text style={styles.friendName}>MC</Text>
            <Text style={styles.friendMore}>+3</Text>
          </View>
          <TouchableOpacity style={styles.manageButton} onPress={handleManageSharing}>
            <Text style={styles.manageText}>Manage Sharing</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Health Metric</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <CustomDropdown
              label="Select Metric"
              value={metricType}
              options={metricOptions}
              onSelect={setMetricType}
            />
            <TextInput
              style={styles.input}
              placeholder={`Enter ${metricType.toLowerCase()} value`}
              value={metricValue}
              onChangeText={setMetricValue}
              keyboardType="numeric"
              placeholderTextColor="#757575"
            />
            <TextInput
              style={styles.input}
              placeholder="Note (optional)"
              value={note}
              onChangeText={setNote}
              placeholderTextColor="#757575"
            />
            <TouchableOpacity style={styles.addReadingButton} onPress={handleAddReading}>
              <Text style={styles.addReadingText}>Add Reading</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Custom Dropdown Component
const CustomDropdown = ({ label, value, options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity style={styles.dropdown} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.dropdownText}>{value}</Text>
        <MaterialIcons name={isOpen ? "arrow-drop-up" : "arrow-drop-down"} size={24} color="#757575" />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownOption}
              onPress={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              <Text style={styles.dropdownOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subHeader: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
  },
  healthScoreContainer: {
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  healthScoreLabel: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 5,
  },
  healthScoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 10,
  },
  trendIcon: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    padding: 5,
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#B0BEC5',
    borderRadius: 5,
    marginVertical: 10,
  },
  progress: {
    width: '0%',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  readingsStatus: {
    fontSize: 14,
    color: '#757575',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    borderRadius: 12,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardWeight: {
    backgroundColor: '#BBDEFB',
  },
  cardHeartRate: {
    backgroundColor: '#FFCDD2',
  },
  cardBloodPressure: {
    backgroundColor: '#E1BEE7',
  },
  cardSteps: {
    backgroundColor: '#FFE0B2',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#757575',
    marginVertical: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: '#757575',
  },
  addButton: {
    backgroundColor: '#212121',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  selectedTab: {
    backgroundColor: '#FFF',
  },
  tabText: {
    fontSize: 16,
    color: '#757575',
  },
  historySection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  historyValue: {
    fontSize: 16,
    color: '#000',
  },
  historyTimestamp: {
    fontSize: 14,
    color: '#757575',
  },
  historyStatus: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  sharingContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  sharingIcon: {
    marginBottom: 5,
  },
  sharingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  sharingDescription: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  sharingFriends: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  friendName: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 5,
    backgroundColor: '#C8E6C9',
    borderRadius: 10,
    padding: 5,
  },
  friendMore: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 5,
  },
  manageButton: {
    backgroundColor: '#C8E6C9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  manageText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#757575',
  },
  dropdownOptions: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginTop: 5,
    elevation: 2,
  },
  dropdownOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#000',
  },
  input: {
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    fontSize: 16,
    color: '#000',
  },
  addReadingButton: {
    backgroundColor: '#212121',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  addReadingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HealthTrackingScreen;