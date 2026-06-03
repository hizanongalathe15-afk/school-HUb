import { api } from './api';

export const inventoryService = {
  async list() {
    const response = await api.get('/inventory');
    return response.data;
  },
  async get(id: string) {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const response = await api.post('/inventory', payload);
    return response.data;
  },
  async update(id: string, data: any) {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  async delete(id: string) {
    await api.delete(`/inventory/${id}`);
  },
  async requestStock(data: any) {
    const response = await api.post('/inventory/request', data);
    return response.data;
  }
};
