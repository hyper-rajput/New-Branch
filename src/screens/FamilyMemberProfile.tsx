import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { logout } from '../services/api'; // Import your logout function from the API service

// Sample profile data (replace with actual data source in a real app)
const profileData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  address: '123 Main St, Springfield, USA',
  role: 'Parent',
};

const FamilyMemberProfile: React.FC = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await logout(); // Call your logout function from the API service
    // Perform any logout logic here (e.g., clear auth token)
    navigation.replace('LoginScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('FamilyDashboard')}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.profileContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{profileData.name}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{profileData.email}</Text>
        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{profileData.phone}</Text>
        <Text style={styles.label}>Address:</Text>
        <Text style={styles.value}>{profileData.address}</Text>
        <Text style={styles.label}>Role:</Text>
        <Text style={styles.value}>{profileData.role}</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  backIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  profileContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FamilyMemberProfile;