export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT || 587),
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASSWORD || '',
  from: process.env.EMAIL_FROM || 'School Hub <noreply@schoolhub.local>'
};

export function isEmailConfigured() {
  return Boolean(emailConfig.host && emailConfig.user && emailConfig.password);
}
