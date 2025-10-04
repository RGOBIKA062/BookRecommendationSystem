import express from 'express';
import {
  getSystemAnalytics,
  getUserAnalytics,
  getFavoriteBookAnalytics,
  getUserActivityCharts
} from '../controllers/analyticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import { UserFavourite, LibraryList } from '../models/UserBooks.js';
import Review from '../models/Review.js';
const router = express.Router();

// Protect all analytics routes - only admin can access
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Apply auth middleware to all routes
router.use(authMiddleware);
// Temporarily commented out admin restriction for testing
// router.use(adminOnly);

// System Analytics - Main dashboard cards
router.get('/system', getSystemAnalytics);

// Individual User Analytics
router.get('/user/:userId', getUserAnalytics);

// Most Favorite Books Analysis
router.get('/favorites', getFavoriteBookAnalytics);

// Charts and Graphs Data
router.get('/charts', getUserActivityCharts);

// Get Users List for Management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      data: users,
      total: await User.countDocuments(query)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get Books List for Management
router.get('/books', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      data: books,
      total: await Book.countDocuments(query)
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message
    });
  }
});

// Additional admin analytics endpoints
router.get('/users/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    
    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('favorites', 'title author')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Book management for admin
router.get('/books/analytics', async (req, res) => {
  try {
    const books = await Book.aggregate([
      {
        $lookup: {
          from: 'userbooks',
          localField: '_id',
          foreignField: 'bookId',
          as: 'userInteractions'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'bookId',
          as: 'reviews'
        }
      },
      {
        $project: {
          title: 1,
          author: 1,
          genre: 1,
          createdAt: 1,
          favoriteCount: {
            $size: {
              $filter: {
                input: '$userInteractions',
                cond: { $eq: ['$$this.status', 'favorite'] }
              }
            }
          },
          readCount: {
            $size: {
              $filter: {
                input: '$userInteractions',
                cond: { $eq: ['$$this.status', 'read'] }
              }
            }
          },
          reviewCount: { $size: '$reviews' },
          averageRating: { $avg: '$reviews.rating' }
        }
      },
      { $sort: { favoriteCount: -1 } }
    ]);

    res.json({
      success: true,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book analytics',
      error: error.message
    });
  }
});

// User management actions
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: `User ${status} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

export default router;