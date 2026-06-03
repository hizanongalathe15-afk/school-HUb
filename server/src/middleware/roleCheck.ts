import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

// Roles that can manage landing content (footer, media, etc.)
const MANAGE_LANDING_ROLES: Role[] = ['ADMIN', 'PRINCIPAL', 'DEVELOPER'];

export function canManageLanding(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!MANAGE_LANDING_ROLES.includes(user.role)) {
    return res.status(403).json({ 
      message: 'Only admin, principal, or developer can manage landing content.' 
    });
  }
  
  next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}

export function isPrincipal(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'PRINCIPAL') {
    return res.status(403).json({ message: 'Principal access required' });
  }
  
  next();
}

export function isTeacher(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Teacher access required' });
  }
  
  next();
}

export function isParent(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'PARENT') {
    return res.status(403).json({ message: 'Parent access required' });
  }
  
  next();
}

export function isStudent(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Student access required' });
  }
  
  next();
}

export function isBursar(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'BURSAR' && user.role !== 'ADMIN' && user.role !== 'PRINCIPAL' && user.role !== 'DEVELOPER') {
    return res.status(403).json({ message: 'Bursar access required' });
  }
  
  next();
}

export function isStoreKeeper(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'STORE_KEEPER' && user.role !== 'ADMIN' && user.role !== 'PRINCIPAL' && user.role !== 'DEVELOPER') {
    return res.status(403).json({ message: 'Store Keeper access required' });
  }
  
  next();
}