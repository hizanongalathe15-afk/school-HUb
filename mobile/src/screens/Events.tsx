import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppButton, AppCard, Screen, colors } from '../components';
import { mobileApi } from '../services';
import type { SchoolEvent } from '../types';

export default function Events() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  useEffect(() => {
    mobileApi.getEvents().then(setEvents);
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Events</Text>
        {events.map((event) => (
          <AppCard key={event.id} title={event.title} subtitle={`${event.date} · ${event.location}`}>
            <Text style={styles.line}>Status: {event.status}</Text>
            <Text style={styles.line}>Consent: {event.consentRequired ? 'Required' : 'Not required'}</Text>
            {event.consentRequired ? <AppButton label="Sign consent" /> : null}
          </AppCard>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  line: { color: colors.muted }
});
