import nodemailer from 'nodemailer';
import { emailConfig, isEmailConfigured } from '../config/email.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }
  
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password,
      },
    });
  }
  
  return transporter;
}

export const emailService = {
  async list() {
    return [];
  },
  
  async get(id: string) {
    return { id };
  },
  
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const { to, subject, text, html } = payload as unknown as { 
      to: string | string[]; 
      subject: string; 
      text?: string; 
      html?: string 
    };
    
    if (!isEmailConfigured()) {
      // Return simulated response when not configured
      return { 
        id: `email_${Date.now()}`, 
        to, 
        subject, 
        text, 
        html,
        status: 'SIMULATED_SENT' 
      };
    }
    
    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      throw new Error('Email transporter not available');
    }
    
    try {
      const info = await mailTransporter.sendMail({
        from: emailConfig.from,
        to,
        subject,
        text,
        html,
      });
      
      return { 
        id: info.messageId, 
        to, 
        subject, 
        text, 
        html,
        status: 'SENT',
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }
};
