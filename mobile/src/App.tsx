import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Attendance from './screens/Attendance';
import Children from './screens/Children';
import Dashboard from './screens/Dashboard';
import Events from './screens/Events';
import Fees from './screens/Fees';
import Login from './screens/Login';
import Messages from './screens/Messages';
import Performance from './screens/Performance';
import Profile from './screens/Profile';

type TabKey = 'dashboard' | 'children' | 'performance' | 'fees' | 'attendance' | 'messages' | 'events' | 'profile' | 'login';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'dashboard', label: 'Home' },
  { key: 'children', label: 'Children' },
  { key: 'performance', label: 'Results' },
  { key: 'fees', label: 'Fees' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'messages', label: 'Messages' },
  { key: 'events', label: 'Events' },
  { key: 'profile', label: 'Profile' }
];

function renderScreen(activeTab: TabKey) {
  if (activeTab === 'children') return <Children />;
  if (activeTab === 'performance') return <Performance />;
  if (activeTab === 'fees') return <Fees />;
  if (activeTab === 'attendance') return <Attendance />;
  if (activeTab === 'messages') return <Messages />;
  if (activeTab === 'events') return <Events />;
  if (activeTab === 'profile') return <Profile />;
  if (activeTab === 'login') return <Login />;
  return <Dashboard />;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>{renderScreen(activeTab)}</View>
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tab, activeTab === tab.key && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#eef4fb' },
  content: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#dbe3ef',
    backgroundColor: 'rgba(255,255,255,0.94)'
  },
  tab: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc'
  },
  activeTab: { backgroundColor: '#0f172a' },
  tabText: { color: '#334155', fontSize: 12, fontWeight: '800' },
  activeTabText: { color: '#ffffff' }
});
