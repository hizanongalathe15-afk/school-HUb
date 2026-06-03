import { api } from './api';

export const reportService = {
  async list() {
    const response = await api.get('/reports');
    return response.data;
  },
  async get(id: string) {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const response = await api.post('/reports', payload);
    return response.data;
  },
};
