import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Image, Dimensions } from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';


const LoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState("");

  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    try {
      const confirmationResult = await auth().signInWithPhoneNumber(`+91${mobile}`);
      setConfirmation(confirmationResult);
      navigation.navigate("OtpScreen", { mobile, confirmation: confirmationResult });
    } catch (error) {
      setError("Failed to send OTP. Please try again.");
    }
  };

  const handleFamilyLogin = () => {
    navigation.navigate("OtpScreen", { redirectTo: "FamilyDashboard" });
  };
  const [phoneNumber, setPhoneNumber] = useState('');
const [confirmation, setConfirmation] = useState(null);

const signInWithPhoneNumber = async (number) => {
  try {
    const confirmationResult = await auth().signInWithPhoneNumber(number);
    setConfirmation(confirmationResult);
    // You can now show the OTP input field to the user
  } catch (error) {
    // Handle errors, e.g., invalid phone number
    console.error(error);
  }
};

  const { width } = Dimensions.get('window');
  return (
    <SafeAreaView style={styles.container}>
      {/* Top landing image (flexible) */}
      <View style={{ width: '100%', height: width * 1.1 }}>
        <Image
          source={require('../../resources/LandingPageImage.jpg')}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,1)']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
          start={{ x: 0.5, y: 0.2 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
      <View style={{ alignItems: 'center', marginTop: -width * 0.18, marginBottom: width * 0.001 }}>
        <Image
          source={require('../../resources/ElderIcon.png')}
          style={{
            width: width * 0.18,
            height: width * 0.18,
            resizeMode: 'contain',
          }}
        />
      </View>
      <View style={[styles.innerContainer, { flex: 1, justifyContent: 'flex-start', paddingTop: 0, paddingBottom: 0, width: '100%' }]}> 
        <Text style={styles.logoText}>Lumia</Text>
        <Text style={styles.heading}>India's last minute app</Text>
        <Text style={styles.subheading}>Log in or sign up</Text>
        <View style={styles.inputRow}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            placeholderTextColor="#A0A0A0"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={text => {
              setMobile(text.replace(/[^0-9]/g, ""));
              if (error) setError("");
            }}
          />
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: mobile.length === 10 ? '#4CAF50' : '#A3A3A3' },
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>OR</Text>
        <TouchableOpacity style={styles.skipLoginButton} onPress={handleFamilyLogin}>
          <Text style={styles.skipLoginButtonText}>Go for Family Login</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.footer, { marginBottom: Platform.OS === 'ios' ? 8 : 4, width: '10%' }]}> 
        <Text style={styles.footerText}>
          By continuing, you agree to our <Text style={styles.link}>Terms of Service</Text> & <Text style={styles.link}>Privacy policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  topImageContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  // For your image: add a style like topImage if needed
  skipLoginButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  skipLoginButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#e11d48',
    fontSize: 14,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  middleIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    alignSelf: 'center',
    marginBottom: 2,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'ArialRoundedMTBold' : 'sans-serif-condensed',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 2,
  },
  subheading: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 18,
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 18,
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryCode: {
    fontSize: 16,
    color: '#222',
    marginRight: 8,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  continueButton: {
    backgroundColor: '#A3A3A3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  orText: {
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 8,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;