import { api } from './api';

export const feeService = {
  async list() {
    const response = await api.get('/fees');
    return response.data;
  },
  async get(id: string) {
    const response = await api.get(`/fees/${id}`);
    return response.data;
  },
  async getByStudent(studentId: string) {
    const response = await api.get(`/fees/student/${studentId}`);
    return response.data;
  },
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const response = await api.post('/fees', payload);
    return response.data;
  },
  async makePayment(data: any) {
    const response = await api.post('/fees/payment', data);
    return response.data;
  }
};
