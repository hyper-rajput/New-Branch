import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { searchFamilyApi, sendRequestApi, fetchchildApi,fetchAndStoreUserDetails,removeParentApi } from '../services/api'; // Import your API service for searching family members
// Define the type for a family member
interface FamilyMember {
  name: string;// e.g., Parent, Child, Sibling, Grandparent
  status:string;
  uid: string; // Unique identifier for the family member
}

// Sample data for approved family members (displayed in dashboard)
const approvedMembers: FamilyMember[] = [
  // Initially empty; populated after approval
];

// Sample data for searchable elder members (replace with backend fetch later)

const FamilyDashboard: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredElders, setFilteredElders] = useState<FamilyMember[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>(approvedMembers);

  // Handle search input
  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setFilteredElders([]);
    } else {
      try {
      const result = await searchFamilyApi(searchQuery.trim());
      // Filter elder members by name (case-insensitive) and role (Parent or Grandparent)
      if (result && result.name) {
        const availableElders: FamilyMember[] = [
        { name: result.name, status:'search', uid:searchQuery.trim() },
      ];
        setFilteredElders(availableElders);
      } else {
        setFilteredElders([]);
      }
    } catch (error) {
      Alert.alert('Failed to search for elder members. Please try again.');
      setFilteredElders([]);
    }
    }
  };
  const handleRemove = async (item: any) => {
    try {
      await removeParentApi(item.id);
      setMembers(prev => prev.filter(member => member.uid !== item.uid));
      Alert.alert(
        'Action Confirmed',
        `Family member has been Removed.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to Remove family member.');
    }
  };

  // Handle adding a member (send request)
  const handleAddRequest = async (elder: FamilyMember) => {
    try {
      await sendRequestApi(elder.uid);

      // Add the member to the dashboard with status 'pending'
      setMembers((prev) => [
        ...prev,
        { ...elder, status: 'pending' }
      ]);

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
    } catch (error) {
      Alert.alert('Failed to send request. Please try again.');
    }
  };
    
    useEffect(() => {
      const fetchData = async () => {
        try {
          const data = await fetchchildApi();
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            const availableElders: FamilyMember[] = Object.entries(data).map(
              ([uid, item]: [string, any]) => ({
                uid,
                name: item.name || '',
                status: item.status || 'Unknown', // Default to pending, update if API provides status
              })
            );
            setMembers(availableElders);
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to fetch family members.');
        }
      };
      fetchData();
      fetchAndStoreUserDetails();
    }, []);

  // Render each approved family member item
  const renderFamilyMember = ({ item }: { item: FamilyMember }) => (
    <TouchableOpacity
      style={styles.memberContainer}
      onPress={() => navigation.navigate('MemberDetails', { memberId: item.uid, memberName: item.name })}
    >
      <Text style={styles.memberName}>{item.name}</Text>
       <Text style={styles.memberRole}>{item.status}</Text>
       <TouchableOpacity
                 style={[styles.button, styles.denyButton]}
                 onPress={() => handleRemove(item)}
               
               >
                 <Text style={styles.buttonText}>Remove</Text>
               </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render each search result item
  const renderSearchResult = ({ item }: { item: FamilyMember }) => (
    <View style={styles.searchResultContainer}>
      <View style={styles.searchResultInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        {/* <Text style={styles.memberRole}>{item.status}</Text> */}
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
          onChangeText={setSearchQuery}
          autoCapitalize="words"
        />
      </View>
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      {searchQuery !== '' && filteredElders.length > 0 && (
        <FlatList
          data={filteredElders}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.uid}
          style={styles.searchResultsList}
        />
      )}
      {searchQuery !== '' && filteredElders.length === 0 && (
        <Text style={styles.noResultsText}>No elder members found.</Text>
      )}
      <FlatList
        data={members}
        renderItem={renderFamilyMember}
        keyExtractor={(item) => item.uid}
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

});

export default FamilyDashboard;