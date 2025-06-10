import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

// Define the type for a family member
interface FamilyMember {
  id: string;
  name: string;
  role: string; // e.g., Parent, Child, Sibling, Grandparent
}

// Sample data for approved family members (displayed in dashboard)
const approvedMembers: FamilyMember[] = [
  // Initially empty; populated after approval
];

// Sample data for searchable elder members (replace with backend fetch later)
const availableElders: FamilyMember[] = [
  { id: '1', name: 'John Doe', role: 'Parent' },
  { id: '2', name: 'Jane Doe', role: 'Parent' },
  { id: '3', name: 'Mary Smith', role: 'Grandparent' },
  { id: '4', name: 'Robert Johnson', role: 'Grandparent' },
];

const FamilyDashboard: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredElders, setFilteredElders] = useState<FamilyMember[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>(approvedMembers);

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredElders([]);
    } else {
      // Filter elder members by name (case-insensitive) and role (Parent or Grandparent)
      const results = availableElders.filter(
        (elder) =>
          elder.name.toLowerCase().includes(query.toLowerCase()) &&
          ['Parent', 'Grandparent'].includes(elder.role) &&
          !members.find((m) => m.id === elder.id) // Exclude already added members
      );
      setFilteredElders(results);
    }
  };

  // Handle adding a member (send request)
  const handleAddRequest = (elder: FamilyMember) => {
    // Placeholder for backend request to send add request
    // Example: await sendAddRequest(elder.id);
    console.log(`Sending add request for ${elder.name} (ID: ${elder.id})`);

    Alert.alert(
      'Request Sent',
      `A request to add ${elder.name} has been sent. Waiting for their approval.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Clear search after sending request
            setSearchQuery('');
            setFilteredElders([]);
          },
        },
      ]
    );

    // Simulate approval (for testing; replace with backend logic)
    // In a real app, approval would update members via backend response
    setTimeout(() => {
      setMembers((prev) => [...prev, elder]);
      Alert.alert('Success', `${elder.name} has approved your request and is now added to your dashboard!`);
    }, 2000); // Simulated 2-second delay for approval
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
      <FlatList
        data={members}
        renderItem={renderFamilyMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No family members added yet.</Text>}
      />
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
    marginVertical: 20,
  },
  profileIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
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
    paddingHorizontal: 10,
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
    maxHeight: 200,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  memberContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
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
    marginVertical: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default FamilyDashboard;