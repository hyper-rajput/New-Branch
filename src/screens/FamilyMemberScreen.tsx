import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MD3Colors } from 'react-native-paper';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { fetchPendingRequestchildApi, handlePendingRequestchildApi, removeParentApi, sendRequestApi, searchFamilyApi, fetchchildApi } from '../services/api';

const Tab = createMaterialTopTabNavigator();
import { ArrowLeft, Search, UserPlus, Users, CheckCircle, Clock, X, MessageSquare, Heart, Pill, CheckSquare, Plus } from 'lucide-react-native';

interface User {
  id: string;
  name: string;
  username: string;
  status: 'online' | 'offline';
  moodScore: number;
  wellnessScore: number;
  lastActive: string;
  isConnected: boolean;
  pendingRequest?: 'sent' | 'received';
}

interface SharedData {
  medicines: { name: string; taken: boolean; time: string }[];
  tasks: { title: string; completed: boolean; category: string }[];
  mood: { score: number; note: string; timestamp: string };
  conversations: { summary: string; topics: string[]; timestamp: string }[];
}

type RootStackParamList = {
  Main: undefined;
  UserDetail: { user: User; sharedData: SharedData };
};

type MainScreenProps = NativeStackScreenProps<RootStackParamList, 'Main'>;
type UserDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'UserDetail'>;

const initialUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    username: '@sarah_wellness',
    status: 'online',
    moodScore: 85,
    wellnessScore: 92,
    lastActive: '5 min ago',
    isConnected: true,
  },
  {
    id: '2',
    name: 'Mike Chen',
    username: '@mike_health',
    status: 'offline',
    moodScore: 78,
    wellnessScore: 88,
    lastActive: '2 hours ago',
    isConnected: true,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    username: '@emma_fit',
    status: 'online',
    moodScore: 90,
    wellnessScore: 85,
    lastActive: 'Just now',
    isConnected: false,
    pendingRequest: 'received',
  },
  {
    id: '4',
    name: 'David Kumar',
    username: '@david_mindful',
    status: 'offline',
    moodScore: 82,
    wellnessScore: 90,
    lastActive: '1 hour ago',
    isConnected: false,
    pendingRequest: 'sent',
  },
];

const sharedData: SharedData = {
  medicines: [
    { name: 'Vitamin D', taken: true, time: '09:00' },
    { name: 'Omega-3', taken: false, time: '12:00' },
    { name: 'Magnesium', taken: true, time: '21:00' },
  ],
  tasks: [
    { title: 'Morning meditation', completed: true, category: 'mental' },
    { title: 'Drink 8 glasses water', completed: false, category: 'health' },
    { title: 'Evening walk', completed: false, category: 'exercise' },
  ],
  mood: {
    score: 85,
    note: 'Feeling energetic and positive today!',
    timestamp: '2 hours ago',
  },
  conversations: [
    {
      summary: 'Discussed daily routine and medicine reminders',
      topics: ['Medicine Schedule', 'Morning Routine', 'Sleep Quality'],
      timestamp: 'Yesterday',
    },
  ],
};

interface UserCardProps {
  user: User;
  navigation: any;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, navigation, onAccept, onDecline }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => user.isConnected && navigation.navigate('UserDetail', { user, sharedData })}
  >
    <View style={styles.cardContent}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name.split(' ').map((n) => n[0]).join('')}
          </Text>
        </View>
        <View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userUsername}>{user.username}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: user.status === 'online' ? '#22c55e' : '#9ca3af' },
              ]}
            />
            <Text style={styles.statusText}>{user.lastActive}</Text>
          </View>
        </View>
      </View>
      <View>
        {user.isConnected ? (
          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => navigation.navigate('UserDetail', { user, sharedData })}
          >
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
        ) : user.pendingRequest === 'sent' ? (
          <View style={styles.badgeSecondary}>
            <Text style={styles.badgeText}>Sent</Text>
          </View>
        ) : user.pendingRequest === 'received' ? (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.buttonSmall}
              onPress={() => onAccept?.(user.id)}
            >
              <CheckCircle size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonSmall, styles.buttonOutlineSmall]}
              onPress={() => onDecline?.(user.id)}
            >
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => console.log('Sync request for:', user.id)}
          >
            <UserPlus size={16} color="#374151" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

type TabProps = {
  navigation: any;
};

const SearchTab: React.FC<TabProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const result = await searchFamilyApi(searchQuery);
      if (result) {
        const searchedUser: User = {
          id: result.id || searchQuery,
          name: result.name || 'Unknown',
          username: `@${result.name?.toLowerCase().replace(' ', '_') || 'user'}`,
          status: 'offline',
          moodScore: 0,
          wellnessScore: 0,
          lastActive: 'Not connected',
          isConnected: false
        };
        setSearchResults([searchedUser]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search family member:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter UID to search family member..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      {searching ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Searching...</Text>
        </View>
      ) : searchQuery && searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No family member found.</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => <UserCard user={item} navigation={navigation} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const ConnectedTab: React.FC<TabProps> = ({ navigation }) => {
  const [users] = useState<User[]>(initialUsers);
  const connectedUsers = users.filter((user: User) => user.isConnected);

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Connected Users ({connectedUsers.length})</Text>
        <Text style={styles.tabSubtitle}>
          View and manage wellness data with your sync partners
        </Text>
      </View>
      <FlatList
        data={connectedUsers}
        renderItem={({ item }) => <UserCard user={item} navigation={navigation} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const RequestsTab: React.FC<TabProps> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const pendingRequests = users.filter((user: User) => user.pendingRequest === 'received');

  const handleAcceptRequest = (userId: string) => {
    setUsers((prev: User[]) =>
      prev.map((user: User) =>
        user.id === userId
          ? { ...user, isConnected: true, pendingRequest: undefined }
          : user
      )
    );
  };

  const handleDeclineRequest = (userId: string) => {
    setUsers((prev: User[]) =>
      prev.map((user: User) =>
        user.id === userId ? { ...user, pendingRequest: undefined } : user
      )
    );
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Sync Requests ({pendingRequests.length})</Text>
        <Text style={styles.tabSubtitle}>Manage incoming wellness sync requests</Text>
      </View>
      {pendingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      ) : (
        <FlatList
          data={pendingRequests}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              navigation={navigation}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const MainScreen: React.FC<MainScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pending requests
        const pendingData = await fetchPendingRequestchildApi();
        if (pendingData && typeof pendingData === 'object' && !Array.isArray(pendingData)) {
          const pendingUsers: User[] = Object.entries(pendingData).map(([id, item]: [string, any]) => ({
            id,
            name: item.name || '',
            username: `@${item.name?.toLowerCase().replace(' ', '_') || 'user'}`,
            status: 'offline',
            moodScore: 0,
            wellnessScore: 0,
            lastActive: 'Just now',
            isConnected: false,
            pendingRequest: 'received'
          }));
          setUsers(pendingUsers);
        }

        // Fetch connected members
        const connectedData = await fetchchildApi();
        if (connectedData && Array.isArray(connectedData)) {
          const connectedUsers: User[] = connectedData.map((item: any) => ({
            id: item.id || '',
            name: item.name || '',
            username: `@${item.name?.toLowerCase().replace(' ', '_') || 'user'}`,
            status: 'online',
            moodScore: parseInt(item.moodScore) || 0,
            wellnessScore: parseInt(item.wellnessScore) || 0,
            lastActive: 'Active',
            isConnected: true
          }));
          setUsers(prev => [...prev, ...connectedUsers]);
        }
      } catch (error) {
        console.error('Failed to fetch family members:', error);
      }
    };
    fetchData();
  }, []);

  const handleSyncRequest = async (userId: string) => {
    try {
      await sendRequestApi(userId);
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, pendingRequest: 'sent' } : user
        )
      );
    } catch (error) {
      console.error('Failed to send request:', error);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      await handlePendingRequestchildApi(userId, 'allow');
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, isConnected: true, pendingRequest: undefined }
            : user
        )
      );
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleDeclineRequest = async (userId: string) => {
    try {
      await handlePendingRequestchildApi(userId, 'declined');
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, pendingRequest: undefined } : user
        )
      );
    } catch (error) {
      console.error('Failed to decline request:', error);
    }
  };

  const handleSearch = async () => {
    try {
      const result = await searchFamilyApi(searchQuery);
      if (result) {
        const searchedUser: User = {
          id: result.id || searchQuery,
          name: result.name || 'Unknown',
          username: `@${result.name?.toLowerCase().replace(' ', '_') || 'user'}`,
          status: 'offline',
          moodScore: 0,
          wellnessScore: 0,
          lastActive: 'Not connected',
          isConnected: false
        };
        setUsers(prev => [...prev.filter(u => u.id !== searchedUser.id), searchedUser]);
      }
    } catch (error) {
      console.error('Failed to search family member:', error);
    }
  };

  const filteredUsers = searchQuery ? users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) : users;

  const connectedUsers = users.filter((user) => user.isConnected);
  const pendingRequests = users.filter((user) => user.pendingRequest === 'received');

  const UserCard = ({ user }: { user: User }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => user.isConnected && navigation.navigate('UserDetail', { user, sharedData })}
    >
      <View style={styles.cardContent}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.split(' ').map((n) => n[0]).join('')}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userUsername}>{user.username}</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: user.status === 'online' ? '#22c55e' : '#9ca3af' },
                ]}
              />
              <Text style={styles.statusText}>{user.lastActive}</Text>
            </View>
          </View>
        </View>
        <View>
          {user.isConnected ? (
            <TouchableOpacity
              style={styles.buttonOutline}
              onPress={() => navigation.navigate('UserDetail', { user, sharedData })}
            >
              <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
          ) : user.pendingRequest === 'sent' ? (
            <View style={styles.badgeSecondary}>
              <Text style={styles.badgeText}>Sent</Text>
            </View>
          ) : user.pendingRequest === 'received' ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.buttonSmall}
                onPress={() => handleAcceptRequest(user.id)}
              >
                <CheckCircle size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonSmall, styles.buttonOutlineSmall]}
                onPress={() => handleDeclineRequest(user.id)}
              >
                <X size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.buttonOutline}
              onPress={() => handleSyncRequest(user.id)}
            >
              <UserPlus size={16} color="#374151" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Sync</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Wellness Sync</Text>
            <Text style={styles.headerSubtitle}>
              {connectedUsers.length} connected • {pendingRequests.length} pending
            </Text>
            <View style={styles.badge}>
              <Users size={12} color="#15803d" />
              <Text style={styles.badgeText}>Social</Text>
            </View>
          </View>
        </View>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabs,
          tabBarIndicatorStyle: {
            backgroundColor: 'white',
            height: 36,
            borderRadius: 8,
            top: 6,
            marginHorizontal: 6,
          },
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#374151',
          tabBarLabelStyle: { fontSize: 14, fontWeight: '500', textTransform: 'none', zIndex: 1 },
          tabBarPressColor: 'transparent',
        }}
      >
        <Tab.Screen name="Search">
          {() => <SearchTab navigation={navigation} />}
        </Tab.Screen>
        <Tab.Screen name="Connected">
          {() => <ConnectedTab navigation={navigation} />}
        </Tab.Screen>
        <Tab.Screen
          name="Requests"
          options={{
            title: `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`,
          }}
        >
          {() => <RequestsTab navigation={navigation} />}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const UserDetailScreen: React.FC<UserDetailScreenProps> = ({ navigation, route }) => {
  const { user, sharedData } = route.params;
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'mood', title: 'Mood' },
    { key: 'meds', title: 'Meds' },
    { key: 'tasks', title: 'Tasks' },
    { key: 'chat', title: 'Chat' },
  ]);

  const addTaskForUser = (userId: string, task: string) => {
    console.log(`Adding task "${task}" for user ${userId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{user.name}</Text>
          <Text style={styles.headerSubtitle}>{user.username}</Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>{user.moodScore}%</Text>
          <Text style={styles.scoreLabel}>Mood Score</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>{user.wellnessScore}%</Text>
          <Text style={styles.scoreLabel}>Wellness</Text>
        </View>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabs,
          tabBarIndicatorStyle: {
            backgroundColor: 'white',
            height: 36,
            borderRadius: 8,
            top: 6,
            marginHorizontal: 6,
          },
          tabBarActiveTintColor: '#374151',
          tabBarInactiveTintColor: '#374151',
          tabBarLabelStyle: { fontSize: 14, fontWeight: '500', textTransform: 'none', zIndex: 1 },
          tabBarPressColor: 'transparent',
        }}
      >
        <Tab.Screen
          name="Mood"
          children={() => (
            <ScrollView style={styles.tabContent}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Heart size={20} color="#ef4444" />
                  <Text style={styles.cardTitle}>Mood Analysis</Text>
                </View>
                <View style={styles.moodContainer}>
                  <View style={styles.moodRow}>
                    <Text style={styles.moodLabel}>Current mood</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{sharedData.mood.score}%</Text>
                    </View>
                  </View>
                  <Text style={styles.moodNote}>{sharedData.mood.note}</Text>
                  <Text style={styles.moodTimestamp}>Updated {sharedData.mood.timestamp}</Text>
                </View>
              </View>
            </ScrollView>
          )}
        />
        <Tab.Screen
          name="Meds"
          children={() => (
            <ScrollView style={styles.tabContent}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Pill size={20} color="#a855f7" />
                  <Text style={styles.cardTitle}>Medicine Status</Text>
                </View>
                <View style={styles.moodContainer}>
                  {sharedData.medicines.map((med, index) => (
                    <View key={index} style={styles.itemCard}>
                      <View style={styles.itemRow}>
                        <CheckCircle
                          size={16}
                          color={med.taken ? '#22c55e' : '#9ca3af'}
                        />
                        <View style={styles.itemTextContainer}>
                          <Text style={styles.itemTitle}>{med.name}</Text>
                          <Text style={styles.itemSubtitle}>{med.time}</Text>
                        </View>
                      </View>
                      <View style={[styles.badge, med.taken ? styles.badgeSuccess : styles.badgeSecondary]}>
                        <Text style={[styles.badgeText, med.taken && styles.badgeTextLight]}>{med.taken ? 'Taken' : 'Pending'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        />
        <Tab.Screen
          name="Tasks"
          children={() => (
            <ScrollView style={styles.tabContent}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <CheckSquare size={20} color="#22c55e" />
                  <Text style={styles.cardTitle}>Shared Tasks</Text>
                </View>
                <View style={styles.moodContainer}>
                  {sharedData.tasks.map((task, index) => (
                    <View key={index} style={styles.itemCard}>
                      <View style={styles.itemRow}>
                        <CheckCircle
                          size={16}
                          color={task.completed ? '#22c55e' : '#9ca3af'}
                        />
                        <View style={styles.itemTextContainer}>
                          <Text style={styles.itemTitle}>{task.title}</Text>
                          <View style={styles.badgeOutline}>
                            <Text style={styles.badgeText}>{task.category}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.buttonOutline, styles.addButton]}
                    onPress={() => addTaskForUser(user.id, 'Take evening vitamins')}
                  >
                    <Plus size={16} color="#374151" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Add Task for {user.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        />
        <Tab.Screen
          name="Chat"
          children={() => (
            <ScrollView style={styles.tabContent}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MessageSquare size={20} color="#3b82f6" />
                  <Text style={styles.cardTitle}>Conversation Summary</Text>
                </View>
                <View style={styles.moodContainer}>
                  {sharedData.conversations.map((conv, index) => (
                    <View key={index} style={[styles.itemCard, styles.conversationCard]}>
                      <Text style={styles.itemSummary}>{conv.summary}</Text>
                      <View style={styles.topicsContainer}>
                        {conv.topics.map((topic, topicIndex) => (
                          <View key={topicIndex} style={styles.badgeSecondary}>
                            <Text style={styles.badgeText}>{topic}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.itemTimestamp}>{conv.timestamp}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const FamilyMemberScreen: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen
        name="Main"
        component={MainScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserDetail"
        component={UserDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
  },
  searchButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#15803d',
    marginLeft: 4,
  },
  tabs: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginHorizontal: 8,
    elevation: 0,
    height: 48,
  },
  tabContent: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    marginHorizontal: 4,
    borderColor: '#d1d5db',
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  userUsername: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 14,
    color: '#374151',
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSmall: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 8,
    marginRight: 4,
  },
  buttonOutlineSmall: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
  },
  badgeSecondary: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tabHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  tabSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  backButton: {
    padding: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e40af',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#1e40af',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    paddingBottom: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 14,
    color: '#1f2937',
  },
  moodNote: {
    fontSize: 14,
    color: '#6b7280',
    marginVertical: 8,
  },
  moodTimestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 8,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  badgeSuccess: {
    backgroundColor: '#22c55e',
  },
  badgeOutline: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  itemSummary: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 8,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
  itemTimestamp: {
    fontSize: 12,
    color: '#1e40af',
  },
  moodContainer: {
    padding: 12,
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    marginTop: 12,
    justifyContent: 'center',
  },
  conversationCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  badgeTextLight: {
    color: '#fff',
  },
});

export default FamilyMemberScreen;