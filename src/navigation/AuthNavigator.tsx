import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DashboardScreen from '../screens/Dashboard'; // ✅ Make sure this exists and is a valid React component
import HealthTrackingScreen from '../screens/HealthTrackingScreen';
import FamilyMemberScreen from '../screens/FamilyMemberScreen';
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
    </Stack.Navigator>
  );
};

export default AuthNavigator;
