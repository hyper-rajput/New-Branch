import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DashboardScreen from '../screens/Dashboard'; // ✅ Make sure this exists and is a valid React component
import HealthTrackingScreen from '../screens/HealthTrackingScreen';
import FamilyMemberScreen from '../screens/FamilyMemberScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MedicationReminder from '../screens/MedicationReminder';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import FamilyDashboard from '../screens/FamilyDashboard';
import FamilyMemberProfile from '../screens/FamilyMemberProfile';
import FamilyMemberProfileSetup from '../screens/FamilyMemberProfileSetup';
import MessagesScreen from '../screens/MessagesScreen'; // ✅ Make sure this exists and is a valid React component
const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen name="ProfileSetupScreen" component={ProfileSetupScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="HealthTrackingScreen" component={HealthTrackingScreen} />
       <Stack.Screen name="FamilyMemberScreen" component={FamilyMemberScreen} />
       <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
       <Stack.Screen name="MedicationReminder" component={MedicationReminder} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="FamilyDashboard" component={FamilyDashboard} />
        <Stack.Screen name="FamilyMemberProfile" component={FamilyMemberProfile} />
        <Stack.Screen name="FamilyMemberProfileSetup" component={FamilyMemberProfileSetup} />
        <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
