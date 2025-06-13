import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

// Define the type for a family member
interface FamilyMember {
  id: string;
  name: string;
  role: string;
}

// Define the type for chat summary analysis
interface ChatSummary {
  moodTrend: string;
  topicsDiscussed: string[];
  concerns: string[];
  lastUpdated: string;
  engagementLevel: string;
  sentimentScore: number;
}

// Sample data for approved family members
const approvedMembers: FamilyMember[] = [];

// Sample data for searchable elder members
const availableElders: FamilyMember[] = [
  { id: '1', name: 'John Doe', role: 'Parent' },
  { id: '2', name: 'Jane Doe', role: 'Parent' },
  { id: '3', name: 'Mary Smith', role: 'Grandparent' },
  { id: '4', name: 'Robert Johnson', role: 'Grandparent' },
];

// Sample data for new compartments (placeholder for frontend)
const elderMood = {
  mood: 'Happy',
  emoji: '😊',
  lastUpdated: 'Today, 10:30 AM',
  moodDescription: 'Your elder has been feeling cheerful and engaged today, showing a positive outlook.',
  moodTrend: ['Content', 'Happy', 'Calm'], // Last 3 days
};

const medicationStatus = {
  allTaken: true,
  lastUpdated: 'Today, 8:00 AM',
  missedDoses: 0,
  adherenceRate: 95, // Percentage over the last week
  nextDose: '12:00 PM - Metformin 500mg',
};

// Sample chat summary analysis (placeholder for frontend)
const chatSummary: ChatSummary = {
  moodTrend: 'Generally Positive',
  topicsDiscussed: ['Daily activities', 'Health updates', 'Family memories'],
  concerns: ['Mild forgetfulness noted', 'Requested more social activities'],
  lastUpdated: 'Today, 10:00 AM',
  engagementLevel: 'High',
  sentimentScore: 82, // Out of 100
};

const FamilyDashboard: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredElders, setFilteredElders] = useState<FamilyMember[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>(approvedMembers);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredElders([]);
    } else {
      const results = availableElders.filter(
        (elder) =>
          elder.name.toLowerCase().includes(query.toLowerCase()) &&
          ['Parent', 'Grandparent'].includes(elder.role) &&
          !members.find((m) => m.id === elder.id)
      );
      setFilteredElders(results);
    }
  };

  // Handle adding a member (send request)
  const handleAddRequest = (elder: FamilyMember) => {
    console.log(`Sending add request for ${elder.name} (ID: ${elder.id})`);
    Alert.alert(
      'Request Sent',
      `A request to add ${elder.name} has been sent. Waiting for their approval.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setSearchQuery('');
            setFilteredElders([]);
          },
        },
      ]
    );

    // Simulate approval
    setTimeout(() => {
      setMembers((prev) => [...prev, elder]);
      Alert.alert('Success', `${elder.name} has approved your request and is now added to your dashboard!`);
    }, 2000);
  };

  // Render each approved family member item
  const renderFamilyMember = ({ item }: { item: FamilyMember }) => (
    <TouchableOpacity
      style={styles.memberContainer}
      onPress={() => navigation.navigate('MemberDetails', { memberId: item.id, memberName: item.name })}
    >
      <Text style={styles.memberName}>{item.name}</Text>
      <Text style={styles.memberRole}>{item.role}</Text>
    </TouchableOpacity>
  );

  // Render each search result item
  const renderSearchResult = ({ item }: { item: FamilyMember }) => (
    <View style={styles.searchResultContainer}>
      <View style={styles.searchResultInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>{item.role}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddRequest(item)}
      >
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('FamilyMemberProfile')}
          style={styles.profileIcon}
        >
          <Ionicons name="person-circle-outline" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Family Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search elder family member..."
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="words"
          />
        </View>

        {/* Search Results */}
        {searchQuery !== '' && filteredElders.length > 0 && (
          <FlatList
            data={filteredElders}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            style={styles.searchResultsList}
          />
        )}
        {searchQuery !== '' && filteredElders.length === 0 && (
          <Text style={styles.noResultsText}>No elder members found.</Text>
        )}

        {/* Mood Compartment */}
        <View style={styles.compartment}>
          <Text style={styles.compartmentTitle}>Elder's Mood Overview</Text>
          <View style={styles.compartmentContent}>
            <Text style={styles.moodText}>
              {elderMood.mood} {elderMood.emoji}
            </Text>
            <Text style={styles.moodDescription}>{elderMood.moodDescription}</Text>
            <Text style={styles.label}>Mood Trend (Last 3 Days):</Text>
            <FlatList
              data={elderMood.moodTrend}
              renderItem={renderMoodTrend}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.moodTrendList}
            />
            <Text style={styles.lastUpdated}>Last Updated: {elderMood.lastUpdated}</Text>
          </View>
        </View>

        {/* Medication Status Compartment */}
        <View style={styles.compartment}>
          <Text style={styles.compartmentTitle}>Medication Adherence</Text>
          <View style={styles.compartmentContent}>
            <View style={styles.medicationStatusRow}>
              <MaterialIcons
                name={medicationStatus.allTaken ? 'check-circle' : 'cancel'}
                size={24}
                color={medicationStatus.allTaken ? '#4CAF50' : '#F44336'}
                style={styles.statusIcon}
              />
              <Text style={styles.medicationText}>
                {medicationStatus.allTaken
                  ? 'All medicines taken today'
                  : 'Some medicines missed today'}
              </Text>
            </View>
            <View style={styles.medicationDetailRow}>
              <Text style={styles.label}>Missed Doses (Last 7 Days):</Text>
              <Text style={styles.value}>{medicationStatus.missedDoses}</Text>
            </View>
            <View style={styles.medicationDetailRow}>
              <Text style={styles.label}>Adherence Rate:</Text>
              <Text style={styles.value}>{medicationStatus.adherenceRate}%</Text>
            </View>
            <View style={styles.medicationDetailRow}>
              <Text style={styles.label}>Next Dose:</Text>
              <Text style={styles.value}>{medicationStatus.nextDose}</Text>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Schedule</Text>
            </TouchableOpacity>
            <Text style={styles.lastUpdated}>Last Updated: {medicationStatus.lastUpdated}</Text>
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
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Engagement Level:</Text>
              <Text style={styles.value}>{chatSummary.engagementLevel}</Text>
            </View>
            <Text style={styles.label}>Sentiment Score:</Text>
            <View style={styles.sentimentContainer}>
              <View style={[styles.sentimentBar, { width: `${chatSummary.sentimentScore}%` }]} />
              <Text style={styles.sentimentScore}>{chatSummary.sentimentScore}/100</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Mood Trend:</Text>
              <Text style={styles.value}>{chatSummary.moodTrend}</Text>
            </View>
            <Text style={styles.label}>Topics Discussed:</Text>
            <FlatList
              data={chatSummary.topicsDiscussed}
              renderItem={renderTopic}
              keyExtractor={(item, index) => index.toString()}
              style={styles.summaryList}
            />
            <Text style={styles.label}>Concerns Noted:</Text>
            <FlatList
              data={chatSummary.concerns}
              renderItem={renderConcern}
              keyExtractor={(item, index) => index.toString()}
              style={styles.summaryList}
            />
            <Text style={styles.lastUpdated}>Last Updated: {chatSummary.lastUpdated}</Text>
          </View>
        </View>

        {/* Approved Family Members */}
        <View style={styles.approvedMembersContainer}>
          <FlatList
            data={members}
            renderItem={renderFamilyMember}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No family members added yet.</Text>}
          />
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
              <Text style={styles.modalLabel}>Engagement Level:</Text>
              <Text style={styles.modalValue}>{chatSummary.engagementLevel}</Text>
            </View>
            <Text style={styles.modalLabel}>Sentiment Score:</Text>
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
            <Text style={styles.modalLastUpdated}>Last Updated: {chatSummary.lastUpdated}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

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
    marginVertical: 12,
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

export default FamilyDashboard;