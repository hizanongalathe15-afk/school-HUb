import { api } from './api';

export const smsService = {
  async list() {
    const response = await api.get('/sms');
    return response.data;
  },
  async get(id: string) {
    const response = await api.get(`/sms/${id}`);
    return response.data;
  },
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const response = await api.post('/sms', payload);
    return response.data;
  },
  async send(data: any) {
    const response = await api.post('/sms/send', data);
    return response.data;
  }
};
