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
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFamilyMember, setIsFamilyMember] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleSignUp = async () => {
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
      navigation.navigate('ProfileSetupScreen');
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

            {/* Password Field with Eye Icon */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setPasswordVisible((prev) => !prev)}
              >
                <Ionicons
                  name={passwordVisible ? 'eye' : 'eye-off'}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Field with Eye Icon */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setConfirmPasswordVisible((prev) => !prev)}
              >
                <Ionicons
                  name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setIsFamilyMember(prev => !prev)}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
            >
              <View style={{
                height: 20,
                width: 20,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#3B82F6',
                backgroundColor: isFamilyMember ? '#3B82F6' : 'transparent',
                marginRight: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {isFamilyMember && <Text style={{ color: 'white', fontSize: 14 }}>✓</Text>}
              </View>
              <Text style={{ color: '#374151', fontSize: 14 }}>
                This account is for a family member
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
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
    color: 'black',
  },
  passwordContainer: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  eyeButton: {
    padding: 5,
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
