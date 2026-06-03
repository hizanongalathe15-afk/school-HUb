export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  enabled: boolean;
}

export const whatsappConfig: WhatsAppConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'school-hub-verify',
  enabled: process.env.WHATSAPP_ENABLED === 'true'
};

export function isWhatsAppConfigured() {
  return whatsappConfig.enabled && Boolean(whatsappConfig.phoneNumberId && whatsappConfig.accessToken);
}
