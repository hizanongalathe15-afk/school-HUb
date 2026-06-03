import { api } from './api';

export const studentService = {
  async list() {
    const response = await api.get('/students');
    return response.data;
  },
  async get(id: string) {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const response = await api.post('/students', payload);
    return response.data;
  },
  async update(id: string, data: any) {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },
  async delete(id: string) {
    await api.delete(`/students/${id}`);
  },
};
