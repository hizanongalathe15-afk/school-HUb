import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppCard, MetricCard, Screen, colors } from '../components';
import { useAttendance } from '../hooks/useAttendance';
import { useStudents } from '../hooks/useStudents';

export default function Attendance() {
  const { selectedStudent } = useStudents();
  const { byStudent } = useAttendance();
  const days = selectedStudent ? byStudent(selectedStudent.id) : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Attendance</Text>
        <MetricCard label="Attendance rate" value={`${selectedStudent?.attendanceRate || 0}%`} tone="teal" />
        {days.map((day) => (
          <AppCard key={day.id} title={day.date} subtitle={day.note || 'Daily register record'}>
            <Text style={styles.status}>{day.status}</Text>
            <Text style={styles.line}>{day.checkIn ? `Check-in ${day.checkIn}` : 'No check-in time recorded'}</Text>
          </AppCard>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  status: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  line: { color: colors.muted }
});
