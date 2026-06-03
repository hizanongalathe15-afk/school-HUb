import { getApi } from './api';
import type { LandingContent } from '../types';

export async function getLandingContent(): Promise<LandingContent> {
  const language = localStorage.getItem('school-hub-language') || 'en';
  const payload = await getApi<{ data: LandingContent }>(`/public/landing?lang=${language}`, {
    silentErrorToast: true
  });
  return payload.data;
}
