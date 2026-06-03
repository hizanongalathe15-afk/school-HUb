export const authService = {
  async list() {
    return [];
  },
  async get(id: string) {
    return { id };
  },
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    return payload;
  }
};
