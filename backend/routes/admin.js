import express from 'express';
import { getUsers, deleteUser, blockUser, getSystemAnalytics, getFavoriteAnalytics, getUsersAnalytics, getMonthlyUserAnalytics, getMostFavoriteBooksAnalytics } from '../controllers/adminController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/users', verifyAdmin, getUsers);
router.delete('/users/:id', verifyAdmin, deleteUser);
router.put('/users/:id/block', verifyAdmin, blockUser);

// Analytics routes
router.get('/analytics/system', verifyAdmin, getSystemAnalytics);
router.get('/analytics/favorites', verifyAdmin, getFavoriteAnalytics);
router.get('/analytics/users', verifyAdmin, getUsersAnalytics);
router.get('/analytics/users/monthly', verifyAdmin, getMonthlyUserAnalytics);
router.get('/analytics/books/favorites', verifyAdmin, getMostFavoriteBooksAnalytics);

export default router;
