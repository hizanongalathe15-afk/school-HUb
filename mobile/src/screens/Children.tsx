import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard, MetricCard, Screen, colors } from '../components';
import { useStudents } from '../hooks/useStudents';

export default function Children() {
  const { students, selectedStudentId, setSelectedStudentId } = useStudents();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Children</Text>
        {students.map((student) => (
          <AppCard key={student.id} title={student.name} subtitle={`${student.admissionNumber} · ${student.className} ${student.stream}`}>
            <View style={styles.row}>
              <MetricCard label="Attendance" value={`${student.attendanceRate}%`} tone="teal" />
              <MetricCard label="Grade" value={student.meanGrade} />
            </View>
            <Text style={styles.line}>House: {student.house}</Text>
            <Text style={styles.line}>Boarding: {student.boardingStatus}</Text>
            <Text style={[styles.select, selectedStudentId === student.id && styles.selected]} onPress={() => setSelectedStudentId(student.id)}>
              {selectedStudentId === student.id ? 'Selected learner' : 'Set as selected learner'}
            </Text>
          </AppCard>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 10 },
  line: { color: colors.muted },
  select: { color: colors.primary, fontWeight: '900', marginTop: 4 },
  selected: { color: colors.teal }
});
