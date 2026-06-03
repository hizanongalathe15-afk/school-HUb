import { useCallback, useEffect, useState } from 'react';
import { mobileApi } from '../services';
import type { FeeSummary, FeeTransaction, StartPaymentPayload } from '../types';

export function useFees() {
  const [summaries, setSummaries] = useState<FeeSummary[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPaymentMessage, setLastPaymentMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [summaryRows, transactionRows] = await Promise.all([
      mobileApi.getFeeSummaries(),
      mobileApi.getTransactions()
    ]);
    setSummaries(summaryRows);
    setTransactions(transactionRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function startPayment(payload: StartPaymentPayload) {
    const response = await mobileApi.startPayment(payload);
    setLastPaymentMessage(response.message);
    return response;
  }

  return { summaries, transactions, loading, lastPaymentMessage, refresh, startPayment };
}
