import axios from 'axios';
import { smsConfig, isSmsConfigured } from '../config/sms.js';

const africasTalkingApi = axios.create({
  baseURL: 'https://api.africastalking.com/v1',
  headers: {
    'apiKey': smsConfig.apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});

export const smsService = {
  async list() {
    if (!isSmsConfigured() || smsConfig.provider === 'mock') {
      return [];
    }

    try {
      const response = await africasTalkingApi.post('/messaging?username=' + encodeURIComponent(smsConfig.username), 
        new URLSearchParams({ username: smsConfig.username })
      );
      return response.data;
    } catch (error) {
      console.error('SMS list error:', error);
      return [];
    }
  },

  async get(id: string) {
    return { id };
  },

  async sendSms(to: string, message: string) {
    if (!isSmsConfigured() || smsConfig.provider === 'mock') {
      return { id: `sms_${Date.now()}`, to, message, status: 'SIMULATED_SENT' };
    }

    try {
      const response = await africasTalkingApi.post('/messaging?username=' + encodeURIComponent(smsConfig.username),
        new URLSearchParams({
          username: smsConfig.username,
          to: to,
          message: message,
          from: smsConfig.senderId
        })
      );
      return response.data;
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  },

  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const { phone, message } = payload as unknown as { phone: string; message: string };
    return this.sendSms(phone, message);
  }
};
