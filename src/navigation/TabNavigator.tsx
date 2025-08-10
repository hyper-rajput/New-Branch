import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import {
  Heart,
  Pill,
  CheckSquare,
  Activity,
  Users,
} from 'lucide-react-native';

import Dashboard from '../screens/Dashboard';
import MedicationReminder from '../screens/MedicationReminder';
import TaskReminderScreen from '../screens/TaskReminderScreen';
import HealthTrackingScreen from '../screens/HealthTrackingScreen';
import FamilyMemberScreen from '../screens/FamilyMemberScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const renderTabBarIcon = (Icon: any, focused: boolean) => (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Icon size={24} color={focused ? '#047857' : '#6b7280'} />
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#047857',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Dashboard}
        options={{
          tabBarIcon: ({ focused }) => renderTabBarIcon(Heart, focused),
        }}
      />
      <Tab.Screen
        name="Medicine"
        component={MedicationReminder}
        options={{
          tabBarIcon: ({ focused }) => renderTabBarIcon(Pill, focused),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskReminderScreen}
        options={{
          tabBarIcon: ({ focused }) => renderTabBarIcon(CheckSquare, focused),
        }}
      />
      <Tab.Screen
        name="Health"
        component={HealthTrackingScreen}
        options={{
          tabBarIcon: ({ focused }) => renderTabBarIcon(Activity, focused),
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FamilyMemberScreen}
        options={{
          tabBarIcon: ({ focused }) => renderTabBarIcon(Users, focused),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 8,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#ecfdf5',
  },
});

export default TabNavigator;
