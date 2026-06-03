export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

export const mpesaConfig: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  shortcode: process.env.MPESA_SHORTCODE || '',
  passkey: process.env.MPESA_PASSKEY || '',
  callbackUrl: process.env.MPESA_CALLBACK_URL || '',
  environment: process.env.MPESA_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
};

export function isMpesaConfigured() {
  return Boolean(mpesaConfig.consumerKey && mpesaConfig.consumerSecret && mpesaConfig.shortcode && mpesaConfig.passkey);
}
