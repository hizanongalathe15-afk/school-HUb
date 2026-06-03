export interface MpesaPaymentRequest {
  phone: string;
  amount: number;
  account: string;
}

export interface MpesaPaymentResult {
  checkoutRequestId: string;
  receipt: string;
  status: 'Queued' | 'Paid';
  message: string;
}

export function requestMpesaPayment(request: MpesaPaymentRequest): MpesaPaymentResult {
  const receiptSeed = `${request.account}-${request.phone}-${request.amount}`;

  return {
    checkoutRequestId: `ws_CO_${Date.now()}`,
    receipt: `SH${Math.abs(hashCode(receiptSeed)).toString().slice(0, 7)}`,
    status: 'Queued',
    message: `STK push queued for ${request.phone}. ${request.account} should confirm KES ${request.amount.toLocaleString()}.`
  };
}

export function reconcileMpesaPayments(
  payments: Array<{ student: string; amount: number; balance: number; receipt: string }>
) {
  return payments.map((payment) => ({
    ...payment,
    status: payment.balance <= 0 ? 'Cleared' : 'Partial',
    nextAction: payment.balance <= 0 ? 'Issue receipt' : 'Send balance reminder'
  }));
}

function hashCode(value: string) {
  return value.split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}
