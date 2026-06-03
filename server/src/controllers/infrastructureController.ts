import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const infrastructureController = {
  getInfrastructure: async (_req: Request, res: Response) => {
    try {
      const infra = await prisma.infrastructure.findFirst({ include: { school: true } });
      res.json({ success: true, data: infra });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load infrastructure data' });
    }
  },

  updateInfrastructure: async (req: Request, res: Response) => {
    try {
      const { 
        classroomCount, classroomImages, labCount, labImages, computerLabCount, computerLabImages,
        libraryCount, libraryImages, libraryBooks, sportsFieldCount, sportsFieldImages,
        dormitoryCount, dormitoryCapacity, dormitoryImages, diningHallCapacity, diningHallImages,
        chapelCount, chapelImages, adminBlockCount, adminBlockImages, staffRoomCount, staffRoomImages,
        assemblyHallCapacity, assemblyHallImages, parkingSpaces, parkingImages
      } = req.body;
      
      const school = await prisma.school.findFirst();
      if (!school) return res.status(404).json({ success: false, message: 'School not found' });

      const infra = await prisma.infrastructure.upsert({
        where: { schoolId: school.id },
        create: {
          schoolId: school.id,
          classroomCount: Number(classroomCount) || 0, classroomImages,
          labCount: Number(labCount) || 0, labImages,
          computerLabCount: Number(computerLabCount) || 0, computerLabImages,
          libraryCount: Number(libraryCount) || 0, libraryImages, libraryBooks: Number(libraryBooks) || 0,
          sportsFieldCount: Number(sportsFieldCount) || 0, sportsFieldImages,
          dormitoryCount: Number(dormitoryCount) || 0, dormitoryCapacity: Number(dormitoryCapacity) || 0, dormitoryImages,
          diningHallCapacity: Number(diningHallCapacity) || 0, diningHallImages,
          chapelCount: Number(chapelCount) || 0, chapelImages,
          adminBlockCount: Number(adminBlockCount) || 0, adminBlockImages,
          staffRoomCount: Number(staffRoomCount) || 0, staffRoomImages,
          assemblyHallCapacity: Number(assemblyHallCapacity) || 0, assemblyHallImages,
          parkingSpaces: Number(parkingSpaces) || 0, parkingImages
        },
        update: {
          classroomCount: Number(classroomCount) || 0, classroomImages,
          labCount: Number(labCount) || 0, labImages,
          computerLabCount: Number(computerLabCount) || 0, computerLabImages,
          libraryCount: Number(libraryCount) || 0, libraryImages, libraryBooks: Number(libraryBooks) || 0,
          sportsFieldCount: Number(sportsFieldCount) || 0, sportsFieldImages,
          dormitoryCount: Number(dormitoryCount) || 0, dormitoryCapacity: Number(dormitoryCapacity) || 0, dormitoryImages,
          diningHallCapacity: Number(diningHallCapacity) || 0, diningHallImages,
          chapelCount: Number(chapelCount) || 0, chapelImages,
          adminBlockCount: Number(adminBlockCount) || 0, adminBlockImages,
          staffRoomCount: Number(staffRoomCount) || 0, staffRoomImages,
          assemblyHallCapacity: Number(assemblyHallCapacity) || 0, assemblyHallImages,
          parkingSpaces: Number(parkingSpaces) || 0, parkingImages
        }
      });

      res.json({ success: true, data: infra });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update infrastructure data' });
    }
  },

  getMaintenanceJobs: async (req: Request, res: Response) => {
    try {
      const { status } = req.query as { status?: string };
      const jobs = await prisma.setting.findMany({
        where: status ? { key: { contains: 'maintenance' } } : {}
      });
      res.json({ success: true, data: jobs });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load maintenance jobs' });
    }
  },

  createMaintenanceJob: async (req: Request, res: Response) => {
    try {
      const { facilityId, issue, priority, description } = req.body;
      const job = await prisma.setting.create({
        data: {
          key: `maintenance_${facilityId}_${Date.now()}`,
          value: { issue, priority, description, status: 'pending' },
          group: 'maintenance'
        }
      });
      res.status(201).json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to create maintenance job' });
    }
  },

  updateMaintenanceJob: async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { status, notes } = req.body;
      const job = await prisma.setting.update({
        where: { id: jobId },
        data: {
          value: { ...(await prisma.setting.findUnique({ where: { id: jobId } })), ...req.body }
        }
      });
      res.json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update maintenance job' });
    }
  }
};