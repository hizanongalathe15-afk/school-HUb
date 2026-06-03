import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authSessionService } from '../services/authSessionService.js';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string; role: string; sessionId?: string };
    if (await authSessionService.isRevoked(decoded.userId, decoded.sessionId)) {
      return res.status(401).json({ message: 'Session revoked' });
    }
    await authSessionService.touch(decoded.userId, decoded.sessionId);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const roleCheck = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
