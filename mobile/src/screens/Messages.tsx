import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppButton, AppCard, Screen, colors } from '../components';
import { mobileApi } from '../services';
import type { ParentMessage } from '../types';

export default function Messages() {
  const [messages, setMessages] = useState<ParentMessage[]>([]);

  useEffect(() => {
    mobileApi.getMessages().then(setMessages);
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Messages</Text>
        {messages.map((message) => (
          <AppCard key={message.id} title={message.subject} subtitle={`${message.from} · ${message.channel}`}>
            <Text style={styles.body}>{message.body}</Text>
            <Text style={message.unread ? styles.unread : styles.read}>{message.unread ? 'Unread' : 'Read'}</Text>
            <AppButton label="Reply" variant="secondary" />
          </AppCard>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  body: { color: colors.ink, lineHeight: 21 },
  unread: { color: colors.primary, fontWeight: '900' },
  read: { color: colors.muted, fontWeight: '800' }
});
