import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUser } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    // Add validation logic here if needed
    if (!email || !password || !confirmPassword) {
      Alert.alert('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match.');
      return;
    }

    try {
      await createUser(email, password);
      navigation.navigate('ProfileSetupScreen'); // example
    } catch (err) {

        if (err instanceof Error) {
            Alert.alert('Error:', err.message);
        } else {
            console.error('Unknown error:', err);
        }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.inner}>
            <Text style={styles.title}>
              Create <Text style={styles.highlight}>Account</Text>
            </Text>
            <Text style={styles.subtitle}>Let’s get started on your journey</Text>

            <TextInput
              style={styles.input}
              placeholder="Email or Phone Number"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.registerText}>
                Already have an account? <Text style={styles.highlight}>Login</Text>
              </Text>
            </TouchableOpacity>

            
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  highlight: {
    color: '#3B82F6',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#3B82F6',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    marginTop: 15,
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    marginTop: 20,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default SignUpScreen;
