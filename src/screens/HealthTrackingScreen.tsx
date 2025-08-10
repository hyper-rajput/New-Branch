import React, { useState, useEffect } from "react";
import { LineChart } from 'react-native-chart-kit';
import{  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Keyboard,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {saveMedicinesApi, saveHealthMetricsApi, GetHealthMetricsApi, GetMedicines, deleteMedicineApi} from '../services/api'; // Import GetMedicinesApi
import FullScreenLoader from '../components/FullScreenLoader';

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


const HealthTrackingScreen = ({ navigation }) => {

  type HealthData = {
    id: any;
    type: any;
    value: any;
    timestamp: string;
  };
  const [healthMetric, setHealthMetric] = useState({ type: "Heart Rate", value: "" });
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const metricOptions = ["Heart Rate", "Blood Pressure", "Glucose", "Weight", "Oxygen Level"];

  useEffect(() => {
    const fetchHealthMetrics = async () => {
      try {
        const response = await GetHealthMetricsApi();
        if (response && Array.isArray(response)) {
          setHealthData(response.map(item => ({
            id: item.id,
            type: item.metric,
            value: item.data,
            timestamp: item.timestamp
          })));
        }
      } catch (error) {
        console.error("Error fetching health metrics:", error);
        Alert.alert("Error", "Failed to load health metrics. Please try again later.");
      }
    };
    fetchHealthMetrics();
  }, []);

  const addHealthMetric = async () => {
    if (!healthMetric.value || isNaN(healthMetric.value)) {
      Alert.alert("Oops!", `Please enter a valid number for ${healthMetric.type}.`, [
        { text: "OK", style: "default" }
      ]);
      return;
    }
    setLoaderVisible(true);
    const newMetric = {
      id: `${healthMetric.type.toLowerCase()}-${Date.now()}`,
      type: healthMetric.type,
      value: parseFloat(healthMetric.value),
      timestamp: new Date().toISOString(), // ISO format for reliable parsing
    };
    try {
      await saveHealthMetricsApi([newMetric]);
      Alert.alert("Health metric saved successfully");
      setHealthData([...healthData, newMetric]);
      setHealthMetric({ type: "Heart Rate", value: "" });
    } catch (error) {
      console.error("Error saving health metric:", error);
    } finally {
      setLoaderVisible(false);
      Keyboard.dismiss();
    }
  };

  // Prepare chart data for selected metric
  const [selectedChartMetric, setSelectedChartMetric] = useState("Heart Rate");
  const [selectedPeriod, setSelectedPeriod] = useState("Last 7 Days");
  const chartData = React.useMemo(() => {
    // Filter healthData for selected metric
    const filtered = healthData.filter(item => item.type === selectedChartMetric);
    // Sort by timestamp
    filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let labels = [];
    let data = [];
    if (selectedPeriod === "Last 7 Days") {
      // Last 7 days
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setHours(0,0,0,0);
        day.setDate(now.getDate() - i);
        const dayStr = `${day.getDate()}/${day.getMonth() + 1}`;
        labels.push(dayStr);
        // Find all metrics for this day
        const dayMetrics = filtered.filter(item => {
          const itemDate = new Date(item.timestamp);
          itemDate.setHours(0,0,0,0);
          return itemDate.getDate() === day.getDate() && itemDate.getMonth() === day.getMonth() && itemDate.getFullYear() === day.getFullYear();
        });
        // Average if multiple entries
        const avg = dayMetrics.length > 0 ? dayMetrics.reduce((sum, item) => sum + item.value, 0) / dayMetrics.length : 0;
        data.push(avg);
      }
    } else {
      // Last 4 weeks (Month)
      const now = new Date();
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setHours(0,0,0,0);
        weekStart.setDate(now.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekStr = `Week ${4 - i}`;
        labels.push(weekStr);
        // Find all metrics for this week
        const weekMetrics = filtered.filter(item => {
          const itemDate = new Date(item.timestamp);
          itemDate.setHours(0,0,0,0);
          return itemDate >= weekStart && itemDate <= weekEnd;
        });
        // Average if multiple entries
        const avg = weekMetrics.length > 0 ? weekMetrics.reduce((sum, item) => sum + item.value, 0) / weekMetrics.length : 0;
        data.push(avg);
      }
    }
    return { labels, datasets: [{ data }] };
  }, [healthData, selectedChartMetric, selectedPeriod]);

  const chartConfig = {
    backgroundGradientFrom: '#FFF8E1',
    backgroundGradientTo: '#FFF8E1',
    color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    strokeWidth: 2,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#0288D1',
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <FullScreenLoader visible={loaderVisible} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#2E2E2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Tracking</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Health Metric</Text>
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
            <Text style={styles.addButtonText}>Save Metric</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visualize Metrics</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <CustomDropdown
              label="Metric"
              value={selectedChartMetric}
              options={metricOptions}
              onSelect={setSelectedChartMetric}
            />
            <CustomDropdown
              label="Period"
              value={selectedPeriod}
              options={["Last 7 Days", "Month"]}
              onSelect={setSelectedPeriod}
            />
          </View>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 12 }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metric History</Text>
          {healthData.length === 0 ? (
            <Text style={styles.emptyText}>No health metrics recorded yet.</Text>
          ) : (
            healthData.map((item) => (
              <View key={item.id} style={styles.metricItem}>
                <MaterialIcons name="favorite" size={28} color="#D32F2F" style={styles.itemIcon} />
                <Text style={styles.metricText}>{item.type}: {item.value} ({item.timestamp})</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minWidth: 120,
  },
  dropdownText: {
    fontSize: 15,
    color: "#2E2E2E",
    fontWeight: "500",
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