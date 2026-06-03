import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const locationController = {
  getLocationInfo: async (_req: Request, res: Response) => {
    try {
      const location = await prisma.locationInfo.findFirst({ include: { school: true } });
      res.json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load location info' });
    }
  },

  updateLocationInfo: async (req: Request, res: Response) => {
    try {
      const { 
        soilType, soilQuality, roadAccess, roadDistance, roadImages, 
        surroundings, surroundingImages, climate, nearestTown, nearestHospital, 
        nearestPolice, landmarks, droneImages, droneVideos 
      } = req.body;
      
      const school = await prisma.school.findFirst();
      if (!school) return res.status(404).json({ success: false, message: 'School not found' });

      const location = await prisma.locationInfo.upsert({
        where: { schoolId: school.id },
        create: {
          schoolId: school.id,
          soilType, soilQuality, roadAccess, roadDistance, roadImages,
          surroundings, surroundingImages, climate, nearestTown, nearestHospital,
          nearestPolice, landmarks, droneImages, droneVideos
        },
        update: {
          soilType, soilQuality, roadAccess, roadDistance, roadImages,
          surroundings, surroundingImages, climate, nearestTown, nearestHospital,
          nearestPolice, landmarks, droneImages, droneVideos
        }
      });

      res.json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update location info' });
    }
  },

  getMapPins: async (_req: Request, res: Response) => {
    try {
      const location = await prisma.locationInfo.findFirst();
      const pins = [
        { id: 'main_gate', name: 'Main Gate', type: 'entrance', lat: -1.234, lng: 36.789 },
        { id: 'bus_stop', name: 'Bus Drop-off', type: 'transport', lat: -1.235, lng: 36.790 },
        { id: 'sports_field', name: 'Sports Field', type: 'sports', lat: -1.236, lng: 36.791 }
      ];
      res.json({ success: true, data: pins });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load map pins' });
    }
  },

  addMapPin: async (req: Request, res: Response) => {
    try {
      const pin = { id: `pin_${Date.now()}`, ...req.body };
      res.status(201).json({ success: true, data: pin });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to add map pin' });
    }
  },

  getRoutes: async (_req: Request, res: Response) => {
    try {
      const routes = [
        { id: 'route_1', name: 'Main Access Road', type: 'vehicle', distance: '2.5km', status: 'good' },
        { id: 'route_2', name: 'Pedestrian Path', type: 'walking', distance: '0.8km', status: 'good' }
      ];
      res.json({ success: true, data: routes });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load routes' });
    }
  },

  addRoute: async (req: Request, res: Response) => {
    try {
      const route = { id: `route_${Date.now()}`, ...req.body };
      res.status(201).json({ success: true, data: route });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to add route' });
    }
  },

  getVisitorDirections: async (_req: Request, res: Response) => {
    try {
      const location = await prisma.locationInfo.findFirst();
      const directions = {
        fromTown: 'From Nairobi, take Thika Road towards Garissa. Turn left at the school signpost.',
        landmarks: location?.landmarks || [],
        estimatedTime: '45 minutes from CBD'
      };
      res.json({ success: true, data: directions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load visitor directions' });
    }
  }
};