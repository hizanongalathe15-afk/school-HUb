import { Request, Response } from 'express';
import { PrismaClient, LibraryStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const libraryController = {
  getAllBooks: async (req: Request, res: Response) => {
    try {
      const { search, category, available } = req.query as { search?: string; category?: string; available?: string };
      const where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { isbn: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (category) where.category = category;
      if (available === 'true') where.available = { gt: 0 };
      
      const books = await prisma.book.findMany({ where });
      res.json({ success: true, data: books });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load books' });
    }
  },

  getBook: async (req: Request, res: Response) => {
    try {
      const book = await prisma.book.findUnique({
        where: { id: req.params.id },
        include: { borrowings: { include: { libraryCard: { include: { student: true } } } } }
      });
      if (!book) return res.status(404).json({ message: 'Book not found' });
      res.json({ success: true, data: book });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load book' });
    }
  },

  createBook: async (req: Request, res: Response) => {
    try {
      const { title, author, isbn, publisher, year, category, quantity, location } = req.body;
      const book = await prisma.book.create({
        data: {
          title,
          author,
          isbn,
          publisher,
          year: year ? Number(year) : undefined,
          category,
          quantity: Number(quantity) || 1,
          available: Number(quantity) || 1,
          location
        }
      });
      res.status(201).json({ success: true, data: book });
    } catch (error) {
      res.status(500).json({ message: 'Unable to create book' });
    }
  },

  updateBook: async (req: Request, res: Response) => {
    try {
      const { title, author, isbn, publisher, year, category, quantity, location } = req.body;
      const book = await prisma.book.update({
        where: { id: req.params.id },
        data: { title, author, isbn, publisher, year: year ? Number(year) : undefined, category, location }
      });
      res.json({ success: true, data: book });
    } catch (error) {
      res.status(500).json({ message: 'Unable to update book' });
    }
  },

  deleteBook: async (req: Request, res: Response) => {
    try {
      await prisma.book.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Unable to delete book' });
    }
  },

  getLibraryCards: async (_req: Request, res: Response) => {
    try {
      const cards = await prisma.libraryCard.findMany({ include: { student: true } });
      res.json({ success: true, data: cards });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load library cards' });
    }
  },

  issueCard: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.body;
      const card = await prisma.libraryCard.create({
        data: {
          studentId,
          cardNumber: `LIB-${Date.now()}`,
          issueDate: new Date(),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          isActive: true
        }
      });
      res.status(201).json({ success: true, data: card });
    } catch (error) {
      res.status(500).json({ message: 'Unable to issue library card' });
    }
  },

  borrowBook: async (req: Request, res: Response) => {
    try {
      const { libraryCardId, bookId, dueDate } = req.body;
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book || book.available < 1) return res.status(400).json({ message: 'Book not available' });

      const borrowing = await prisma.$transaction(async (tx) => {
        const borrow = await tx.borrowing.create({
          data: {
            libraryCardId,
            bookId,
            dueDate: dueDate ? new Date(dueDate) : new Date(new Date().setDate(new Date().getDate() + 14)),
            status: LibraryStatus.BORROWED
          }
        });
        await tx.book.update({ where: { id: bookId }, data: { available: { decrement: 1 } } });
        return borrow;
      });

      res.status(201).json({ success: true, data: borrowing });
    } catch (error) {
      res.status(500).json({ message: 'Unable to borrow book' });
    }
  },

  returnBook: async (req: Request, res: Response) => {
    try {
      const { borrowingId } = req.body;
      const borrowing = await prisma.borrowing.findUnique({ where: { id: borrowingId } });
      if (!borrowing) return res.status(404).json({ message: 'Borrowing record not found' });

      const returned = await prisma.$transaction(async (tx) => {
        const ret = await tx.borrowing.update({
          where: { id: borrowingId },
          data: {
            status: LibraryStatus.AVAILABLE,
            returnedAt: new Date()
          }
        });
        await tx.book.update({ where: { id: borrowing.bookId }, data: { available: { increment: 1 } } });
        return ret;
      });

      res.json({ success: true, data: returned });
    } catch (error) {
      res.status(500).json({ message: 'Unable to return book' });
    }
  },

  getBorrowingHistory: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.query;
      const where: any = {};
      
      if (studentId) {
        where.libraryCard = { studentId };
      }

      const history = await prisma.borrowing.findMany({
        where,
        include: { book: true, libraryCard: { include: { student: true } } },
        orderBy: { borrowedAt: 'desc' }
      });
      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load borrowing history' });
    }
  }
};