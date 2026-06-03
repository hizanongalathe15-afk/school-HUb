import { Router } from 'express';
import { libraryController } from '../controllers/libraryController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Books
router.get('/books', auth, libraryController.getAllBooks);
router.get('/books/:id', auth, libraryController.getBook);
router.post('/books', auth, libraryController.createBook);
router.put('/books/:id', auth, libraryController.updateBook);
router.delete('/books/:id', auth, libraryController.deleteBook);

// Library cards
router.get('/cards', auth, libraryController.getLibraryCards);
router.post('/cards', auth, libraryController.issueCard);

// Borrowing
router.post('/borrow', auth, libraryController.borrowBook);
router.post('/return', auth, libraryController.returnBook);
router.get('/history', auth, libraryController.getBorrowingHistory);

export default router;