import { Role } from '@prisma/client';

const fullAccessRoles = new Set<Role>([Role.DEVELOPER, Role.ADMIN, Role.PRINCIPAL]);

export function hasFullAccess(role?: Role | string) {
  return role ? fullAccessRoles.has(role as Role) : false;
}

export function canManageLanding(role?: Role | string) {
  return hasFullAccess(role);
}

export function canManageGroup(role?: Role | string) {
  return hasFullAccess(role) || role === Role.TEACHER;
}

export function canEditDashboard(requestRole?: Role | string, targetRole?: Role | string) {
  return hasFullAccess(requestRole) || requestRole === targetRole;
}

