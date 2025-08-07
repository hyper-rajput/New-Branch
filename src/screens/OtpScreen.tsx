import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type OtpScreenProps = {
  route: { params?: { mobile?: string } };
  navigation: any;
};

const OtpScreen: React.FC<OtpScreenProps> = ({ route, navigation }) => {
  const mobile = route?.params?.mobile || '6203734467';
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Timer
  useEffect(() => {
    setCanResend(false);
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, idx: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[idx] = value;
      setOtp(newOtp);
      if (value && idx < 3) {
        inputRefs[idx + 1].current?.focus();
      } else if (!value && idx > 0) {
        inputRefs[idx - 1].current?.focus();
      }
    }
  };

  const handleResend = () => {
    Alert.alert('OTP Sent', `A new OTP has been sent to +91 ${mobile}`);
    setOtp(['', '', '', '']);
    inputRefs[0].current?.focus();
    setCanResend(false);
    setTimer(30);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleContinue = () => {
    const finalOtp = otp.join('');
    if (finalOtp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }
    // OTP Verification logic here
    Alert.alert('Success', `OTP Verified: ${finalOtp}`);
    navigation.replace('ProfileSetup'); // Navigate to next screen
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>OTP Verification</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>We have sent a verification code to</Text>
      <Text style={styles.mobile}>+91 {mobile}</Text>

      {/* OTP Boxes */}
      <View style={styles.otpRow}>
        {[0, 1, 2, 3].map((idx) => (
          <TextInput
            key={idx}
            ref={inputRefs[idx]}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            value={otp[idx]}
            onChangeText={(val) => handleOtpChange(val, idx)}
            autoFocus={idx === 0}
          />
        ))}
      </View>

      {/* Timer or Resend */}
      {!canResend ? (
        <Text style={styles.resendText}>Resend OTP in {timer} sec</Text>
      ) : (
        <TouchableOpacity style={styles.resendButton} onPress={handleResend}>
          <Text style={styles.resendButtonText}>Resend OTP</Text>
        </TouchableOpacity>
      )}

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  mobile: {
    fontSize: 17,
    color: '#222',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpInput: {
    width: 55,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#B0B0B0',
    borderRadius: 10,
    marginHorizontal: 10,
    fontSize: 22,
    textAlign: 'center',
    color: '#222',
    backgroundColor: '#fff',
  },
  resendText: {
    color: '#A0A0A0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  resendButton: {
    backgroundColor: '#00351d',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 80,
    marginTop: 20,
    alignSelf: 'center',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 40,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
