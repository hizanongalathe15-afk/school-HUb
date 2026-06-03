export interface WhatsAppMessage {
  recipient: string;
  template: string;
  channel: 'Parent group' | 'Class group' | 'Direct parent';
}

export interface WhatsAppDispatch {
  id: string;
  delivered: number;
  failed: number;
  preview: string;
}

export function sendWhatsAppNotification(message: WhatsAppMessage): WhatsAppDispatch {
  const audienceSize = message.channel === 'Parent group' ? 486 : message.channel === 'Class group' ? 42 : 1;

  return {
    id: `wa_${Date.now()}`,
    delivered: audienceSize,
    failed: 0,
    preview: `${message.channel}: ${message.template} sent to ${message.recipient}`
  };
}

export function buildFeeBalanceReply(studentName: string, balance: number) {
  return `Hello, ${studentName}'s current fee balance is KES ${balance.toLocaleString()}. Reply PAY to receive an M-PESA prompt.`;
}
