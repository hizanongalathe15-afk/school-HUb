import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const inventoryController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const { search, category, lowStock } = req.query as { search?: string; category?: string; lowStock?: string };
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { supplier: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (category) where.category = category;
      if (lowStock === 'true') where.quantity = { lte: prisma.inventoryItem.fields.minThreshold };

      const items = await prisma.inventoryItem.findMany({ where, orderBy: { createdAt: 'desc' } });
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load inventory' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
      if (!item) return res.status(404).json({ message: 'Item not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load item' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { name, category, quantity, unit, minThreshold, maxQuantity, price, supplier, location, description } = req.body;
      const item = await prisma.inventoryItem.create({
        data: {
          name,
          category,
          quantity: Number(quantity),
          unit: unit || 'pcs',
          minThreshold: Number(minThreshold) || 10,
          maxQuantity: maxQuantity ? Number(maxQuantity) : undefined,
          price: Number(price),
          supplier,
          location,
          description,
          lastRestocked: new Date()
        }
      });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ message: 'Unable to create inventory item' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { name, category, quantity, unit, minThreshold, maxQuantity, price, supplier, location, description } = req.body;
      const item = await prisma.inventoryItem.update({
        where: { id: req.params.id },
        data: { name, category, quantity, unit, minThreshold, maxQuantity, price, supplier, location, description }
      });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ message: 'Unable to update inventory item' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await prisma.inventoryItem.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Unable to delete inventory item' });
    }
  },

  updateQuantity: async (req: Request, res: Response) => {
    try {
      const { quantity, action } = req.body;
      const item = await prisma.inventoryItem.update({
        where: { id: req.params.id },
        data: { quantity: { [action === 'add' ? 'increment' : 'decrement']: Number(quantity) } }
      });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ message: 'Unable to update quantity' });
    }
  },

  // Stock requests
  getRequests: async (req: Request, res: Response) => {
    try {
      const { status, itemId } = req.query as { status?: string; itemId?: string };
      const where: any = {};
      if (status) where.status = status;
      if (itemId) where.itemId = itemId;

      const requests = await prisma.stockRequest.findMany({
        where,
        include: { item: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: requests });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load stock requests' });
    }
  },

  createRequest: async (req: Request, res: Response) => {
    try {
      const { itemId, requestedBy, quantity, purpose } = req.body;
      const request = await prisma.stockRequest.create({
        data: {
          itemId,
          requestedBy,
          quantity: Number(quantity),
          purpose,
          status: 'PENDING'
        }
      });
      res.status(201).json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ message: 'Unable to create stock request' });
    }
  },

  approveRequest: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { approvedBy, quantity } = req.body;
      
      const updated = await prisma.$transaction(async (tx) => {
        const request = await tx.stockRequest.update({
          where: { id },
          data: { status: 'APPROVED', approvedBy, approvedAt: new Date() }
        });
        await tx.inventoryItem.update({
          where: { id: request.itemId },
          data: { quantity: { increment: Number(quantity) } }
        });
        return request;
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ message: 'Unable to approve request' });
    }
  },

  rejectRequest: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request = await prisma.stockRequest.update({
        where: { id },
        data: { status: 'REJECTED' }
      });
      res.json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ message: 'Unable to reject request' });
    }
  },

  getLowStock: async (_req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany({
        where: { quantity: { lte: prisma.inventoryItem.fields.minThreshold } }
      });
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load low stock items' });
    }
  }
};