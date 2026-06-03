import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const usersController = {
  // Return a sanitized public view of a user
  getPublicUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        isActive: user.isActive,
        lastLogin: user.lastLogin?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        profileViews: (user as any).profileViews ?? 0,
      });
    } catch (error) {
      console.error('Error fetching user (public):', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  },

  // Increment profile view count (called when one user views another)
  incrementView: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      // Ensure user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const updated = await (prisma.user as any).update({
        where: { id: userId },
        data: { profileViews: { increment: 1 } },
      });

      res.json({ profileViews: updated.profileViews ?? 0 });
    } catch (error) {
      console.error('Error incrementing profile view:', error);
      res.status(500).json({ message: 'Failed to increment profile view' });
    }
  },
};

export default usersController;
