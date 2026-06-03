import { Role } from '@prisma/client';
import { readSetting, writeSetting } from './settingStore.js';
import { hasFullAccess } from '../utils/accessControl.js';
import { prisma } from '../config/database.js';

export interface ChatGroupMessage {
  id: string;
  senderId: string;
  body: string;
  attachments?: ChatGroupAttachment[];
  createdAt: string;
}

export interface ChatGroupAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: 'file' | 'voice' | 'folder';
  dataUrl?: string;
}

export interface ChatGroupMemberProfile {
  id: string;
  name: string;
  role: Role | 'SYSTEM';
  avatar?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ChatGroupReport {
  id: string;
  userId: string;
  reason: string;
  createdAt: string;
}

export interface ChatGroupCallLog {
  id: string;
  userId: string;
  type: 'voice' | 'video';
  createdAt: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  scope: 'whole_school' | 'staff' | 'teachers' | 'parents' | 'class' | 'custom';
  ownerId: string;
  memberIds: string[];
  allowedRoles: Role[];
  archivedBy?: string[];
  leftBy?: string[];
  mutedUntilBy?: Record<string, string>;
  disappearingBy?: Record<string, string>;
  themeBy?: Record<string, string>;
  shortcutsBy?: string[];
  listBy?: string[];
  blockedBy?: string[];
  reports?: ChatGroupReport[];
  callLogs?: ChatGroupCallLog[];
  memberProfiles?: ChatGroupMemberProfile[];
  messages: ChatGroupMessage[];
  createdAt: string;
  updatedAt: string;
}

const KEY = 'chat_groups';

function defaults(): ChatGroup[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'group-whole-school',
      name: 'Whole School',
      scope: 'whole_school',
      ownerId: 'system',
      memberIds: [],
      allowedRoles: [Role.DEVELOPER, Role.ADMIN, Role.PRINCIPAL, Role.BURSAR, Role.STORE_KEEPER, Role.TEACHER, Role.PARENT],
      messages: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'group-staff',
      name: 'School Staff',
      scope: 'staff',
      ownerId: 'system',
      memberIds: [],
      allowedRoles: [Role.DEVELOPER, Role.ADMIN, Role.PRINCIPAL, Role.BURSAR, Role.STORE_KEEPER, Role.TEACHER],
      messages: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'group-teachers-parents',
      name: 'Teachers and Parents',
      scope: 'parents',
      ownerId: 'system',
      memberIds: [],
      allowedRoles: [Role.DEVELOPER, Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.PARENT],
      messages: [],
      createdAt: now,
      updatedAt: now
    }
  ];
}

function canAccess(group: ChatGroup, userId: string, role: Role) {
  if (group.leftBy?.includes(userId) && !hasFullAccess(role)) return false;
  return hasFullAccess(role) || group.allowedRoles.includes(role) || group.memberIds.includes(userId);
}

function canManage(group: ChatGroup, userId: string, role: Role) {
  return hasFullAccess(role) || group.ownerId === userId;
}

function normalizeAttachments(value: unknown): ChatGroupAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item, index) => {
    const input = item && typeof item === 'object' ? item as Partial<ChatGroupAttachment> : {};
    return {
      id: input.id || `attachment-${Date.now()}-${index}`,
      name: String(input.name || 'Attachment').slice(0, 160),
      type: String(input.type || 'application/octet-stream').slice(0, 120),
      size: Number.isFinite(Number(input.size)) ? Number(input.size) : 0,
      kind: input.kind === 'voice' || input.kind === 'folder' ? input.kind : 'file',
      dataUrl: typeof input.dataUrl === 'string' ? input.dataUrl : undefined
    };
  });
}

async function hydrateProfiles(groups: ChatGroup[]) {
  const ids = Array.from(new Set(groups.flatMap((group) => [
    group.ownerId,
    ...group.memberIds,
    ...group.messages.map((message) => message.senderId)
  ]).filter((id) => id && id !== 'system')));

  if (ids.length === 0) {
    return groups.map((group) => ({ ...group, memberProfiles: [] }));
  }

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true, lastName: true, role: true, avatar: true, phone: true, email: true }
  });
  const profiles = new Map(users.map((user) => [user.id, {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    email: user.email
  } satisfies ChatGroupMemberProfile]));

  return groups.map((group) => ({
    ...group,
    memberProfiles: Array.from(new Set([group.ownerId, ...group.memberIds, ...group.messages.map((message) => message.senderId)]))
      .map((id) => id === 'system'
        ? { id: 'system', name: 'System', role: 'SYSTEM' as const }
        : profiles.get(id))
      .filter(Boolean) as ChatGroupMemberProfile[]
  }));
}

export const chatGroupService = {
  async list(userId: string, role: Role, includeArchived = false) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const visible = groups.filter((group) => {
      if (!canAccess(group, userId, role)) return false;
      return includeArchived || !group.archivedBy?.includes(userId);
    });
    return hydrateProfiles(visible);
  },

  async create(payload: Partial<ChatGroup>, userId: string, role: Role) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const now = new Date().toISOString();
    const allowedRoles = Array.isArray(payload.allowedRoles) && payload.allowedRoles.length
      ? payload.allowedRoles
      : [Role.TEACHER, Role.PARENT];
    const group: ChatGroup = {
      id: `group-${Date.now()}`,
      name: String(payload.name || 'New chat group').trim(),
      scope: payload.scope || 'custom',
      ownerId: userId,
      memberIds: Array.from(new Set([userId, ...(payload.memberIds || [])])),
      allowedRoles,
      archivedBy: [],
      leftBy: [],
      messages: [],
      createdAt: now,
      updatedAt: now
    };

    await writeSetting(KEY, 'communication', [group, ...groups]);
    return group;
  },

  async update(groupId: string, payload: Partial<ChatGroup>, userId: string, role: Role) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canManage(group, userId, role)) return undefined;

    if (payload.name) group.name = String(payload.name).trim();
    if (payload.scope) group.scope = payload.scope;
    if (Array.isArray(payload.allowedRoles)) group.allowedRoles = payload.allowedRoles;
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async addMembers(groupId: string, memberIds: string[], userId: string, role: Role) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canManage(group, userId, role)) return undefined;

    group.memberIds = Array.from(new Set([...group.memberIds, ...memberIds]));
    group.leftBy = (group.leftBy || []).filter((id) => !memberIds.includes(id));
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async send(groupId: string, body: string, userId: string, role: Role, attachments: unknown[] = []) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    const message: ChatGroupMessage = {
      id: `group-message-${Date.now()}`,
      senderId: userId,
      body: body.trim(),
      attachments: normalizeAttachments(attachments),
      createdAt: new Date().toISOString()
    };
    group.messages.unshift(message);
    group.messages = group.messages.slice(0, 300);
    group.updatedAt = message.createdAt;
    await writeSetting(KEY, 'communication', groups);
    return message;
  },

  async deleteMessages(groupId: string, messageIds: string[], userId: string, role: Role) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    const allowedToManage = canManage(group, userId, role);
    group.messages = group.messages.filter((message) => {
      if (!messageIds.includes(message.id)) return true;
      return !allowedToManage && message.senderId !== userId;
    });
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async clear(groupId: string, userId: string, role: Role) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canManage(group, userId, role)) return undefined;

    group.messages = [];
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async archive(groupId: string, userId: string, role: Role) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    group.archivedBy = Array.from(new Set([...(group.archivedBy || []), userId]));
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async mute(groupId: string, userId: string, role: Role, until: string | null) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    group.mutedUntilBy = { ...(group.mutedUntilBy || {}) };
    if (until) group.mutedUntilBy[userId] = until;
    else delete group.mutedUntilBy[userId];
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async setDisappearing(groupId: string, userId: string, role: Role, duration: string) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    group.disappearingBy = { ...(group.disappearingBy || {}), [userId]: duration };
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async setTheme(groupId: string, userId: string, role: Role, theme: string) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    group.themeBy = { ...(group.themeBy || {}), [userId]: theme };
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async toggleUserList(groupId: string, userId: string, role: Role, list: 'shortcutsBy' | 'listBy' | 'blockedBy') {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    const current = group[list] || [];
    group[list] = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async report(groupId: string, userId: string, role: Role, reason: string) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    group.reports = [{ id: `report-${Date.now()}`, userId, reason: reason || 'Reported from chat menu', createdAt: new Date().toISOString() }, ...(group.reports || [])].slice(0, 50);
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async logCall(groupId: string, userId: string, role: Role, type: 'voice' | 'video') {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    group.callLogs = [{ id: `call-${Date.now()}`, userId, type, createdAt: new Date().toISOString() }, ...(group.callLogs || [])].slice(0, 100);
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async leave(groupId: string, userId: string, role: Role) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canAccess(group, userId, role)) return undefined;

    group.memberIds = group.memberIds.filter((id) => id !== userId);
    group.leftBy = Array.from(new Set([...(group.leftBy || []), userId]));
    group.updatedAt = new Date().toISOString();
    await writeSetting(KEY, 'communication', groups);
    return group;
  },

  async delete(groupId: string, userId: string, role: Role) {
    const groups = await readSetting<ChatGroup[]>(KEY, defaults());
    const group = groups.find((item) => item.id === groupId);
    if (!group || !canManage(group, userId, role)) return false;

    await writeSetting(KEY, 'communication', groups.filter((item) => item.id !== groupId));
    return true;
  }
};
