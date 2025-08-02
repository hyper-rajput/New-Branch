import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../services/api';

const FamilyMemberProfile: React.FC = () => {
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    relation: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDetailsString = await AsyncStorage.getItem("userDetails");
        if (userDetailsString) {
          const userDetails = JSON.parse(userDetailsString);
          setProfileData({
            name: userDetails.name || 'not set',
            email: userDetails.email || 'not set',
            phone: userDetails.phone || 'not set',
            address: userDetails.address || 'not set',
            role: userDetails.relation || 'not set',
          });
        }
      } catch (error) {
        // Handle error if needed
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    setLoading(false);
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
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logoutButtonText}>Logout</Text>
        )}
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