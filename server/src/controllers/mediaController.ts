import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const mediaController = {
  listGallery: async (req: Request, res: Response) => {
    try {
      const { search, type, category, isPublished } = req.query as any;
      const where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (type) where.type = type;
      if (category) where.category = category;
      if (isPublished !== undefined) where.isPublished = isPublished === 'true';

      const items = await prisma.gallery.findMany({ where });
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load gallery' });
    }
  },

  getGalleryItem: async (req: Request, res: Response) => {
    try {
      const item = await prisma.gallery.findUnique({ where: { id: req.params.id } });
      if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load gallery item' });
    }
  },

  createGalleryItem: async (req: Request, res: Response) => {
    try {
      const { title, description, imageUrl, videoUrl, type, category, isPublished } = req.body;
      const school = await prisma.school.findFirst();
      if (!school) return res.status(404).json({ success: false, message: 'School not found' });

      const item = await prisma.gallery.create({
        data: {
          schoolId: school.id,
          title,
          description,
          imageUrl: imageUrl || '',
          videoUrl,
          type: type || 'image',
          category: category || 'general',
          uploadedBy: (req as any).user?.userId || 'admin',
          isPublished: isPublished !== false
        }
      });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to create gallery item' });
    }
  },

  updateGalleryItem: async (req: Request, res: Response) => {
    try {
      const { title, description, imageUrl, videoUrl, type, category, isPublished } = req.body;
      const item = await prisma.gallery.update({
        where: { id: req.params.id },
        data: { title, description, imageUrl, videoUrl, type, category, isPublished }
      });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update gallery item' });
    }
  },

  deleteGalleryItem: async (req: Request, res: Response) => {
    try {
      await prisma.gallery.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to delete gallery item' });
    }
  },

  listVideos: async (req: Request, res: Response) => {
    try {
      const videos = await prisma.gallery.findMany({ where: { type: 'video' } });
      res.json({ success: true, data: videos });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load videos' });
    }
  },

  uploadVideo: async (req: Request, res: Response) => {
    try {
      const { title, description, videoUrl, category } = req.body;
      const school = await prisma.school.findFirst();
      if (!school) return res.status(404).json({ success: false, message: 'School not found' });

      const video = await prisma.gallery.create({
        data: {
          schoolId: school.id,
          title,
          description,
          imageUrl: '',
          videoUrl,
          type: 'video',
          category: category || 'general',
          uploadedBy: (req as any).user?.userId || 'admin',
          isPublished: true
        }
      });
      res.status(201).json({ success: true, data: video });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to upload video' });
    }
  },

  getEventMedia: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const media = await prisma.gallery.findMany({ where: { category: eventId } });
      res.json({ success: true, data: media });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load event media' });
    }
  },

  uploadEventMedia: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { title, description, imageUrl, videoUrl } = req.body;
      const school = await prisma.school.findFirst();
      if (!school) return res.status(404).json({ success: false, message: 'School not found' });

      const media = await prisma.gallery.create({
        data: {
          schoolId: school.id,
          title,
          description,
          imageUrl: imageUrl || '',
          videoUrl,
          type: videoUrl ? 'video' : 'image',
          category: eventId,
          uploadedBy: (req as any).user?.userId || 'admin',
          isPublished: true
        }
      });
      res.status(201).json({ success: true, data: media });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to upload event media' });
    }
  },

  getAchievementsMedia: async (_req: Request, res: Response) => {
    try {
      const media = await prisma.gallery.findMany({ where: { category: 'achievements' } });
      res.json({ success: true, data: media });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load achievements media' });
    }
  },

  uploadAchievementMedia: async (req: Request, res: Response) => {
    try {
      const { title, description, imageUrl, videoUrl } = req.body;
      const school = await prisma.school.findFirst();
      if (!school) return res.status(404).json({ success: false, message: 'School not found' });

      const media = await prisma.gallery.create({
        data: {
          schoolId: school.id,
          title,
          description,
          imageUrl: imageUrl || '',
          videoUrl,
          type: videoUrl ? 'video' : 'image',
          category: 'achievements',
          uploadedBy: (req as any).user?.userId || 'admin',
          isPublished: true
        }
      });
      res.status(201).json({ success: true, data: media });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to upload achievement media' });
    }
  },

  publishMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const media = await prisma.gallery.update({
        where: { id },
        data: { isPublished: true }
      });
      res.json({ success: true, data: media });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to publish media' });
    }
  },

  unpublishMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const media = await prisma.gallery.update({
        where: { id },
        data: { isPublished: false }
      });
      res.json({ success: true, data: media });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to unpublish media' });
    }
  }
};