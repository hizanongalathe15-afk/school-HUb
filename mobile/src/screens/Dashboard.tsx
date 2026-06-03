import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, MetricCard, Screen, colors } from '../components';
import { useAttendance } from '../hooks/useAttendance';
import { useFees } from '../hooks/useFees';
import { useStudents } from '../hooks/useStudents';

export default function Dashboard() {
  const { students, selectedStudent } = useStudents();
  const { summaries, lastPaymentMessage } = useFees();
  const { days } = useAttendance();
  const totalBalance = summaries.reduce((total, row) => total + row.balance, 0);
  const latestAttendance = selectedStudent ? days.find((day) => day.studentId === selectedStudent.id) : undefined;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View>
          <Text style={styles.eyebrow}>Parent portal</Text>
          <Text style={styles.title}>School Hub</Text>
          <Text style={styles.subtitle}>Track academics, fees, attendance, communication, and events from one mobile command center.</Text>
        </View>

        <View style={styles.metrics}>
          <MetricCard label="Children" value={String(students.length)} />
          <MetricCard label="Fee balance" value={`KES ${totalBalance.toLocaleString()}`} tone="amber" />
        </View>
        <View style={styles.metrics}>
          <MetricCard label="Attendance" value={`${selectedStudent?.attendanceRate || 0}%`} tone="teal" />
          <MetricCard label="Mean grade" value={selectedStudent?.meanGrade || '-'} />
        </View>

        <AppCard title="Selected learner" subtitle="Live summary from the parent account">
          <Text style={styles.strong}>{selectedStudent?.name}</Text>
          <Text style={styles.line}>{selectedStudent?.className} {selectedStudent?.stream} · {selectedStudent?.house} House</Text>
          <Text style={styles.line}>Latest attendance: {latestAttendance?.status || 'No record'} {latestAttendance?.checkIn ? `at ${latestAttendance.checkIn}` : ''}</Text>
          <Text style={styles.line}>Next exam: {selectedStudent?.nextExam}</Text>
        </AppCard>

        <AppCard title="Quick actions" subtitle="Parent workflows ready for real API wiring">
          <View style={styles.actions}>
            <AppButton label="Pay fees" />
            <AppButton label="Message teacher" variant="secondary" />
          </View>
          {lastPaymentMessage ? <Text style={styles.success}>{lastPaymentMessage}</Text> : null}
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 32 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  metrics: { flexDirection: 'row', gap: 12 },
  strong: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  line: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10 },
  success: { color: colors.teal, fontWeight: '800' }
});
