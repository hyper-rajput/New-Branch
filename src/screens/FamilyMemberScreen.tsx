import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { fetchPendingRequestchildApi, handlePendingRequestchildApi, removeParentApi } from '../services/api';

// Define types for family member data
interface FamilyMember {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'declined';
}

const FamilyMembersScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchPendingRequestchildApi();
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setFamilyMembers(
            Object.entries(data).map(([id, item]: [string, any]) => ({
              id,
              email: item.email || '',
              name: item.name || '',
              status: item.status, // Default to pending, update if API provides status
            }))
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch family members.');
      }
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    if (!searchEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    const newMember: FamilyMember = {
      id: Math.random().toString(),
      email: searchEmail,
      name: `User ${familyMembers.length + 1}`,
      status: 'pending',
    };
    setFamilyMembers([...familyMembers, newMember]);
    setSearchEmail('');
  };

  const handleAction = async (id: string, action: 'allow' | 'declined') => {
    try {
      await handlePendingRequestchildApi(id,action);
      setFamilyMembers(prev =>
        prev.map(member =>
          member.id === id
            ? { ...member, status: action === 'allow' ? 'approved' : 'declined' }
            : member
        )
      );
      Alert.alert(
        'Action Confirmed',
        `Family member has been ${action === 'allow' ? 'approved' : 'decline'}.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update family member status.');
    }
  };
  
  const handleRemove = async (item: any) => {
    try {
      await removeParentApi(item.id);
      setFamilyMembers(prev => prev.filter(member => member.id !== item.id));
      Alert.alert(
        'Action Confirmed',
        `Family member has been Removed.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to Remove family member.');
    }
  };

  const renderItem = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberContainer}>
      <Text style={styles.memberText}>{item.name} ({item.email})</Text>
      <Text style={styles.statusText}>Status: {item.status}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.approveButton,
            (item.status === 'approved' || item.status === 'declined') && styles.disabledButton
          ]}
          onPress={() => {
            if (!(item.status === 'approved' || item.status === 'declined')) {
              handleAction(item.id, 'allow');
            }
          }}
          pointerEvents={(item.status === 'approved' || item.status === 'declined') ? 'none' : 'auto'}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        {item.status === 'pending' ? 
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={() => handleAction(item.id, 'declined')}
        >
          <Text style={styles.buttonText}>Deny</Text>
        </TouchableOpacity>
      : <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={() => handleRemove(item)}
        
        >
          <Text style={styles.buttonText}>Remove</Text>
        </TouchableOpacity>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
          accessibilityLabel="Go back to dashboard"
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Family Members</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter email to add"
          value={searchEmail}
          onChangeText={setSearchEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Search family member by email"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={familyMembers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No family members found.</Text>}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#1F2A44',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
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
  memberText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2A44',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
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
  disabledButton: {
    backgroundColor: '#E2E8F0',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 24,
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default FamilyMembersScreen;