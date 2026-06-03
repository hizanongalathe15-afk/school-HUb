import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard, MetricCard, Screen, colors } from '../components';
import { useStudents } from '../hooks/useStudents';

export default function Performance() {
  const { selectedStudent, results } = useStudents();
  const average = results.length ? Math.round(results.reduce((total, result) => total + result.score, 0) / results.length) : 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Academic Performance</Text>
        <Text style={styles.subtitle}>{selectedStudent?.name || 'Selected learner'} academic trend and subject feedback.</Text>
        <View style={styles.row}>
          <MetricCard label="Average" value={`${average}%`} />
          <MetricCard label="Mean grade" value={selectedStudent?.meanGrade || '-'} tone="teal" />
        </View>
        {results.map((result) => (
          <AppCard key={result.subject} title={result.subject} subtitle={result.comment}>
            <View style={styles.resultRow}>
              <Text style={styles.score}>{result.score}%</Text>
              <Text style={styles.grade}>{result.grade}</Text>
              <Text style={styles.rank}>Rank {result.rank}</Text>
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.muted },
  row: { flexDirection: 'row', gap: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  score: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  grade: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  rank: { color: colors.muted, fontWeight: '800' }
});
