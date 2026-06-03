import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = prisma as any;

const asNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const addDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const userId = (req: Request) => (req as any).user?.userId as string | undefined;

const statusToApi = (status?: string) => (status || '').toLowerCase();
const statusToDb = (status?: string) => (status || '').toUpperCase().replace(/-/g, '_');
const movementToApi = (type?: string) => (type || '').toLowerCase();
const movementToDb = (type?: string) => (type || '').toUpperCase().replace(/-/g, '_');

const itemPayload = (item: any) => ({
  id: item.id,
  sku: item.sku || item.id,
  name: item.name,
  description: item.description || '',
  category: item.category,
  quantity: item.quantity,
  unit: item.unit,
  unitPrice: item.price,
  price: item.price,
  totalValue: item.price * item.quantity,
  reorderLevel: item.minThreshold,
  minThreshold: item.minThreshold,
  maxLevel: item.maxQuantity,
  location: item.location || '',
  shelf: item.shelf || '',
  supplier: item.supplierRecord || item.supplier || undefined,
  supplierId: item.supplierId || undefined,
  barcode: item.barcode || undefined,
  serialNumber: item.serialNumber || undefined,
  batchNumber: item.batchNumber || undefined,
  expiryDate: item.expiryDate?.toISOString(),
  imageUrl: item.imageUrl || undefined,
  status: item.status || 'active',
  tags: [],
  createdAt: item.createdAt?.toISOString(),
  updatedAt: item.updatedAt?.toISOString(),
});

const requestPayload = (request: any) => ({
  id: request.id,
  title: `${request.item?.name || 'Stock'} request`,
  requestNumber: `REQ-${request.id.slice(-6).toUpperCase()}`,
  requesterId: request.requestedBy,
  requesterName: request.requestedBy,
  requestedBy: request.requestedBy,
  requesterRole: 'staff',
  department: '',
  items: [{
    itemId: request.itemId,
    itemName: request.item?.name || 'Unknown item',
    requestedQuantity: request.quantity,
    approvedQuantity: request.status === 'APPROVED' || request.status === 'ISSUED' ? request.quantity : undefined,
    fulfilledQuantity: request.status === 'ISSUED' ? request.quantity : undefined,
    unit: request.item?.unit || 'pcs',
    unitPrice: request.item?.price || 0,
    totalCost: (request.item?.price || 0) * request.quantity,
  }],
  priority: 'normal',
  purpose: request.purpose,
  status: request.status === 'ISSUED' ? 'fulfilled' : statusToApi(request.status),
  requestedDate: request.createdAt?.toISOString(),
  requiredDate: request.createdAt?.toISOString(),
  approvedBy: request.approvedBy || undefined,
  approvedAt: request.approvedAt?.toISOString(),
  fulfilledAt: request.issuedAt?.toISOString(),
  notes: request.notes || undefined,
  rejectionReason: request.status === 'REJECTED' ? request.notes : undefined,
});

const movementPayload = (movement: any) => ({
  id: movement.id,
  date: movement.createdAt?.toISOString(),
  type: movementToApi(movement.movementType),
  itemId: movement.itemId,
  itemName: movement.item?.name || 'Unknown item',
  movementType: movementToApi(movement.movementType),
  quantity: movement.quantity,
  unit: movement.item?.unit || 'pcs',
  unitPrice: movement.unitPrice || movement.item?.price,
  totalValue: (movement.unitPrice || movement.item?.price || 0) * movement.quantity,
  fromLocation: movement.fromLocation || undefined,
  toLocation: movement.toLocation || undefined,
  fromTo: [movement.fromLocation, movement.toLocation].filter(Boolean).join(' -> ') || movement.counterpartyName || '',
  referenceType: movement.referenceType || undefined,
  referenceId: movement.referenceId || undefined,
  referenceNumber: movement.referenceNumber || undefined,
  issuedTo: movement.counterpartyId || undefined,
  issuedToName: movement.counterpartyName || undefined,
  issuedById: movement.actorId || '',
  issuedByName: movement.actorName || 'Store keeper',
  by: movement.actorName || 'Store keeper',
  notes: movement.notes || undefined,
  createdAt: movement.createdAt?.toISOString(),
});

const purchaseOrderPayload = (po: any) => {
  const items = po.items || [];
  const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
  return {
    id: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId || '',
    supplierName: po.supplierName,
    supplier: po.supplierName,
    items: items.map((item: any) => ({
      itemId: item.itemId || undefined,
      itemName: item.itemName,
      description: item.description || undefined,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalCost: item.quantity * item.unitPrice,
      deliveredQuantity: item.receivedQuantity,
      receivedDate: item.receivedQuantity ? item.updatedAt?.toISOString() : undefined,
    })),
    total: totalAmount,
    totalAmount,
    grandTotal: totalAmount,
    status: statusToApi(po.status),
    priority: po.priority,
    expectedDeliveryDate: po.expectedDeliveryDate?.toISOString(),
    actualDeliveryDate: po.actualDeliveryDate?.toISOString(),
    deliveryAddress: '',
    paymentTerms: po.paymentTerms || '',
    notes: po.notes || undefined,
    attachments: po.attachmentUrl ? [po.attachmentUrl] : [],
    createdBy: po.createdBy || '',
    approvedBy: po.approvedBy || undefined,
    approvedAt: po.approvedAt?.toISOString(),
    createdAt: po.createdAt?.toISOString(),
    updatedAt: po.updatedAt?.toISOString(),
  };
};

const stockTakePayload = (stockTake: any) => {
  const items = stockTake.items || [];
  const counted = items.filter((item: any) => item.countedQuantity !== null && item.countedQuantity !== undefined);
  const discrepancies = items.filter((item: any) => item.countedQuantity !== null && item.countedQuantity !== undefined && item.countedQuantity !== item.systemQuantity);
  return {
    id: stockTake.id,
    stockTakeNumber: stockTake.stockTakeNumber,
    name: stockTake.name,
    description: stockTake.description || undefined,
    status: statusToApi(stockTake.status),
    scheduledDate: stockTake.scheduledDate?.toISOString(),
    completedDate: stockTake.completedDate?.toISOString(),
    items: items.map((row: any) => {
      const countedQuantity = row.countedQuantity ?? undefined;
      const variance = countedQuantity === undefined ? 0 : countedQuantity - row.systemQuantity;
      return {
        itemId: row.itemId,
        itemName: row.item?.name || 'Unknown item',
        category: row.item?.category || '',
        location: row.item?.location || '',
        systemQuantity: row.systemQuantity,
        countedQuantity,
        variance,
        variancePercentage: row.systemQuantity ? (variance / row.systemQuantity) * 100 : 0,
        unitPrice: row.item?.price || 0,
        varianceValue: variance * (row.item?.price || 0),
        status: countedQuantity === undefined ? 'pending' : variance === 0 ? 'verified' : 'discrepancy',
        countedBy: row.countedBy || undefined,
        countedAt: row.countedAt?.toISOString(),
        verifiedBy: row.verifiedBy || undefined,
        verifiedAt: row.verifiedAt?.toISOString(),
        notes: row.notes || undefined,
      };
    }),
    totalItems: items.length,
    countedItems: counted.length,
    discrepancies: discrepancies.length,
    adjustedValue: discrepancies.reduce((sum: number, row: any) => sum + ((row.countedQuantity - row.systemQuantity) * (row.item?.price || 0)), 0),
    notes: stockTake.notes || undefined,
    createdBy: stockTake.createdBy || '',
    approvedBy: stockTake.approvedBy || undefined,
    createdAt: stockTake.createdAt?.toISOString(),
    updatedAt: stockTake.updatedAt?.toISOString(),
  };
};

const paginate = (req: Request) => {
  const page = Math.max(1, asNumber(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, asNumber(req.query.limit, 50)));
  return { page, limit, skip: (page - 1) * limit };
};

const createMovement = async (tx: any, data: {
  itemId: string;
  movementType: string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  unitPrice?: number;
  fromLocation?: string;
  toLocation?: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  actorId?: string;
  actorName?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  condition?: string;
  notes?: string;
}) => tx.stockMovement.create({ data });

export const storeKeeperController = {
  getDashboard: async (req: Request, res: Response) => {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [items, pendingRequests, recentMovements] = await Promise.all([
        prisma.inventoryItem.findMany({ include: { supplierRecord: true } as any }),
        prisma.stockRequest.findMany({ where: { status: 'PENDING' }, include: { item: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
        db.stockMovement.findMany({ include: { item: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
      ]);

      const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);
      const expiringItems = items.filter((item: any) => item.expiryDate && item.expiryDate <= addDays(30));
      const monthlyIssuesCount = await db.stockMovement.count({ where: { movementType: 'ISSUE', createdAt: { gte: monthStart } } });
      const monthlyReturnsCount = await db.stockMovement.count({ where: { movementType: 'RETURN', createdAt: { gte: monthStart } } });

      res.json({
        success: true,
        data: {
          quickStats: {
            totalItems: items.length,
            totalValue: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            lowStockCount: lowStockItems.length,
            outOfStockCount: items.filter(item => item.quantity === 0).length,
            pendingRequestsCount: pendingRequests.length,
            expiringItemsCount: expiringItems.length,
            overdueBorrowingsCount: 0,
            monthlyIssuesCount,
            monthlyReturnsCount,
          },
          lowStockItems: lowStockItems.slice(0, 10).map(itemPayload),
          pendingRequests: pendingRequests.map(requestPayload),
          expiringItems: expiringItems.slice(0, 10).map(itemPayload),
          overdueBorrowings: [],
          recentMovements: recentMovements.map(movementPayload),
          alerts: lowStockItems.slice(0, 10).map(item => ({
            id: `low-${item.id}`,
            type: item.quantity === 0 ? 'out_of_stock' : 'low_stock',
            severity: item.quantity === 0 ? 'critical' : 'high',
            itemId: item.id,
            itemName: item.name,
            currentQuantity: item.quantity,
            reorderLevel: item.minThreshold,
            message: `${item.name} has ${item.quantity} ${item.unit} remaining`,
            action: 'reorder',
            isRead: false,
            createdAt: new Date().toISOString(),
          })),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load dashboard' });
    }
  },

  getInventory: async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = paginate(req);
      const { category, location, status, search, lowStock } = req.query as any;
      const where: any = {};

      if (category) where.category = category;
      if (location) where.location = location;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [allMatching, items] = await Promise.all([
        prisma.inventoryItem.findMany({ where, include: { supplierRecord: true } as any }),
        prisma.inventoryItem.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: { supplierRecord: true } as any }),
      ]);

      const filtered = lowStock === 'true' ? allMatching.filter(item => item.quantity <= item.minThreshold) : items;
      const total = lowStock === 'true' ? filtered.length : allMatching.length;

      res.json({
        success: true,
        data: filtered.map(itemPayload),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load inventory' });
    }
  },

  getLowStockItems: async (_req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany({ include: { supplierRecord: true } as any });
      res.json({ success: true, data: items.filter((item) => item.quantity <= item.minThreshold).map(itemPayload) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load low stock items' });
    }
  },

  getItem: async (req: Request, res: Response) => {
    try {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: req.params.itemId },
        include: { supplierRecord: true, stockMovements: { orderBy: { createdAt: 'desc' }, take: 25 } } as any,
      });
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      res.json({ success: true, data: itemPayload(item) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load item' });
    }
  },

  uploadItemImage: async (req: Request, res: Response) => {
    try {
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) return res.status(400).json({ success: false, message: 'No image uploaded' });

      const imageUrl = `/uploads/inventory/${file.filename}`;
      const itemId = req.params.itemId;
      if (itemId !== 'temp') {
        await prisma.inventoryItem.update({
          where: { id: itemId },
          data: { imageUrl } as any,
        });
      }

      res.status(201).json({ success: true, data: { url: imageUrl, imageUrl } });
    } catch (error) {
      console.error('Error uploading item image:', error);
      res.status(500).json({ success: false, message: 'Unable to upload item image' });
    }
  },

  addItem: async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const item = await prisma.inventoryItem.create({
        data: {
          sku: body.sku || body.itemCode || undefined,
          name: body.name,
          category: body.category || 'General',
          quantity: asNumber(body.quantity),
          unit: body.unit || 'pcs',
          price: asNumber(body.unitPrice ?? body.price),
          minThreshold: asNumber(body.reorderLevel ?? body.minThreshold ?? body.minStock, 10),
          maxQuantity: body.maxLevel ?? body.maxQuantity ? asNumber(body.maxLevel ?? body.maxQuantity) : undefined,
          supplier: body.supplierName || body.supplier || undefined,
          supplierId: body.supplierId || undefined,
          location: body.location || undefined,
          shelf: body.shelf || undefined,
          description: body.description || body.notes || undefined,
          barcode: body.barcode || undefined,
          serialNumber: body.serialNumber || undefined,
          batchNumber: body.batchNumber || undefined,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
          imageUrl: body.imageUrl || undefined,
          status: body.status || 'active',
          lastRestocked: asNumber(body.quantity) > 0 ? new Date() : undefined,
        } as any,
      });

      if (item.quantity > 0) {
        await db.stockMovement.create({
          data: {
            itemId: item.id,
            movementType: 'RECEIVE',
            quantity: item.quantity,
            unitPrice: item.price,
            toLocation: item.location,
            actorId: userId(req),
            actorName: 'Store keeper',
            beforeQuantity: 0,
            afterQuantity: item.quantity,
            notes: 'Initial stock entry',
          },
        });
      }

      res.status(201).json({ success: true, data: itemPayload(item) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to add item' });
    }
  },

  updateItem: async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const item = await prisma.inventoryItem.update({
        where: { id: req.params.itemId },
        data: {
          sku: body.sku ?? undefined,
          name: body.name ?? undefined,
          category: body.category ?? undefined,
          quantity: body.quantity !== undefined ? asNumber(body.quantity) : undefined,
          unit: body.unit ?? undefined,
          price: body.unitPrice !== undefined || body.price !== undefined ? asNumber(body.unitPrice ?? body.price) : undefined,
          minThreshold: body.reorderLevel !== undefined || body.minThreshold !== undefined || body.minStock !== undefined ? asNumber(body.reorderLevel ?? body.minThreshold ?? body.minStock) : undefined,
          maxQuantity: body.maxLevel !== undefined || body.maxQuantity !== undefined ? asNumber(body.maxLevel ?? body.maxQuantity) : undefined,
          supplier: body.supplierName ?? body.supplier ?? undefined,
          supplierId: body.supplierId ?? undefined,
          location: body.location ?? undefined,
          shelf: body.shelf ?? undefined,
          description: body.description ?? body.notes ?? undefined,
          barcode: body.barcode ?? undefined,
          serialNumber: body.serialNumber ?? undefined,
          batchNumber: body.batchNumber ?? undefined,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
          imageUrl: body.imageUrl ?? undefined,
          status: body.status ?? undefined,
        } as any,
      });
      res.json({ success: true, data: itemPayload(item) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update item' });
    }
  },

  deleteItem: async (req: Request, res: Response) => {
    try {
      const movementCount = await db.stockMovement.count({ where: { itemId: req.params.itemId } });
      const requestCount = await prisma.stockRequest.count({ where: { itemId: req.params.itemId } });
      if (movementCount || requestCount) {
        const item = await prisma.inventoryItem.update({ where: { id: req.params.itemId }, data: { status: 'discontinued' } as any });
        return res.json({ success: true, message: 'Item has history and was archived instead of deleted', data: itemPayload(item) });
      }
      await prisma.inventoryItem.delete({ where: { id: req.params.itemId } });
      res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to delete item' });
    }
  },

  updateQuantity: async (req: Request, res: Response) => {
    try {
      const { quantity, reason } = req.body;
      const nextQuantity = asNumber(quantity);
      const item = await prisma.$transaction(async tx => {
        const current = await tx.inventoryItem.findUnique({ where: { id: req.params.itemId } });
        if (!current) throw new Error('NOT_FOUND');
        const updated = await tx.inventoryItem.update({ where: { id: current.id }, data: { quantity: nextQuantity } });
        await createMovement(tx as any, {
          itemId: current.id,
          movementType: 'ADJUSTMENT',
          quantity: Math.abs(nextQuantity - current.quantity),
          unitPrice: current.price,
          beforeQuantity: current.quantity,
          afterQuantity: nextQuantity,
          actorId: userId(req),
          actorName: 'Store keeper',
          notes: reason || 'Manual stock adjustment',
        });
        return updated;
      });
      res.json({ success: true, data: itemPayload(item) });
    } catch (error: any) {
      res.status(error.message === 'NOT_FOUND' ? 404 : 500).json({ success: false, message: error.message === 'NOT_FOUND' ? 'Item not found' : 'Unable to update quantity' });
    }
  },

  getItemHistory: async (req: Request, res: Response) => {
    try {
      const movements = await db.stockMovement.findMany({ where: { itemId: req.params.itemId }, include: { item: true }, orderBy: { createdAt: 'desc' } });
      res.json({ success: true, data: movements.map(movementPayload) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load item history' });
    }
  },

  getCategories: async (_req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany();
      const names = [...new Set(items.map(item => item.category))].sort();
      res.json({
        success: true,
        data: names.map(name => {
          const categoryItems = items.filter(item => item.category === name);
          return {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            description: '',
            subCategories: [],
            itemCount: categoryItems.length,
            totalValue: categoryItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          };
        }),
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load categories' });
    }
  },

  addCategory: async (req: Request, res: Response) => {
    res.status(201).json({
      success: true,
      data: {
        id: String(req.body.name || 'category').toLowerCase().replace(/\s+/g, '-'),
        name: req.body.name,
        description: req.body.description || '',
        subCategories: [],
        itemCount: 0,
        totalValue: 0,
      },
    });
  },

  getSuppliers: async (req: Request, res: Response) => {
    try {
      const where: any = {};
      if (req.query.status) where.status = req.query.status;
      if (req.query.search) where.name = { contains: req.query.search, mode: 'insensitive' };
      const suppliers = await db.supplier.findMany({ where, include: { items: true, purchaseOrders: true }, orderBy: { name: 'asc' } });
      res.json({ success: true, data: suppliers.map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: '',
        country: 'Kenya',
        paymentTerms: supplier.paymentTerms || '',
        rating: supplier.rating,
        status: supplier.status,
        items: supplier.items.map(itemPayload),
        totalOrders: supplier.purchaseOrders.length,
        totalSpent: 0,
        notes: supplier.notes || undefined,
        createdAt: supplier.createdAt.toISOString(),
        updatedAt: supplier.updatedAt.toISOString(),
      })) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load suppliers' });
    }
  },

  getSupplier: async (req: Request, res: Response) => {
    try {
      const supplier = await db.supplier.findUnique({
        where: { id: req.params.supplierId },
        include: { items: true, purchaseOrders: { include: { items: true }, orderBy: { createdAt: 'desc' } } },
      });
      if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
      res.json({ success: true, data: {
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: '',
        country: 'Kenya',
        paymentTerms: supplier.paymentTerms || '',
        rating: supplier.rating,
        status: supplier.status,
        items: supplier.items.map(itemPayload),
        totalOrders: supplier.purchaseOrders.length,
        totalSpent: supplier.purchaseOrders.reduce((sum: number, po: any) => sum + po.items.reduce((inner: number, item: any) => inner + item.quantity * item.unitPrice, 0), 0),
        notes: supplier.notes || undefined,
        createdAt: supplier.createdAt.toISOString(),
        updatedAt: supplier.updatedAt.toISOString(),
      } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load supplier' });
    }
  },

  addSupplier: async (req: Request, res: Response) => {
    try {
      const supplier = await db.supplier.create({ data: req.body });
      res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to add supplier' });
    }
  },

  updateSupplier: async (req: Request, res: Response) => {
    try {
      const supplier = await db.supplier.update({ where: { id: req.params.supplierId }, data: req.body });
      res.json({ success: true, data: supplier });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update supplier' });
    }
  },

  deleteSupplier: async (req: Request, res: Response) => {
    try {
      await db.supplier.update({ where: { id: req.params.supplierId }, data: { status: 'inactive' } });
      res.json({ success: true, message: 'Supplier archived' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to archive supplier' });
    }
  },

  getRequests: async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = paginate(req);
      const where: any = {};
      if (req.query.status) where.status = statusToDb(String(req.query.status === 'fulfilled' ? 'ISSUED' : req.query.status));
      const [requests, total] = await Promise.all([
        prisma.stockRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { item: true } }),
        prisma.stockRequest.count({ where }),
      ]);
      res.json({ success: true, data: requests.map(requestPayload), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load requests' });
    }
  },

  getRequest: async (req: Request, res: Response) => {
    try {
      const request = await prisma.stockRequest.findUnique({ where: { id: req.params.requestId }, include: { item: true } });
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      res.json({ success: true, data: requestPayload(request) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load request' });
    }
  },

  createRequest: async (req: Request, res: Response) => {
    try {
      const firstItem = req.body.items?.[0] || req.body;
      const request = await prisma.stockRequest.create({
        data: {
          itemId: firstItem.itemId,
          requestedBy: req.body.requesterName || req.body.requestedBy || userId(req) || 'storekeeper',
          quantity: asNumber(firstItem.requestedQuantity ?? firstItem.quantity, 1),
          purpose: req.body.purpose || firstItem.notes || 'Stock request',
        },
        include: { item: true },
      });
      res.status(201).json({ success: true, data: requestPayload(request) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to create request' });
    }
  },

  approveRequest: async (req: Request, res: Response) => {
    try {
      const request = await prisma.stockRequest.update({
        where: { id: req.params.requestId },
        data: { status: 'APPROVED', approvedBy: userId(req), approvedAt: new Date(), notes: req.body.notes },
        include: { item: true },
      });
      res.json({ success: true, data: requestPayload(request) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to approve request' });
    }
  },

  rejectRequest: async (req: Request, res: Response) => {
    try {
      const request = await prisma.stockRequest.update({
        where: { id: req.params.requestId },
        data: { status: 'REJECTED', notes: req.body.reason || 'Rejected' },
        include: { item: true },
      });
      res.json({ success: true, data: requestPayload(request) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to reject request' });
    }
  },

  fulfillRequest: async (req: Request, res: Response) => {
    try {
      const request = await prisma.$transaction(async tx => {
        const current = await tx.stockRequest.findUnique({ where: { id: req.params.requestId }, include: { item: true } });
        if (!current) throw new Error('NOT_FOUND');
        if (current.item.quantity < current.quantity) throw new Error('INSUFFICIENT_STOCK');
        const updatedItem = await tx.inventoryItem.update({ where: { id: current.itemId }, data: { quantity: current.item.quantity - current.quantity } });
        await createMovement(tx as any, {
          itemId: current.itemId,
          movementType: 'ISSUE',
          quantity: current.quantity,
          unitPrice: current.item.price,
          fromLocation: current.item.location || undefined,
          referenceType: 'stock_request',
          referenceId: current.id,
          referenceNumber: `REQ-${current.id.slice(-6).toUpperCase()}`,
          actorId: userId(req),
          actorName: 'Store keeper',
          counterpartyName: current.requestedBy,
          beforeQuantity: current.item.quantity,
          afterQuantity: updatedItem.quantity,
          notes: req.body.notes || current.purpose,
        });
        return tx.stockRequest.update({ where: { id: current.id }, data: { status: 'ISSUED', issuedAt: new Date() }, include: { item: true } });
      });
      res.json({ success: true, data: requestPayload(request) });
    } catch (error: any) {
      res.status(error.message === 'INSUFFICIENT_STOCK' ? 409 : error.message === 'NOT_FOUND' ? 404 : 500).json({ success: false, message: error.message === 'INSUFFICIENT_STOCK' ? 'Insufficient stock to fulfill request' : 'Unable to fulfill request' });
    }
  },

  getPurchaseOrders: async (req: Request, res: Response) => {
    try {
      const where: any = {};
      if (req.query.status) where.status = statusToDb(String(req.query.status));
      if (req.query.supplierId) where.supplierId = req.query.supplierId;
      const orders = await db.purchaseOrder.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' } });
      res.json({ success: true, data: orders.map(purchaseOrderPayload) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load purchase orders' });
    }
  },

  getPurchaseOrder: async (req: Request, res: Response) => {
    try {
      const po = await db.purchaseOrder.findUnique({ where: { id: req.params.poId }, include: { items: true } });
      if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
      res.json({ success: true, data: purchaseOrderPayload(po) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load purchase order' });
    }
  },

  createPurchaseOrder: async (req: Request, res: Response) => {
    try {
      const items = req.body.items || [];
      const po = await db.purchaseOrder.create({
        data: {
          poNumber: req.body.poNumber || `PO-${Date.now()}`,
          supplierId: req.body.supplierId || undefined,
          supplierName: req.body.supplierName || req.body.supplier || 'Unknown supplier',
          status: statusToDb(req.body.status || 'DRAFT'),
          priority: req.body.priority || 'normal',
          expectedDeliveryDate: req.body.expectedDeliveryDate ? new Date(req.body.expectedDeliveryDate) : undefined,
          paymentTerms: req.body.paymentTerms || undefined,
          notes: req.body.notes || undefined,
          createdBy: userId(req),
          items: {
            create: items.map((item: any) => ({
              itemId: item.itemId || undefined,
              itemName: item.itemName || item.name,
              description: item.description || undefined,
              quantity: asNumber(item.quantity, 1),
              unit: item.unit || 'pcs',
              unitPrice: asNumber(item.unitPrice ?? item.price),
            })),
          },
        },
        include: { items: true },
      });
      res.status(201).json({ success: true, data: purchaseOrderPayload(po) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to create purchase order' });
    }
  },

  updatePurchaseOrder: async (req: Request, res: Response) => {
    try {
      const po = await db.purchaseOrder.update({
        where: { id: req.params.poId },
        data: {
          supplierId: req.body.supplierId,
          supplierName: req.body.supplierName,
          status: req.body.status ? statusToDb(req.body.status) : undefined,
          priority: req.body.priority,
          expectedDeliveryDate: req.body.expectedDeliveryDate ? new Date(req.body.expectedDeliveryDate) : undefined,
          paymentTerms: req.body.paymentTerms,
          notes: req.body.notes,
        },
        include: { items: true },
      });
      res.json({ success: true, data: purchaseOrderPayload(po) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update purchase order' });
    }
  },

  approvePurchaseOrder: async (req: Request, res: Response) => {
    try {
      const po = await db.purchaseOrder.update({ where: { id: req.params.poId }, data: { status: 'APPROVED', approvedBy: userId(req), approvedAt: new Date() }, include: { items: true } });
      res.json({ success: true, data: purchaseOrderPayload(po) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to approve purchase order' });
    }
  },

  markPurchaseOrderSent: async (req: Request, res: Response) => {
    try {
      const po = await db.purchaseOrder.update({ where: { id: req.params.poId }, data: { status: 'SENT', sentAt: new Date() }, include: { items: true } });
      res.json({ success: true, data: purchaseOrderPayload(po) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to mark purchase order as sent' });
    }
  },

  receivePurchaseOrder: async (req: Request, res: Response) => {
    try {
      const po = await prisma.$transaction(async tx => {
        const order = await (tx as any).purchaseOrder.findUnique({ where: { id: req.params.poId }, include: { items: true } });
        if (!order) throw new Error('NOT_FOUND');
        const receivedItems = req.body.items || order.items.map((item: any) => ({ itemId: item.itemId, purchaseOrderItemId: item.id, quantity: item.quantity - item.receivedQuantity }));

        for (const received of receivedItems) {
          const orderItem = order.items.find((item: any) => item.id === received.purchaseOrderItemId || item.itemId === received.itemId);
          if (!orderItem || !orderItem.itemId) continue;
          const quantity = asNumber(received.quantity);
          const item = await tx.inventoryItem.findUnique({ where: { id: orderItem.itemId } });
          if (!item || quantity <= 0) continue;
          const updated = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantity: item.quantity + quantity, lastRestocked: new Date() } as any });
          await (tx as any).purchaseOrderItem.update({ where: { id: orderItem.id }, data: { receivedQuantity: orderItem.receivedQuantity + quantity } });
          await createMovement(tx as any, {
            itemId: item.id,
            movementType: 'RECEIVE',
            quantity,
            unitPrice: orderItem.unitPrice,
            toLocation: item.location || undefined,
            referenceType: 'purchase_order',
            referenceId: order.id,
            referenceNumber: order.poNumber,
            actorId: userId(req),
            actorName: 'Store keeper',
            counterpartyName: order.supplierName,
            beforeQuantity: item.quantity,
            afterQuantity: updated.quantity,
            notes: req.body.notes || 'Received purchase order stock',
          });
        }

        const refreshed = await (tx as any).purchaseOrder.findUnique({ where: { id: order.id }, include: { items: true } });
        const fullyReceived = refreshed.items.every((item: any) => item.receivedQuantity >= item.quantity);
        return (tx as any).purchaseOrder.update({
          where: { id: order.id },
          data: { status: fullyReceived ? 'COMPLETED' : 'PARTIAL_DELIVERY', actualDeliveryDate: fullyReceived ? new Date() : undefined },
          include: { items: true },
        });
      });
      res.json({ success: true, data: purchaseOrderPayload(po) });
    } catch (error: any) {
      res.status(error.message === 'NOT_FOUND' ? 404 : 500).json({ success: false, message: error.message === 'NOT_FOUND' ? 'Purchase order not found' : 'Unable to receive purchase order' });
    }
  },

  cancelPurchaseOrder: async (req: Request, res: Response) => {
    try {
      const po = await db.purchaseOrder.update({ where: { id: req.params.poId }, data: { status: 'CANCELLED', cancelledReason: req.body.reason }, include: { items: true } });
      res.json({ success: true, data: purchaseOrderPayload(po) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to cancel purchase order' });
    }
  },

  getMovements: async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = paginate(req);
      const where: any = {};
      if (req.query.type) where.movementType = movementToDb(String(req.query.type));
      if (req.query.itemId) where.itemId = req.query.itemId;
      if (req.query.startDate || req.query.endDate) {
        where.createdAt = {};
        if (req.query.startDate) where.createdAt.gte = new Date(String(req.query.startDate));
        if (req.query.endDate) where.createdAt.lte = new Date(String(req.query.endDate));
      }
      const [movements, total] = await Promise.all([
        db.stockMovement.findMany({ where, include: { item: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        db.stockMovement.count({ where }),
      ]);
      res.json({ success: true, data: movements.map(movementPayload), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load movements' });
    }
  },

  createStockMovement: async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const type = movementToDb(req.params.type || body.movementType);
      const movement = await prisma.$transaction(async tx => {
        const item = await tx.inventoryItem.findUnique({ where: { id: body.itemId } });
        if (!item) throw new Error('NOT_FOUND');
        const quantity = asNumber(body.quantity, 1);
        let nextQuantity = item.quantity;
        if (['ISSUE', 'WRITE_OFF'].includes(type)) nextQuantity -= quantity;
        if (['RETURN', 'RECEIVE'].includes(type)) nextQuantity += quantity;
        if (type === 'ADJUSTMENT') nextQuantity = asNumber(body.newQuantity ?? body.quantity, item.quantity);
        if (nextQuantity < 0) throw new Error('INSUFFICIENT_STOCK');
        const updated = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantity: nextQuantity, location: body.toLocation || item.location } });
        return createMovement(tx as any, {
          itemId: item.id,
          movementType: type,
          quantity,
          unitPrice: item.price,
          fromLocation: body.fromLocation || item.location,
          toLocation: body.toLocation,
          actorId: userId(req),
          actorName: 'Store keeper',
          counterpartyId: body.issuedTo || body.returnedBy || body.borrowerId,
          counterpartyName: body.issuedToName || body.returnedBy || body.borrowerName,
          condition: body.condition,
          notes: body.reason || body.notes,
          beforeQuantity: item.quantity,
          afterQuantity: updated.quantity,
        });
      });
      const fullMovement = await db.stockMovement.findUnique({ where: { id: movement.id }, include: { item: true } });
      res.status(201).json({ success: true, data: movementPayload(fullMovement) });
    } catch (error: any) {
      res.status(error.message === 'INSUFFICIENT_STOCK' ? 409 : error.message === 'NOT_FOUND' ? 404 : 500).json({ success: false, message: error.message === 'INSUFFICIENT_STOCK' ? 'Insufficient stock' : 'Unable to record movement' });
    }
  },

  getStockTakes: async (_req: Request, res: Response) => {
    try {
      const stockTakes = await db.stockTake.findMany({ include: { items: { include: { item: true } } }, orderBy: { createdAt: 'desc' } });
      res.json({ success: true, data: stockTakes.map(stockTakePayload) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load stock takes' });
    }
  },

  getStockTake: async (req: Request, res: Response) => {
    try {
      const stockTake = await db.stockTake.findUnique({ where: { id: req.params.stockTakeId }, include: { items: { include: { item: true } } } });
      if (!stockTake) return res.status(404).json({ success: false, message: 'Stock take not found' });
      res.json({ success: true, data: stockTakePayload(stockTake) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load stock take' });
    }
  },

  createStockTake: async (req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany({
        where: req.body.categories?.length ? { category: { in: req.body.categories } } : undefined,
      });
      const stockTake = await db.stockTake.create({
        data: {
          stockTakeNumber: `ST-${Date.now()}`,
          name: req.body.name || 'Stock Take',
          description: req.body.description,
          status: 'IN_PROGRESS',
          scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : new Date(),
          createdBy: userId(req),
          notes: req.body.notes,
          items: { create: items.map(item => ({ itemId: item.id, systemQuantity: item.quantity })) },
        },
        include: { items: { include: { item: true } } },
      });
      res.status(201).json({ success: true, data: stockTakePayload(stockTake) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to create stock take' });
    }
  },

  updateStockTakeItem: async (req: Request, res: Response) => {
    try {
      const row = await db.stockTakeItem.update({
        where: { stockTakeId_itemId: { stockTakeId: req.params.stockTakeId, itemId: req.params.itemId } },
        data: { countedQuantity: asNumber(req.body.countedQuantity), countedBy: userId(req), countedAt: new Date(), notes: req.body.notes },
      });
      res.json({ success: true, data: row });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update stock take item' });
    }
  },

  completeStockTake: async (req: Request, res: Response) => {
    try {
      const stockTake = await db.stockTake.update({ where: { id: req.params.stockTakeId }, data: { status: 'COMPLETED', completedDate: new Date() }, include: { items: { include: { item: true } } } });
      res.json({ success: true, data: stockTakePayload(stockTake) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to complete stock take' });
    }
  },

  approveStockTakeAdjustments: async (req: Request, res: Response) => {
    try {
      const stockTake = await prisma.$transaction(async tx => {
        const current = await (tx as any).stockTake.findUnique({ where: { id: req.params.stockTakeId }, include: { items: { include: { item: true } } } });
        if (!current) throw new Error('NOT_FOUND');
        for (const row of current.items) {
          if (row.countedQuantity === null || row.countedQuantity === undefined || row.countedQuantity === row.systemQuantity) continue;
          const updated = await tx.inventoryItem.update({ where: { id: row.itemId }, data: { quantity: row.countedQuantity } });
          await createMovement(tx as any, {
            itemId: row.itemId,
            movementType: 'ADJUSTMENT',
            quantity: Math.abs(row.countedQuantity - row.systemQuantity),
            unitPrice: row.item.price,
            referenceType: 'stock_take',
            referenceId: current.id,
            referenceNumber: current.stockTakeNumber,
            actorId: userId(req),
            actorName: 'Store keeper',
            beforeQuantity: row.systemQuantity,
            afterQuantity: updated.quantity,
            notes: 'Stock take variance adjustment',
          });
        }
        return (tx as any).stockTake.update({ where: { id: current.id }, data: { approvedBy: userId(req) }, include: { items: { include: { item: true } } } });
      });
      res.json({ success: true, data: stockTakePayload(stockTake) });
    } catch (error: any) {
      res.status(error.message === 'NOT_FOUND' ? 404 : 500).json({ success: false, message: error.message === 'NOT_FOUND' ? 'Stock take not found' : 'Unable to approve adjustments' });
    }
  },

  getAlerts: async (req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany();
      const alerts = items.flatMap((item: any) => {
        const rows = [];
        if (item.quantity <= item.minThreshold) {
          rows.push({
            id: `low-${item.id}`,
            type: item.quantity === 0 ? 'out_of_stock' : 'low_stock',
            severity: item.quantity === 0 ? 'critical' : 'high',
            itemId: item.id,
            itemName: item.name,
            currentQuantity: item.quantity,
            reorderLevel: item.minThreshold,
            message: `${item.name} has ${item.quantity} ${item.unit} remaining`,
            action: 'reorder',
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
        if (item.expiryDate && item.expiryDate <= addDays(30)) {
          rows.push({
            id: `exp-${item.id}`,
            type: item.expiryDate < new Date() ? 'expiring' : 'expiring',
            severity: item.expiryDate <= addDays(7) ? 'critical' : 'medium',
            itemId: item.id,
            itemName: item.name,
            currentQuantity: item.quantity,
            message: `${item.name} expires on ${item.expiryDate.toISOString().slice(0, 10)}`,
            action: 'review',
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
        return rows;
      });
      const type = req.query.type ? String(req.query.type) : undefined;
      res.json({ success: true, data: type ? alerts.filter(alert => alert.type === type) : alerts });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load alerts' });
    }
  },

  getAlertStats: async (_req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany();
      const lowStock = items.filter(item => item.quantity <= item.minThreshold);
      res.json({ success: true, data: { total: lowStock.length, unread: lowStock.length, critical: lowStock.filter(item => item.quantity === 0).length } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to get alert stats' });
    }
  },

  generateReport: async (req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany();
      const movements = await db.stockMovement.findMany({ include: { item: true }, orderBy: { createdAt: 'desc' } });
      const requests = await prisma.stockRequest.findMany({ include: { item: true }, orderBy: { createdAt: 'desc' } });
      const reportType = req.body.reportType || 'stock_levels';
      const data = reportType === 'movements' ? movements.map(movementPayload) : reportType === 'requests' ? requests.map(requestPayload) : items.map(itemPayload);
      res.json({
        success: true,
        data: {
          id: `report-${Date.now()}`,
          name: reportType,
          type: reportType,
          filters: req.body.filters || {},
          data,
          summary: {
            totalItems: items.length,
            totalValue: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
            averageValue: items.length ? items.reduce((sum, item) => sum + item.price * item.quantity, 0) / items.length : 0,
          },
          generatedAt: new Date().toISOString(),
          generatedBy: userId(req) || 'storekeeper',
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to generate report' });
    }
  },

  getReportTemplates: async (_req: Request, res: Response) => {
    res.json({ success: true, data: ['stock_levels', 'movements', 'requests', 'purchases', 'valuation', 'variance'] });
  },

  getFixedAssets: async (_req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany({ where: { category: { in: ['Furniture', 'Computer Lab', 'Electronics', 'Vehicles/Spares', 'Laboratory Equipment'] } } as any });
      res.json({ success: true, data: items.map((item: any) => ({
        id: item.id,
        assetTag: item.sku || item.id,
        name: item.name,
        description: item.description || '',
        category: item.category,
        location: item.location || '',
        purchaseDate: item.createdAt.toISOString(),
        purchasePrice: item.price,
        currentValue: item.price * item.quantity,
        depreciationRate: 0,
        status: item.status === 'discontinued' ? 'disposed' : 'active',
        notes: item.description || undefined,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load fixed assets' });
    }
  },

  getDeliveries: async (_req: Request, res: Response) => {
    try {
      const orders = await db.purchaseOrder.findMany({ where: { status: { in: ['SENT', 'PARTIAL_DELIVERY'] } }, include: { items: true }, orderBy: { expectedDeliveryDate: 'asc' } });
      res.json({ success: true, data: orders.map((po: any) => ({
        id: po.id,
        deliveryNumber: `DEL-${po.id.slice(-6).toUpperCase()}`,
        poId: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId || '',
        supplierName: po.supplierName,
        expectedDate: po.expectedDeliveryDate?.toISOString(),
        deliveredDate: po.actualDeliveryDate?.toISOString(),
        status: po.status === 'PARTIAL_DELIVERY' ? 'partial' : 'pending',
        items: po.items.map((item: any) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          orderedQuantity: item.quantity,
          deliveredQuantity: item.receivedQuantity,
          unit: item.unit,
        })),
        notes: po.notes || undefined,
      })) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load deliveries' });
    }
  },

  markDeliveryReceived: async (req: Request, res: Response) => storeKeeperController.receivePurchaseOrder(req, res),

  getNotifications: async (req: Request, res: Response) => {
    try {
      const where: any = { userId: userId(req) };
      if (req.query.unreadOnly === 'true') where.isRead = false;
      const notifications = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
      res.json({ success: true, data: notifications.map(notification => ({
        id: notification.id,
        type: 'system',
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        actionUrl: notification.link || undefined,
        createdAt: notification.createdAt.toISOString(),
      })) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load notifications' });
    }
  },

  markNotificationAsRead: async (req: Request, res: Response) => {
    try {
      const notification = await prisma.notification.update({ where: { id: req.params.notificationId }, data: { isRead: true } });
      res.json({ success: true, data: notification });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update notification' });
    }
  },

  markAllNotificationsAsRead: async (req: Request, res: Response) => {
    try {
      await prisma.notification.updateMany({ where: { userId: userId(req), isRead: false }, data: { isRead: true } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update notifications' });
    }
  },

  getUnreadCount: async (req: Request, res: Response) => {
    try {
      const count = await prisma.notification.count({ where: { userId: userId(req), isRead: false } });
      res.json({ success: true, data: { count } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to get unread count' });
    }
  },

  updateSettings: async (req: Request, res: Response) => {
    try {
      const rows = await Promise.all(Object.entries(req.body).map(([key, value]) => db.storeKeeperSetting.upsert({
        where: { key },
        update: { value, updatedBy: userId(req) },
        create: { key, value, updatedBy: userId(req) },
      })));
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update settings' });
    }
  },

  getLocations: async (_req: Request, res: Response) => {
    try {
      const [locations, items] = await Promise.all([
        db.storageLocation.findMany({ orderBy: { name: 'asc' } }),
        prisma.inventoryItem.findMany(),
      ]);
      res.json({ success: true, data: locations.map((location: any) => {
        const locationItems = items.filter(item => item.location === location.name || item.location === location.code);
        const currentUsage = location.currentUsage || locationItems.reduce((sum, item) => sum + item.quantity, 0);
        return {
          id: location.id,
          name: location.name,
          code: location.code,
          type: location.type,
          building: location.building || undefined,
          floor: location.floor || undefined,
          room: location.room || undefined,
          capacity: location.capacity || undefined,
          currentUsage,
          status: location.status,
          items: locationItems.map(itemPayload),
          notes: location.notes || undefined,
          createdAt: location.createdAt.toISOString(),
          updatedAt: location.updatedAt.toISOString(),
        };
      }) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load storage locations' });
    }
  },

  addLocation: async (req: Request, res: Response) => {
    try {
      const location = await db.storageLocation.create({
        data: {
          name: req.body.name,
          code: req.body.code || String(req.body.name).toLowerCase().replace(/\s+/g, '-'),
          type: req.body.type || 'storeroom',
          building: req.body.building,
          floor: req.body.floor,
          room: req.body.room,
          capacity: req.body.capacity ? asNumber(req.body.capacity) : undefined,
          status: req.body.status || 'active',
          notes: req.body.notes,
        },
      });
      res.status(201).json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to add storage location' });
    }
  },

  updateLocation: async (req: Request, res: Response) => {
    try {
      const location = await db.storageLocation.update({
        where: { id: req.params.locationId },
        data: {
          name: req.body.name,
          code: req.body.code,
          type: req.body.type,
          building: req.body.building,
          floor: req.body.floor,
          room: req.body.room,
          capacity: req.body.capacity !== undefined ? asNumber(req.body.capacity) : undefined,
          status: req.body.status,
          notes: req.body.notes,
        },
      });
      res.json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to update storage location' });
    }
  },

  deleteLocation: async (req: Request, res: Response) => {
    try {
      const location = await db.storageLocation.findUnique({ where: { id: req.params.locationId } });
      if (!location) return res.status(404).json({ success: false, message: 'Storage location not found' });
      const itemCount = await prisma.inventoryItem.count({ where: { OR: [{ location: location.name }, { location: location.code }] } });
      if (itemCount > 0) {
        await db.storageLocation.update({ where: { id: location.id }, data: { status: 'inactive' } });
        return res.json({ success: true, message: 'Location has assigned stock and was archived' });
      }
      await db.storageLocation.delete({ where: { id: location.id } });
      res.json({ success: true, message: 'Storage location deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to delete storage location' });
    }
  },

  // Summary endpoints
  getExpirySummary: async (_req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany();
      const now = new Date();
      
      const expiredItems = items.filter(item => item.expiryDate && new Date(item.expiryDate) < now);
      const expiring7Days = items.filter(item => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
      });
      const expiring30Days = items.filter(item => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
      });
      
      const totalValue = items.reduce((sum, item) => {
        if (item.expiryDate && new Date(item.expiryDate) < now) {
          return sum + (item.price * item.quantity);
        }
        return sum;
      }, 0);
      
      const categories = items.reduce((acc, item) => {
        if (!item.category) return acc;
        if (!acc[item.category]) acc[item.category] = 0;
        acc[item.category] += 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        success: true,
        data: {
          expiredCount: expiredItems.length,
          expiring7DaysCount: expiring7Days.length,
          expiring30DaysCount: expiring30Days.length,
          totalValue: totalValue,
          categories: categories
        }
      });
    } catch (error) {
      console.error('Error fetching expiry summary:', error);
      res.status(500).json({ success: false, message: 'Unable to load expiry summary' });
    }
  },
  
  getLocationSummary: async (_req: Request, res: Response) => {
    try {
      const [locations, items] = await Promise.all([
        db.storageLocation.findMany({ orderBy: { name: 'asc' } }),
        prisma.inventoryItem.findMany()
      ]);
      
      const locationStats = locations.map((location: { id: string; name: string; code: string; type: string; building: string | null; floor: string | null; room: string | null; capacity: number | null }) => {
        const locationItems = items.filter((item: any) => 
          item.location === location.name || item.location === location.code
        );
        const currentUsage = locationItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        const capacity = location.capacity || 0;
        const utilizationRate = capacity > 0 ? (currentUsage / capacity) * 100 : 0;
        
        return {
          id: location.id,
          name: location.name,
          code: location.code,
          type: location.type,
          building: location.building,
          floor: location.floor,
          room: location.room,
          capacity: capacity,
          currentUsage: currentUsage,
          utilizationRate: parseFloat(utilizationRate.toFixed(2))
        };
      });
      
      const totalCapacity = locations.reduce((sum: number, loc: any) => sum + (loc.capacity || 0), 0);
      const totalUsage = locationStats.reduce((sum: number, loc: any) => sum + loc.currentUsage, 0);
      const overallUtilization = totalCapacity > 0 ? (totalUsage / totalCapacity) * 100 : 0;
      
      res.json({
        success: true,
        data: {
          locations: locationStats,
          summary: {
            totalLocations: locations.length,
            totalCapacity: totalCapacity,
            totalUsage: totalUsage,
            overallUtilizationRate: parseFloat(overallUtilization.toFixed(2))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching location summary:', error);
      res.status(500).json({ success: false, message: 'Unable to load location summary' });
    }
  },
  
  getMovementSummary: async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const movements = await db.stockMovement.findMany({
        where: {
          createdAt: {
            gte: monthStart
          }
        },
        include: { item: true }
      });
      
      const issues = movements.filter((m: any) => m.movementType === 'ISSUE');
      const returns = movements.filter((m: any) => m.movementType === 'RETURN');
      const receipts = movements.filter((m: any) => m.movementType === 'RECEIVE');
      const adjustments = movements.filter((m: any) => m.movementType === 'ADJUSTMENT');
      const writeOffs = movements.filter((m: any) => m.movementType === 'WRITE_OFF');
      
      const totalValue = movements.reduce((sum: number, m: any) => {
        const unitPrice = m.unitPrice || (m.item?.price || 0);
        return sum + (unitPrice * m.quantity);
      }, 0);
      
      res.json({
        success: true,
        data: {
          period: 'monthly',
          totals: {
            issues: issues.length,
            returns: returns.length,
            receipts: receipts.length,
            adjustments: adjustments.length,
            writeOffs: writeOffs.length,
            totalMovements: movements.length
          },
          value: {
            totalValue: totalValue,
            issuesValue: issues.reduce((sum: number, m: any) => {
              const unitPrice = m.unitPrice || (m.item?.price || 0);
              return sum + (unitPrice * m.quantity);
            }, 0),
            returnsValue: returns.reduce((sum: number, m: any) => {
              const unitPrice = m.unitPrice || (m.item?.price || 0);
              return sum + (unitPrice * m.quantity);
            }, 0),
            receiptsValue: receipts.reduce((sum: number, m: any) => {
              const unitPrice = m.unitPrice || (m.item?.price || 0);
              return sum + (unitPrice * m.quantity);
            }, 0)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching movement summary:', error);
      res.status(500).json({ success: false, message: 'Unable to load movement summary' });
    }
  },
  
  getDeliverySummary: async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const deliveries = await db.purchaseOrder.findMany({
        where: {
          status: {
            in: ['SENT', 'PARTIAL_DELIVERY', 'COMPLETED']
          },
          expectedDeliveryDate: {
            gte: monthStart
          }
        },
        include: { items: true }
      });
      
      const pending = deliveries.filter((d: any) => d.status === 'SENT');
      const partial = deliveries.filter((d: any) => d.status === 'PARTIAL_DELIVERY');
      const completed = deliveries.filter((d: any) => d.status === 'COMPLETED');
      
      const totalValue = deliveries.reduce((sum: number, d: any) => {
        const total = d.items.reduce((itemSum: number, item: any) => {
          return itemSum + (item.quantity * (item.unitPrice || 0));
        }, 0);
        return sum + total;
      }, 0);
      
      res.json({
        success: true,
        data: {
          period: 'monthly',
          totals: {
            pending: pending.length,
            partial: partial.length,
            completed: completed.length,
            total: deliveries.length
          },
          value: {
            totalValue: totalValue,
            pendingValue: pending.reduce((sum: number, d: any) => {
              const total = d.items.reduce((itemSum: number, item: any) => {
                return itemSum + (item.quantity * (item.unitPrice || 0));
              }, 0);
              return sum + total;
            }, 0),
            partialValue: partial.reduce((sum: number, d: any) => {
              const total = d.items.reduce((itemSum: number, item: any) => {
                return itemSum + (item.quantity * (item.unitPrice || 0));
              }, 0);
              return sum + total;
            }, 0),
            completedValue: completed.reduce((sum: number, d: any) => {
              const total = d.items.reduce((itemSum: number, item: any) => {
                return itemSum + (item.quantity * (item.unitPrice || 0));
              }, 0);
              return sum + total;
            }, 0)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching delivery summary:', error);
      res.status(500).json({ success: false, message: 'Unable to load delivery summary' });
    }
  },
  
  getSettings: async (_req: Request, res: Response) => {
    try {
      const settings = await db.storeKeeperSetting.findMany();
      const settingsObj: Record<string, any> = {};
      
      settings.forEach((setting: any) => {
        settingsObj[setting.key] = setting.value;
      });
      
      // Provide default values for common settings
      const defaults = {
        lowStockThreshold: 10,
        expiryWarningDays: 7,
        defaultLocation: 'Main Warehouse',
        enableNotifications: true,
        backupFrequency: 'weekly'
      };
      
      // Merge defaults with actual settings, letting actual settings override defaults
      const finalSettings = { ...defaults, ...settingsObj };
      
      res.json({
        success: true,
        data: finalSettings
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ success: false, message: 'Unable to load settings' });
    }
  },

  getBorrowings: async (_req: Request, res: Response) => {
    res.json({ success: true, data: [] });
  },

  createBorrowing: async (req: Request, res: Response) => storeKeeperController.createStockMovement(req, res),
};
