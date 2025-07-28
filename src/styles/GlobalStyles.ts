// src/styles/GlobalStyles.ts
import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
  primary: '#00351d',
  accent: '#4ecdc4',
  background: '#FFF7E3',
  card: '#fff',
  text: '#222',
  subtitle: '#6B7280',
  border: '#B0B0B0',
  disabled: '#A0A0A0',
};

export const FONTS = {
  regular: 'System',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
};

export const SIZES = {
  padding: 24,
  borderRadius: 10,
  buttonRadius: 30,
  inputHeight: 55,
  inputWidth: 55,
};

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.padding,
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
    color: COLORS.text,
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.subtitle,
    textAlign: 'center',
    marginBottom: 4,
  },
  mobile: {
    fontSize: 17,
    color: COLORS.text,
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
    width: SIZES.inputWidth,
    height: SIZES.inputHeight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    marginHorizontal: 10,
    fontSize: 22,
    textAlign: 'center',
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  resendText: {
    color: COLORS.disabled,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  resendButton: {
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.buttonRadius,
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
