import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { canManageGroup } from '../utils/accessControl.js';
import { chatGroupService } from '../services/chatGroupService.js';

export const chatGroupController = {
  list: async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const role = (req as any).user?.role as Role;
    const includeArchived = String(req.query.archived || '') === 'true';
    res.json({ data: await chatGroupService.list(userId, role, includeArchived) });
  },

  create: async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const role = (req as any).user?.role as Role;
    if (!canManageGroup(role)) {
      return res.status(403).json({ message: 'Only admin, principal, developer, or teachers can create groups.' });
    }

    const group = await chatGroupService.create(req.body, userId, role);
    res.status(201).json({ data: group });
  },

  update: async (req: Request, res: Response) => {
    const group = await chatGroupService.update(
      req.params.id,
      req.body,
      (req as any).user?.userId,
      (req as any).user?.role
    );
    if (!group) return res.status(403).json({ message: 'You cannot edit this group.' });
    res.json({ data: group });
  },

  addMembers: async (req: Request, res: Response) => {
    const memberIds = Array.isArray(req.body?.memberIds) ? req.body.memberIds.map(String) : [];
    const group = await chatGroupService.addMembers(
      req.params.id,
      memberIds,
      (req as any).user?.userId,
      (req as any).user?.role
    );
    if (!group) return res.status(403).json({ message: 'You cannot edit this group.' });
    res.json({ data: group });
  },

  send: async (req: Request, res: Response) => {
    const body = String(req.body?.body || '').trim();
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
    if (!body && attachments.length === 0) return res.status(400).json({ message: 'Message body or attachment is required.' });

    const message = await chatGroupService.send(
      req.params.id,
      body,
      (req as any).user?.userId,
      (req as any).user?.role,
      attachments
    );
    if (!message) return res.status(403).json({ message: 'You cannot message this group.' });
    res.status(201).json({ data: message });
  },

  deleteMessages: async (req: Request, res: Response) => {
    const messageIds = Array.isArray(req.body?.messageIds) ? req.body.messageIds.map(String) : [];
    const group = await chatGroupService.deleteMessages(
      req.params.id,
      messageIds,
      (req as any).user?.userId,
      (req as any).user?.role
    );
    if (!group) return res.status(403).json({ message: 'You cannot delete messages in this group.' });
    res.json({ data: group });
  },

  clear: async (req: Request, res: Response) => {
    const group = await chatGroupService.clear(req.params.id, (req as any).user?.userId, (req as any).user?.role);
    if (!group) return res.status(403).json({ message: 'You cannot clear this group.' });
    res.json({ data: group });
  },

  archive: async (req: Request, res: Response) => {
    const group = await chatGroupService.archive(req.params.id, (req as any).user?.userId, (req as any).user?.role);
    if (!group) return res.status(403).json({ message: 'You cannot archive this group.' });
    res.json({ data: group });
  },

  mute: async (req: Request, res: Response) => {
    const until = req.body?.until ? String(req.body.until) : null;
    const group = await chatGroupService.mute(req.params.id, (req as any).user?.userId, (req as any).user?.role, until);
    if (!group) return res.status(403).json({ message: 'You cannot mute this group.' });
    res.json({ data: group });
  },

  disappearing: async (req: Request, res: Response) => {
    const duration = String(req.body?.duration || 'off');
    const group = await chatGroupService.setDisappearing(req.params.id, (req as any).user?.userId, (req as any).user?.role, duration);
    if (!group) return res.status(403).json({ message: 'You cannot update disappearing messages for this group.' });
    res.json({ data: group });
  },

  theme: async (req: Request, res: Response) => {
    const theme = String(req.body?.theme || 'default');
    const group = await chatGroupService.setTheme(req.params.id, (req as any).user?.userId, (req as any).user?.role, theme);
    if (!group) return res.status(403).json({ message: 'You cannot update this chat theme.' });
    res.json({ data: group });
  },

  shortcut: async (req: Request, res: Response) => {
    const group = await chatGroupService.toggleUserList(req.params.id, (req as any).user?.userId, (req as any).user?.role, 'shortcutsBy');
    if (!group) return res.status(403).json({ message: 'You cannot update shortcuts for this group.' });
    res.json({ data: group });
  },

  listToggle: async (req: Request, res: Response) => {
    const group = await chatGroupService.toggleUserList(req.params.id, (req as any).user?.userId, (req as any).user?.role, 'listBy');
    if (!group) return res.status(403).json({ message: 'You cannot update this list.' });
    res.json({ data: group });
  },

  block: async (req: Request, res: Response) => {
    const group = await chatGroupService.toggleUserList(req.params.id, (req as any).user?.userId, (req as any).user?.role, 'blockedBy');
    if (!group) return res.status(403).json({ message: 'You cannot block this group.' });
    res.json({ data: group });
  },

  report: async (req: Request, res: Response) => {
    const group = await chatGroupService.report(req.params.id, (req as any).user?.userId, (req as any).user?.role, String(req.body?.reason || ''));
    if (!group) return res.status(403).json({ message: 'You cannot report this group.' });
    res.json({ data: group });
  },

  call: async (req: Request, res: Response) => {
    const type = req.body?.type === 'video' ? 'video' : 'voice';
    const group = await chatGroupService.logCall(req.params.id, (req as any).user?.userId, (req as any).user?.role, type);
    if (!group) return res.status(403).json({ message: 'You cannot call this group.' });
    res.json({ data: group });
  },

  leave: async (req: Request, res: Response) => {
    const group = await chatGroupService.leave(req.params.id, (req as any).user?.userId, (req as any).user?.role);
    if (!group) return res.status(403).json({ message: 'You cannot leave this group.' });
    res.json({ data: group });
  },

  delete: async (req: Request, res: Response) => {
    const deleted = await chatGroupService.delete(req.params.id, (req as any).user?.userId, (req as any).user?.role);
    if (!deleted) return res.status(403).json({ message: 'You cannot delete this group.' });
    res.status(204).send();
  }
};
