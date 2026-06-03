import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppButton, AppCard, Screen, colors } from '../components';
import { mobileApi } from '../services';
import type { MobileUser } from '../types';

export default function Profile() {
  const [profile, setProfile] = useState<MobileUser | null>(null);

  useEffect(() => {
    mobileApi.getProfile().then(setProfile);
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>
        <AppCard title={profile?.name || 'Parent profile'} subtitle={profile?.email || 'Loading profile'}>
          <Text style={styles.line}>Phone: {profile?.phone || '-'}</Text>
          <Text style={styles.line}>Language: {profile?.preferredLanguage || 'en'}</Text>
          <Text style={styles.line}>Security: {profile?.twoFactorEnabled ? '2FA enabled' : '2FA not enabled'}</Text>
          <AppButton label="Manage account security" />
        </AppCard>
        <AppCard title="Notification preferences" subtitle="Control school alerts across all channels.">
          <Text style={styles.line}>SMS fee reminders enabled</Text>
          <Text style={styles.line}>WhatsApp announcements enabled</Text>
          <Text style={styles.line}>Weekly email digest enabled</Text>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  line: { color: colors.muted, lineHeight: 22 }
});
