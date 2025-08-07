import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  ProfileSetup: { stepKey: string; returnToSummary: boolean };
  ProfileSetupSummary: { onDone: () => void } | undefined;
  Dashboard: undefined;
};

type ProfileSetupSummaryProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSetupSummary'>;
  route: {
    params: {
      formData: { [key: string]: string | string[] };
    };
  };
};

const ProfileSetupSummary: React.FC<ProfileSetupSummaryProps> = ({ navigation, route }) => {
  const { formData } = route.params;
  const [editableData, setEditableData] = React.useState(formData);
  const [editingKey, setEditingKey] = React.useState<string | null>(null);

  const validateAge = (age: string) => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) return "Please enter a valid age.";
    if (ageNum < 13 || ageNum > 100) return "Age must be between 13 and 100.";
    return null;
  };

  const handleEdit = (key: string, newValue: string) => {
    if (key === 'age') {
      const error = validateAge(newValue);
      if (error) {
        Alert.alert('Validation Error', error);
        return;
      }
    }
    setEditableData((prev) => ({ ...prev, [key]: newValue }));
    setEditingKey(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2B2B2B" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Summary</Text>
      </View>

      <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {Object.entries(editableData).map(([key, value]) => (
          <View key={key} style={styles.summaryItem}>
            <View style={styles.itemRow}>
              <Text style={styles.itemKey}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</Text>
              <TouchableOpacity
                onPress={() => setEditingKey(key)}
              >
                <MaterialIcons name="edit" size={20} color="#F47C4B" />
              </TouchableOpacity>
            </View>
            {editingKey === key ? (
              <TextInput
                style={styles.itemValue}
                value={Array.isArray(value) ? value.join(', ') : value}
                onChangeText={(text) => handleEdit(key, text)}
                placeholder={`Edit your ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                placeholderTextColor="#6B6B6B"
                keyboardType={key === 'age' ? 'numeric' : 'default'}
              />
            ) : (
              <Text style={styles.itemValue}>{Array.isArray(value) ? value.join(', ') : value}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.replace('Dashboard')}
        >
          <Text style={styles.doneButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingRight: 24,
    marginBottom: 8,
    position: 'relative',
  },
  title: {
    color: '#2B2B2B',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 24,
    padding: 4,
    zIndex: 2,
  },
  summaryItem: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemKey: {
    color: '#2B2B2B',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemValue: {
    color: '#6B6B6B',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
  bottomNav: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: '#2B2B2B',
    borderRadius: 40,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ProfileSetupSummary;
