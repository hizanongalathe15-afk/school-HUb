import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, MetricCard, Screen, colors } from '../components';
import { useFees } from '../hooks/useFees';
import { useStudents } from '../hooks/useStudents';

export default function Fees() {
  const { selectedStudent } = useStudents();
  const { summaries, transactions, startPayment, lastPaymentMessage } = useFees();
  const summary = summaries.find((row) => row.studentId === selectedStudent?.id);
  const studentTransactions = transactions.filter((row) => row.studentId === selectedStudent?.id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Fees</Text>
        <Text style={styles.subtitle}>M-PESA, receipt history, balances, and statements for {selectedStudent?.name || 'your child'}.</Text>
        <View style={styles.row}>
          <MetricCard label="Balance" value={`KES ${(summary?.balance || 0).toLocaleString()}`} tone="amber" />
          <MetricCard label="Paid" value={`KES ${(summary?.totalPaid || 0).toLocaleString()}`} tone="teal" />
        </View>
        <AppCard title="Payment action" subtitle={`Due date: ${summary?.dueDate || '-'}`}>
          <AppButton
            label="Send M-PESA STK push"
            onPress={() => selectedStudent && startPayment({ studentId: selectedStudent.id, amount: summary?.balance || 0, phone: '+254712345678' })}
          />
          {lastPaymentMessage ? <Text style={styles.success}>{lastPaymentMessage}</Text> : null}
        </AppCard>
        {studentTransactions.map((transaction) => (
          <AppCard key={transaction.id} title={transaction.receiptNumber} subtitle={`${transaction.channel} · ${transaction.reference}`}>
            <Text style={styles.amount}>KES {transaction.amount.toLocaleString()}</Text>
            <Text style={styles.line}>{transaction.date} · {transaction.status}</Text>
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
  amount: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  line: { color: colors.muted },
  success: { color: colors.teal, fontWeight: '800' }
});
