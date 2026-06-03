import type { UserRole } from '../types/user';

export function getDashboardPathForRole(role?: UserRole) {
  if (role === 'PARENT') return '/dashboard/parent';
  if (role === 'TEACHER') return '/teacher/dashboard';
  if (role === 'BURSAR') return '/dashboard/bursar';
  if (role === 'STORE_KEEPER') return '/dashboard/store';
  if (role === 'PRINCIPAL') return '/admin/dashboard';
  return '/admin/dashboard';
}
