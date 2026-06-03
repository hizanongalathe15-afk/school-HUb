export type MobileUserRole = 'PARENT' | 'TEACHER' | 'ADMIN';

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: MobileUserRole;
  avatarUrl?: string;
  preferredLanguage: 'en' | 'sw';
  twoFactorEnabled: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: MobileUser;
}
