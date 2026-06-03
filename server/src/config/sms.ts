export interface SmsConfig {
  provider: 'africastalking' | 'twilio' | 'mock';
  apiKey: string;
  username: string;
  senderId: string;
}

export const smsConfig: SmsConfig = {
  provider: (process.env.SMS_PROVIDER as SmsConfig['provider']) || 'mock',
  apiKey: process.env.SMS_API_KEY || '',
  username: process.env.SMS_USERNAME || '',
  senderId: process.env.SMS_SENDER_ID || 'SchoolHub'
};

export function isSmsConfigured() {
  return smsConfig.provider === 'mock' || Boolean(smsConfig.apiKey && smsConfig.username);
}
