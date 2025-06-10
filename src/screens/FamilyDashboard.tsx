import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

// Define the type for a family member
interface FamilyMember {
  id: string;
  name: string;
  role: string; // e.g., Parent, Child, Sibling
}

// Sample data for family members (replace with actual data source in a real app)
const familyMembers: FamilyMember[] = [
  { id: '1', name: 'John Doe', role: 'Parent' },
  { id: '2', name: 'Jane Doe', role: 'Parent' },
  { id: '3', name: 'Alex Doe', role: 'Child' },
  { id: '4', name: 'Emma Doe', role: 'Child' },
];

const FamilyDashboard: React.FC = () => {
  const navigation = useNavigation();

  // Render each family member item
  const renderFamilyMember = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberContainer}>
      <Text style={styles.memberName}>{item.name}</Text>
      <Text style={styles.memberRole}>{item.role}</Text>
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
      <FlatList
        data={familyMembers}
        renderItem={renderFamilyMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
});

export default FamilyDashboard;