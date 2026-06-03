import React from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type ViewProps } from 'react-native';

export const colors = {
  ink: '#0f172a',
  muted: '#64748b',
  line: '#dbe3ef',
  surface: 'rgba(255,255,255,0.86)',
  primary: '#2563eb',
  teal: '#0f766e',
  amber: '#b45309',
  danger: '#be123c',
  background: '#eef4fb'
};

interface AppCardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function AppCard({ title, subtitle, style, children, ...props }: AppCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  tone?: 'primary' | 'teal' | 'amber' | 'danger';
}

export function MetricCard({ label, value, tone = 'primary' }: MetricCardProps) {
  return (
    <AppCard style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors[tone] }]}>{value}</Text>
    </AppCard>
  );
}

interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
}

export function AppButton({ label, variant = 'primary', style, ...props }: AppButtonProps) {
  return (
    <Pressable style={[styles.button, variant === 'secondary' && styles.buttonSecondary, style]} {...props}>
      <Text style={[styles.buttonText, variant === 'secondary' && styles.buttonSecondaryText]}>{label}</Text>
    </Pressable>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 16,
    padding: 18,
    backgroundColor: colors.background
  },
  card: {
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.32)',
    borderRadius: 14,
    backgroundColor: colors.surface,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 3
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800'
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  metricCard: {
    flex: 1,
    minWidth: 140
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900'
  },
  button: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 16
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#ffffff'
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  buttonSecondaryText: {
    color: colors.ink
  }
});
