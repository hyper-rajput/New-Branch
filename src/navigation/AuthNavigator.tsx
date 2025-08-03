import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DashboardScreen from '../screens/Dashboard'; // ✅ Make sure this exists and is a valid React component
import HealthTrackingScreen from '../screens/HealthTrackingScreen';
import FamilyMemberScreen from '../screens/FamilyMemberScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MedicationReminder from '../screens/MedicationReminder';
import SplashScreen from '../screens/SplashScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import FamilyDashboard from '../screens/FamilyDashboard';
import FamilyMemberProfile from '../screens/FamilyMemberProfile';
import FamilyMemberProfileSetup from '../screens/FamilyMemberProfileSetup';
import FamilyAnalysis from '../screens/FamilyAnalysis';
import MessagesScreen from '../screens/MessagesScreen'; // ✅ Make sure this exists and is a valid React component
import FamilySchedule from '../screens/FamilySchedule';
import ProfileSetupSummary from '../screens/ProfileSetupSummary';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="SplashScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name ='SplashScreen' component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="OtpScreen" component={OtpScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
              <Stack.Screen
        name="ProfileSetupSummary"
        component={ProfileSetupSummary}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="HealthTrackingScreen" component={HealthTrackingScreen} />
       <Stack.Screen name="FamilyMemberScreen" component={FamilyMemberScreen} />
       <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
       <Stack.Screen name="MedicationReminder" component={MedicationReminder} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="FamilyDashboard" component={FamilyDashboard} />
        <Stack.Screen name="FamilyAnalysis" component={FamilyAnalysis} />
        <Stack.Screen name="FamilyMemberProfile" component={FamilyMemberProfile} />
        <Stack.Screen name='FamilySchedule' component={FamilySchedule} />
        <Stack.Screen name="FamilyMemberProfileSetup" component={FamilyMemberProfileSetup} />
        <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

type RootStackParamList = {
  SplashScreen: undefined;
  LoginScreen: undefined;
  OtpScreen: undefined;
  SignUpScreen: undefined;
  ProfileSetup: undefined;
  ProfileSetupSummary: { formData: { [key: string]: string | string[] } };
  Dashboard: undefined;
  HealthTrackingScreen: undefined;
  FamilyMemberScreen: undefined;
  ProfileScreen: undefined;
  MedicationReminder: undefined;
  ForgotPasswordScreen: undefined;
  FamilyDashboard: undefined;
  FamilyAnalysis: undefined;
  FamilyMemberProfile: undefined;
  FamilySchedule: undefined;
  FamilyMemberProfileSetup: undefined;
  MessagesScreen: undefined;
};
