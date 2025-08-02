import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView, Modal, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getMoodAnalysisApi } from '../services/api'; // Import your API service for searching family members
import { getConversationSummaryApi } from '../services/api';
import axios from "axios";
import EncryptedStorage from 'react-native-encrypted-storage';

// Define the type for a family member

const medicationStatus = {
  allTaken: true,
  lastUpdated: 'Today, 8:00 AM',
  missedDoses: 0,
  adherenceRate: 95, // Percentage over the last week
  nextDose: '12:00 PM - Metformin 500mg',
};
// Define the type for chat summary analysis
interface ChatSummary {
  moodTrend: string;
  topicsDiscussed: string[];
  concerns: string[];
  lastUpdated: string;
  engagementLevel: string;
  sentimentScore: number;
}


// Sample data for searchable elder members (replace with backend fetch later)

const FamilyAnalysis: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: { memberId?: string } }, 'params'>>();
  const memberId = route.params?.memberId;

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [moodAnalysis, setMoodAnalysis] = useState({
    overall_mood: 'No data available',
    description: '',
    historical_moods: [],
  });
    const [summary, setChatSummary] = useState('Nothing to Summarize yet');
  const [nextMedicine, setNextMedicine] = useState<any>(null); // State for next upcoming medicine
  const [moodLoading, setMoodLoading] = useState(false);
  const [medicineLoading, setMedicineLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);

  const chatSummary: ChatSummary = {
  moodTrend: 'Generally Positive',
  topicsDiscussed: ['Daily activities', 'Health updates', 'Family memories'],
  concerns: ['Mild forgetfulness noted', 'Requested more social activities'],
  lastUpdated: 'Today, 10:00 AM',
  engagementLevel: 'High',
  sentimentScore: 82, // Out of 100
};
  // Handle search input
useEffect(() => {
    const fetchData = async () => {
        const response = await getMoodAnalysisApi(memberId);
        if (response) {
            setMoodAnalysis(response);
            try {
                await AsyncStorage.setItem('lastMoodFetchDate', new Date().toDateString());
                await AsyncStorage.setItem('moodAnalysisData', JSON.stringify(response));
            } catch (e) {}
        }
    };

    const checkAndFetch = async () => {
        try {
            const lastFetch = await AsyncStorage.getItem('lastMoodFetchDate');
            const today = new Date().toDateString();
            if (lastFetch === today) {
                // Try to get cached data
                const cached = await AsyncStorage.getItem('moodAnalysisData');
                if (cached) {
                    setMoodAnalysis(JSON.parse(cached));
                    return;
                }
            }
            // If not today or no cached data, fetch from API
            fetchData();
        } catch (e) {
            fetchData();
        }
    };
    const fetchChatSummary = async () => {
        setChatLoading(true);
        try {
            const summary = await getConversationSummaryApi(memberId);
            if (summary) {
                setChatSummary(summary);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch chat summary.');
        }
        setChatLoading(false);
    };

    // Fetch next upcoming medicine using direct API (not getMedicineRemindersApi)
    const fetchNextMedicine = async () => {
      setMedicineLoading(true);
      try {
        const tokens = await EncryptedStorage.getItem("authTokens");
        const idToken = tokens ? JSON.parse(tokens).idToken : null;
        const child_id = memberId || "CHILD_CUSTOM_UID";
        const response = await api.post(
          `/get-child-reminders-with-status`,
          { idToken, child_id }
        );
        if (response.data && response.data.status === "success") {
          const medicines = mapApiRemindersToMedicines(response.data.reminders || []);
          setNextMedicine(medicines.length > 0 ? medicines[0] : null);
        } else {
          setNextMedicine(null);
        }
      } catch (e) {
        setNextMedicine(null);
      }
      setMedicineLoading(false);
    };

    fetchChatSummary();
    checkAndFetch();
    fetchNextMedicine();
}, [memberId]);

  // Helper to parse time string (e.g., '08:00') to Date object (today's date with that time)
  function parseTimeString(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    return now;
  }
  // Render each approved family member item



  // Render mood trend items
const renderMoodTrend = ({ item }: { item: string }) => (
    <View style={styles.moodTrendItem}>
        <Text style={styles.moodTrendText}>{item}</Text>
    </View>
);

  // Render topics discussed
  const renderTopic = ({ item }: { item: string }) => (
    <Text style={styles.summaryItem}>• {item}</Text>
  );

  // Render concerns
  const renderConcern = ({ item }: { item: string }) => (
    <Text style={styles.summaryItem}>• {item}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mood Compartment */}
        <View style={styles.compartment}>
          <Text style={styles.compartmentTitle}>Elder's Mood Overview</Text>
          <View style={styles.compartmentContent}>
            {moodLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
              <>
                <Text style={styles.moodText}>
                  {moodAnalysis.overall_mood}
                </Text>
                <Text style={styles.moodDescription}>{moodAnalysis.description}</Text>
                <Text style={styles.label}>Mood Trend (Last 3 Days):</Text>
                <FlatList
                  data={moodAnalysis.historical_moods.map((m: any) => m.overall_mood)}
                  renderItem={renderMoodTrend}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.moodTrendList}
                />
              </>
            )}
          </View>
        </View>

        {/* Medication Status Compartment */}
        <View style={styles.compartment}>
          <Text style={styles.compartmentTitle}>Medicine Schedule</Text>
          <View style={styles.compartmentContent}>
            {medicineLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : nextMedicine ? (
              <>
                <View style={styles.medicationStatusRow}>
                  <MaterialIcons name="local-pharmacy" size={24} color="#4CAF50" style={styles.statusIcon} />
                  <Text style={styles.medicationText}>{nextMedicine.name}</Text>
                </View>
                <Text style={styles.label}>Dosage:</Text>
                <Text style={styles.value}>{nextMedicine.dosage}</Text>
                <Text style={styles.label}>Time:</Text>
                <Text style={styles.value}>{nextMedicine.time ? nextMedicine.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not set'}</Text>
                <Text style={styles.label}>Until:</Text>
                <Text style={styles.value}>{nextMedicine.duration ? nextMedicine.duration.toLocaleDateString() : 'Not set'}</Text>
                <Text style={styles.label}>Quantity:</Text>
                <Text style={styles.value}>{nextMedicine.currentQuantity}/{nextMedicine.amountPerBox}</Text>
                {nextMedicine.refillReminder && (
                  <Text style={styles.value}>
                    Refill: {nextMedicine.refillDate ? nextMedicine.refillDate.toLocaleDateString() : 'Not set'} ({nextMedicine.refillDays} days before)
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.value}>No medicines found.</Text>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={() => (navigation as any).navigate('FamilySchedule', { child_id: memberId })}>
              <Text style={styles.actionButtonText}>View Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Summary Analysis Compartment */}
        <View style={styles.compartment}>
          <View style={styles.compartmentHeader}>
            <Text style={styles.compartmentTitle}>Chat Insights with Lumia</Text>
            <TouchableOpacity onPress={() => setIsSummaryExpanded(true)}>
              <Ionicons name="expand" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.compartmentContent}>
            {chatLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.moodDescription}> {summary}</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Full-Screen Chat Summary Modal */}
      <Modal
        visible={isSummaryExpanded}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chat Insights with Lumia</Text>
            <TouchableOpacity onPress={() => setIsSummaryExpanded(false)}>
              <Ionicons name="close" size={30} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            
             <View style={styles.modalSummaryRow}>
              {/* <Text style={styles.modalLabel}>Engagement Level:</Text>
              <Text style={styles.modalValue}>{chatSummary.engagementLevel}</Text> */}
                <Text style={styles.moodText}> {summary}</Text>
            </View>
            {/*<Text style={styles.modalLabel}>Sentiment Score:</Text>
            <View style={styles.sentimentContainer}>
              <View style={[styles.sentimentBar, { width: `${chatSummary.sentimentScore}%` }]} />
              <Text style={styles.sentimentScore}>{chatSummary.sentimentScore}/100</Text>
            </View>
            <View style={styles.modalSummaryRow}>
              <Text style={styles.modalLabel}>Mood Trend:</Text>
              <Text style={styles.modalValue}>{chatSummary.moodTrend}</Text>
            </View>
            <Text style={styles.modalLabel}>Topics Discussed:</Text>
            <FlatList
              data={chatSummary.topicsDiscussed}
              renderItem={renderTopic}
              keyExtractor={(item, index) => index.toString()}
              style={styles.modalSummaryList}
            />
            <Text style={styles.modalLabel}>Concerns Noted:</Text>
            <FlatList
              data={chatSummary.concerns}
              renderItem={renderConcern}
              keyExtractor={(item, index) => index.toString()}
              style={styles.modalSummaryList}
            />
            <Text style={styles.modalLastUpdated}>Last Updated: {chatSummary.lastUpdated}</Text> */}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const BASE_URL = "http://lumia-env.eba-smvczc8e.us-east-1.elasticbeanstalk.com";
const api = axios.create({ baseURL: BASE_URL, timeout: 5000 });

// Helper to map API response to Medicine[]
function mapApiRemindersToMedicines(apiReminders: any[]): any[] {
  return apiReminders.map((item: any) => ({
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
    dailyIntake: undefined,
    response: item.response || '',
  }));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  searchResultsList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchResultInfo: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  compartment: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compartmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  compartmentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    paddingLeft:20,
    paddingTop:20
  },
  compartmentContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  moodText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  moodDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    lineHeight: 22,
  },
  moodTrendList: {
    marginBottom: 12,
  },
  moodTrendItem: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  moodTrendText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  medicationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    marginRight: 8,
  },
  medicationText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  medicationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
    lineHeight: 22,
  },
  summaryList: {
    marginBottom: 12,
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sentimentBar: {
    height: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    marginRight: 8,
    flex: 1,
  },
  sentimentScore: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  approvedMembersContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  memberContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
     marginTop: 20,
    marginVertical: 12,
  },
       
  centerButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
    buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
    button: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 80,
  },
    denyButton: {
    backgroundColor: '#DC2626',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalValue: {
    fontSize: 18,
    color: '#333',
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSummaryList: {
    marginBottom: 16,
  },
  modalLastUpdated: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },

});

export default FamilyAnalysis;