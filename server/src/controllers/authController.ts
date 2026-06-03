import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NotificationType, PrismaClient, Role } from '@prisma/client';
import { authSessionService, createSessionId } from '../services/authSessionService.js';
import { notificationService } from '../services/notificationService.js';
import { readSetting, writeSetting } from '../services/settingStore.js';

const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || 'secret';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

function sanitizeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar: string | null;
  phone: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profileViews: (user as any).profileViews ?? 0,
  };
}

function issueTokens(user: { id: string; role: Role }, sessionId = createSessionId()) {
  return {
    sessionId,
    token: jwt.sign({ userId: user.id, role: user.role, sessionId }, jwtSecret, { expiresIn: '2h' }),
    refreshToken: jwt.sign({ userId: user.id, sessionId }, jwtRefreshSecret, { expiresIn: '30d' })
  };
}

function sessionSecurityLink(role: Role) {
  return role === Role.ADMIN || role === Role.PRINCIPAL ? '/dashboard/system-metrics' : '/dashboard/profile';
}

function roleSettingsKey(userId: string) {
  return `role_settings:${userId}`;
}

function defaultRoleSettings(role: Role) {
  return {
    account: {
      language: 'en',
      theme: 'system',
      emailNotifications: true,
      pushNotifications: true,
      sound: true,
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
    },
    notifications: role === Role.BURSAR
      ? { payments: true, arrears: true, salaries: true, expenses: true, email: true, sound: true }
      : role === Role.STORE_KEEPER
        ? { lowStock: true, expiry: true, requests: true, purchaseOrders: true, email: true, sound: true }
        : role === Role.TEACHER
          ? { messages: true, announcements: true, homework: true, meetings: true, email: true, sound: true }
          : role === Role.PARENT
            ? { feeReminders: true, attendanceAlerts: true, gradeNotifications: true, disciplineAlerts: true, eventReminders: true, announcementAlerts: true, homeworkReminders: true }
            : { system: true, users: true, security: true, reports: true, email: true, sound: true },
    roleSpecific: role === Role.STORE_KEEPER
      ? { reorderThreshold: 10, autoReorder: false, defaultReturnPeriodDays: 14, barcodeEnabled: true }
      : role === Role.BURSAR
        ? { transactionAlerts: true, largeTransactionThreshold: 50000, defaultCurrency: 'KES' }
        : {},
  };
}

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          parent: true,
          teacher: true,
          staff: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is disabled. Contact the school administrator.' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const tokens = issueTokens(user);
      await authSessionService.recordLogin(user.id, {
        sessionId: tokens.sessionId,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      void Promise.allSettled([
        authSessionService.enrichUserSessions(user.id, {
          email: user.email,
          accountName: `${user.firstName} ${user.lastName}`
        }),
        notificationService.createWelcome(user.id),
        notificationService.create(user.id, {
          title: 'New account login detected',
          message: `${req.get('user-agent') || 'Unknown device'} signed in from ${req.ip}. If this was not you, open Active Devices and log it out.`,
          link: sessionSecurityLink(user.role),
          type: NotificationType.EMERGENCY
        })
      ]).catch((backgroundError) => {
        console.error('Post-login background task failed:', backgroundError);
      });

      res.json({
        user: sanitizeUser(user),
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body as {
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        role?: Role;
      };

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'First name, last name, email, and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const selectedRole = role && Object.values(Role).includes(role) ? role : Role.PARENT;

      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: selectedRole,
          parent: selectedRole === Role.PARENT ? {
            create: {
              firstName,
              lastName,
              email: normalizedEmail,
              phone: phone || 'Not provided',
              relationship: 'Guardian'
            }
          } : undefined
        },
      });

      const tokens = issueTokens(user);
      await authSessionService.recordLogin(user.id, {
        sessionId: tokens.sessionId,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });
      await authSessionService.enrichUserSessions(user.id, {
        email: user.email,
        accountName: `${user.firstName} ${user.lastName}`
      });
      await notificationService.createWelcome(user.id);
      await notificationService.create(user.id, {
        title: 'New account login detected',
        message: `${req.get('user-agent') || 'Unknown device'} signed in from ${req.ip}. If this was not you, review Active Devices.`,
        link: sessionSecurityLink(user.role),
        type: NotificationType.EMERGENCY
      });

      res.status(201).json({
        user: sanitizeUser(user),
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as { userId: string; sessionId?: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || !user.isActive || await authSessionService.isRevoked(user.id, decoded.sessionId)) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }

      const tokens = issueTokens(user, decoded.sessionId);
      return res.json({
        user: sanitizeUser(user),
        token: tokens.token,
        refreshToken: tokens.refreshToken
      });
    } catch {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
  },

  logout: async (_req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (user) {
        const resetToken = jwt.sign({ userId: user.id, purpose: 'password-reset' }, jwtSecret, { expiresIn: '15m' });
        console.log(`Password reset token for ${user.email}: ${resetToken}`);
      }

      return res.json({ message: 'If that email exists, reset instructions have been prepared.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  me: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        profileViews: (user as any).profileViews ?? 0,
        phone: user.phone,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateMe: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { firstName, lastName, phone, avatar } = req.body as {
        firstName?: string;
        lastName?: string;
        phone?: string;
        avatar?: string;
      };

      if (!firstName?.trim() || !lastName?.trim()) {
        return res.status(400).json({ message: 'First name and last name are required' });
      }

      if (avatar && avatar.length > 8_000_000) {
        return res.status(400).json({ message: 'Profile image is too large. Use an image under 5 MB.' });
      }

      if (avatar && !avatar.startsWith('data:image/') && !avatar.startsWith('http')) {
        return res.status(400).json({ message: 'Avatar must be an image upload or image URL.' });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
          avatar: avatar || null,
        },
      });

      if (user.role === Role.PARENT) {
        await prisma.parent.updateMany({
          where: { userId },
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || 'Not provided',
          },
        });
      }

      if (user.role === Role.TEACHER) {
        await prisma.teacher.updateMany({
          where: { userId },
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || 'Not provided',
            photo: user.avatar,
          },
        });
      }

      await prisma.staff.updateMany({
        where: { userId },
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || 'Not provided',
          photo: user.avatar,
        },
      });

      return res.json(sanitizeUser(user));
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body as { token?: string; newPassword?: string };

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: string; purpose?: string };
      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword }
      });

      return res.json({ message: 'Password reset successfully' });
    } catch {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
};
