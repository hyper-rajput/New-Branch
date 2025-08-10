import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Pill,
  CheckSquare,
  Mic,
  Phone,
  Heart,
  Calendar,
  Bell,
  Activity,
  Users,
  UserPlus,
  Target,
  TrendingUp,
  User,
} from 'lucide-react-native';

interface MainDashboardProps {
  navigation: any; // Assuming navigation prop from @react-navigation/native
  autoVoiceStarted: boolean;
}

const DashboardScreen: React.FC<MainDashboardProps> = ({ navigation, autoVoiceStarted }) => {
  const [connectedUsers, setConnectedUsers] = useState(3);
  const [userStats, setUserStats] = useState({
    currentWeight: '72 kg',
    goalWeight: '68 kg',
    stepsToday: 8420,
    caloriesBurned: 345,
    heartRate: 72,
    weeklyGoals: 5,
    completedGoals: 3,
  });

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const CustomAvatar = ({ initials, size = 32 }: { initials: string; size?: number }) => (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );

  const CustomBadge = ({
    children,
    backgroundColor,
    textColor,
    borderColor,
  }: {
    children: React.ReactNode;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
  }) => (
    <View
      style={[
        styles.badge,
        backgroundColor && { backgroundColor },
        borderColor && { borderColor, borderWidth: 1 },
      ]}
    >
      <Text style={[styles.badgeText, textColor && { color: textColor }]}>{children}</Text>
    </View>
  );

  // Component methods can be added here if needed

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Profile */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>SyncKi</Text>
            <Text style={styles.headerDate}>{currentDate}</Text>
            <Text style={styles.headerTime}>{currentTime}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('profile')}
          >
            <CustomAvatar initials="JD" size={32} />
          </TouchableOpacity>
        </View>

        {/* Health Status Overview */}
        <LinearGradient
          colors={['#eff6ff', '#ecfdf5']}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Heart size={20} color="#1e40af" />
            <Text style={styles.cardTitle}>Today's Wellness</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Medicines</Text>
                <CustomBadge backgroundColor="#e5e7eb">2/3</CustomBadge>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Tasks</Text>
                <CustomBadge backgroundColor="#e5e7eb">4/6</CustomBadge>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Steps</Text>
                <CustomBadge backgroundColor="#22c55e" textColor="#fff">
                  {userStats.stepsToday.toLocaleString()}
                </CustomBadge>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Goals</Text>
                <CustomBadge backgroundColor="#a855f7" textColor="#fff">
                  {userStats.completedGoals}/{userStats.weeklyGoals}
                </CustomBadge>
              </View>
            </View>
            <View style={styles.wellnessScoreContainer}>
              <View style={styles.wellnessScoreCard}>
                <Text style={styles.wellnessScore}>87%</Text>
                <Text style={styles.wellnessScoreLabel}>Wellness Score</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* User Sync Card */}
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Friends' })}>
          <LinearGradient
            colors={['#ecfdf5', '#ccfbf1']}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <View style={styles.userSyncHeader}>
                <View style={styles.iconCircle}>
                  <Users size={24} color="#047857" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Wellness Sync</Text>
                  <Text style={styles.cardSubtitle}>
                    {connectedUsers} connected • Share health data
                  </Text>
                </View>
                <TouchableOpacity style={styles.connectButton}>
                  <UserPlus size={16} color="#047857" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Connect</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.avatarGroup}>
                <CustomAvatar initials="SJ" size={24} />
                <CustomAvatar initials="MC" size={24} />
                <CustomAvatar initials="EW" size={24} />
                <View style={[styles.avatar, { width: 24, height: 24, borderRadius: 12 }]}>
                  <Text style={styles.avatarText}>+</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <View style={styles.grid}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Medicine' })}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#faf5ff', '#fdf2f8']}
              style={styles.actionCard}
            >
              <View style={styles.iconCircle}>
                <Pill size={24} color="#9333ea" />
              </View>
              <Text style={styles.actionTitle}>Medicine</Text>
              <Text style={styles.actionSubtitle}>Track & sync</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Tasks' })}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#ecfdf5', '#eff6ff']}
              style={styles.actionCard}
            >
              <View style={styles.iconCircle}>
                <CheckSquare size={24} color="#22c55e" />
              </View>
              <Text style={styles.actionTitle}>Tasks</Text>
              <Text style={styles.actionSubtitle}>Daily & sync</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Health' })}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#fef2f2', '#ffedd5']}
              style={styles.actionCard}
            >
              <View style={styles.iconCircle}>
                <Heart size={24} color="#dc2626" />
              </View>
              <Text style={styles.actionTitle}>Health</Text>
              <Text style={styles.actionSubtitle}>Vitals & sync</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('goals')}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#fefce8', '#fef3c7']}
              style={styles.actionCard}
            >
              <View style={styles.iconCircle}>
                <Target size={24} color="#d97706" />
              </View>
              <Text style={styles.actionTitle}>Goals</Text>
              <Text style={styles.actionSubtitle}>Track & achieve</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions Row */}
        <View style={styles.grid}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('calls')}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#eef2ff', '#f5f3ff']}
              style={styles.secondaryActionCard}
            >
              <View style={styles.iconCircleSmall}>
                <Phone size={20} color="#4f46e5" />
              </View>
              <Text style={styles.actionTitle}>AI Calls</Text>
              <Text style={styles.actionSubtitle}>Schedule</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('voice')}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#eff6ff', '#e0f7fa']}
              style={styles.secondaryActionCard}
            >
              <View style={styles.iconCircleSmall}>
                <Mic size={20} color="#0284c7" />
              </View>
              <Text style={styles.actionTitle}>Chat AI</Text>
              <Text style={styles.actionSubtitle}>Full mode</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Upcoming Reminders */}
        <LinearGradient
          colors={['#f8fafc', '#f1f5f9']}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#e2e8f0' }]}>
              <Bell size={20} color="#475569" />
            </View>
            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>Next Actions</Text>
              <Text style={styles.cardSubtitle}>Today's schedule</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={[styles.reminderItem, styles.reminderItemPill]}>
              <View style={styles.reminderContent}>
                <View style={[styles.reminderIcon, { backgroundColor: '#fef9c3' }]}>
                  <Pill size={16} color="#ca8a04" />
                </View>
                <View>
                  <Text style={styles.reminderTitle}>Vitamin D</Text>
                  <Text style={styles.reminderSubtitle}>Today, 2:00 PM</Text>
                </View>
              </View>
              <CustomBadge backgroundColor="#fef9c3" textColor="#854d0e">1 hour</CustomBadge>
            </View>
            <View style={[styles.reminderItem, styles.reminderItemActivity]}>
              <View style={styles.reminderContent}>
                <View style={[styles.reminderIcon, { backgroundColor: '#dbeafe' }]}>
                  <Activity size={16} color="#2563eb" />
                </View>
                <View>
                  <Text style={styles.reminderTitle}>Evening Walk</Text>
                  <Text style={styles.reminderSubtitle}>Today, 6:00 PM</Text>
                </View>
              </View>
              <CustomBadge backgroundColor="#dbeafe" textColor="#1d4ed8">5 hours</CustomBadge>
            </View>
            <View style={[styles.reminderItem, styles.reminderItemTarget]}>
              <View style={styles.reminderContent}>
                <View style={[styles.reminderIcon, { backgroundColor: '#dcfce7' }]}>
                  <Target size={16} color="#16a34a" />
                </View>
                <View>
                  <Text style={styles.reminderTitle}>Weight Check</Text>
                  <Text style={styles.reminderSubtitle}>Tomorrow, 8:00 AM</Text>
                </View>
              </View>
              <CustomBadge backgroundColor="#dcfce7" textColor="#15803d">Goal</CustomBadge>
            </View>
            <View style={[styles.reminderItem, styles.reminderItemMissed]}>
              <View style={styles.reminderContent}>
                <View style={[styles.reminderIcon, { backgroundColor: '#fee2e2' }]}>
                  <Pill size={16} color="#dc2626" />
                </View>
                <View>
                  <Text style={styles.reminderTitle}>Blood Pressure Med</Text>
                  <Text style={styles.reminderSubtitle}>Missed - 8:00 AM</Text>
                </View>
              </View>
              <CustomBadge backgroundColor="#fee2e2" textColor="#dc2626">Missed</CustomBadge>
            </View>
          </View>
        </LinearGradient>

        {/* Friends Activity Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TrendingUp size={20} color="#374151" />
            <Text style={styles.cardTitle}>Friends Activity</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.activityItem}>
              <View style={styles.activityContent}>
                <CustomAvatar initials="SJ" size={24} />
                <View>
                  <Text style={styles.activityTitle}>Sarah completed morning meditation</Text>
                  <Text style={styles.activitySubtitle}>2 hours ago</Text>
                </View>
              </View>
              <CustomBadge textColor="#16a34a" borderColor="#bbf7d0">
                <Heart size={12} color="#16a34a" style={styles.badgeIcon} />
                92%
              </CustomBadge>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityContent}>
                <CustomAvatar initials="MC" size={24} />
                <View>
                  <Text style={styles.activityTitle}>Mike reached his step goal</Text>
                  <Text style={styles.activitySubtitle}>4 hours ago</Text>
                </View>
              </View>
              <CustomBadge textColor="#2563eb" borderColor="#bfdbfe">
                <Target size={12} color="#2563eb" style={styles.badgeIcon} />
                10k
              </CustomBadge>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Friends')}
            >
              <Text style={styles.buttonText}>View All Friends Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 80, // Adjusted padding for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  headerTime: {
    fontSize: 16,
    color: '#374151',
    marginTop: 2,
  },
  profileButton: {
    borderRadius: 16,
    padding: 4,
  },
  avatar: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  cardContent: {
    padding: 12,
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  actionCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  badge: {
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '500',
  },
  badgeIcon: {
    marginRight: 3,
  },
  wellnessScoreContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  wellnessScoreCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  wellnessScore: {
    fontSize: 24,
    fontWeight: '600',
    color: '#22c55e',
  },
  wellnessScoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  userSyncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccfbf1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginLeft: 'auto',
  },
  buttonText: {
    fontSize: 14,
    color: '#047857',
  },
  buttonIcon: {
    marginRight: 4,
  },
  avatarGroup: {
    flexDirection: 'row',
    marginLeft: -8,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  secondaryActionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  iconCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // reminderItem styles moved to bottom
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: 6,
  },
  reminderSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 6,
    marginTop: 1,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    marginBottom: 6,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: 6,
  },
  activitySubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 6,
    marginTop: 1,
  },
  viewAllButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  reminderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderItemPill: {
    borderLeftWidth: 3,
    borderLeftColor: '#ca8a04',
  },
  reminderItemActivity: {
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  reminderItemTarget: {
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
  },
  reminderItemMissed: {
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
});

export default DashboardScreen;