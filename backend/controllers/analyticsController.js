import User from '../models/User.js';
import Book from '../models/Book.js';
import { UserFavourite, LibraryList } from '../models/UserBooks.js';
import Review from '../models/Review.js';

// System Analytics - Main Dashboard Cards
const getSystemAnalytics = async (req, res) => {
  try {
    // Get current date for active user calculation (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate all system metrics
    const [
      totalUsers,
      activeUsers, 
      blockedUsers,
      totalBooks,
      totalFavorites,
      totalReviews,
      systemStatus
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 
        lastActive: { $gte: thirtyDaysAgo },
        status: { $ne: 'blocked' }
      }),
      User.countDocuments({ status: 'blocked' }),
      Book.countDocuments(),
      UserFavourite.countDocuments(),
      Review.countDocuments(),
      getSystemStatus()
    ]);

    // Calculate growth metrics (vs last month)
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    const userGrowth = totalUsers - lastMonthUsers;

    res.json({
      success: true,
      data: {
        totalUsers: {
          count: totalUsers,
          growth: userGrowth,
          growthPercentage: lastMonthUsers > 0 ? ((userGrowth / lastMonthUsers) * 100).toFixed(1) : 0
        },
        activeUsers: {
          count: activeUsers,
          percentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
        },
        blockedUsers: {
          count: blockedUsers,
          percentage: totalUsers > 0 ? ((blockedUsers / totalUsers) * 100).toFixed(1) : 0
        },
        totalFavorites: {
          count: totalFavorites,
          avgPerUser: totalUsers > 0 ? (totalFavorites / totalUsers).toFixed(1) : 0
        },
        libraryBooks: {
          count: totalBooks,
          totalReviews: totalReviews
        },
        systemStatus: systemStatus
      }
    });

  } catch (error) {
    console.error('System Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system analytics',
      error: error.message
    });
  }
};

// Individual User Analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user details with related data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const [
      userFavorites,
      userReviews,
      readingActivity
    ] = await Promise.all([
      UserFavourite.findOne({ userId }).populate('books'),
      Review.find({ userId }),
      getUserReadingActivity(userId)
    ]);

    // Calculate user metrics based on favorites and reviews
    const favoriteBooks = userFavorites ? userFavorites.books : [];
    const totalFavorites = favoriteBooks.length;
    const averageRating = userReviews.length > 0 
      ? (userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length).toFixed(1)
      : 0;

    // Get user's reading patterns
    const genrePreferences = await getUserGenrePreferences(userId);
    const monthlyActivity = await getMonthlyReadingActivity(userId);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          joinDate: user.createdAt,
          lastActive: user.lastActive,
          status: user.status
        },
        metrics: {
          totalFavorites,
          totalReviews: userReviews.length,
          averageRating
        },
        favoriteBooks: favoriteBooks.map(book => ({
          id: book.googleId || book._id,
          title: book.title,
          authors: book.authors,
          addedDate: userFavorites.createdAt
        })),
        genrePreferences,
        monthlyActivity,
        recentActivity: favoriteBooks.slice(-10).map(book => ({
          book: book.title,
          action: 'favorite',
          date: userFavorites.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('User Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
};

// Most Favorite Books Analysis
const getFavoriteBookAnalytics = async (req, res) => {
  try {
    // Get most favorited books by aggregating from UserFavourite collection
    const favoriteStats = await UserFavourite.aggregate([
      { $unwind: '$books' },
      {
        $group: {
          _id: {
            googleId: '$books.googleId',
            title: '$books.title',
            authors: '$books.authors'
          },
          favoriteCount: { $sum: 1 },
          users: { $push: '$userId' }
        }
      },
      { $sort: { favoriteCount: -1 } },
      { $limit: 20 }
    ]);

    // Get genre popularity from UserFavourite collection
    const genreStats = await UserFavourite.aggregate([
      { $unwind: '$books' },
      { $unwind: '$books.categories' },
      {
        $group: {
          _id: '$books.categories',
          totalFavorites: { $sum: 1 },
          bookCount: { $addToSet: '$books.googleId' }
        }
      },
      {
        $project: {
          _id: 1,
          totalFavorites: 1,
          bookCount: { $size: '$bookCount' },
          avgFavoritesPerBook: { $divide: ['$totalFavorites', { $size: '$bookCount' }] }
        }
      },
      { $sort: { totalFavorites: -1 } }
    ]);

    // Get trending books (favorites gained in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingBooks = await UserFavourite.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $unwind: '$books' },
      {
        $group: {
          _id: {
            googleId: '$books.googleId',
            title: '$books.title',
            authors: '$books.authors'
          },
          recentFavorites: { $sum: 1 }
        }
      },
      { $sort: { recentFavorites: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        mostFavoriteBooks: favoriteStats.map(book => ({
          id: book._id.googleId,
          title: book._id.title,
          authors: book._id.authors ? book._id.authors.join(', ') : 'Unknown',
          favoriteCount: book.favoriteCount,
          userCount: book.users.length
        })),
        genrePopularity: genreStats,
        trendingBooks: trendingBooks.map(book => ({
          id: book._id.googleId,
          title: book._id.title,
          authors: book._id.authors ? book._id.authors.join(', ') : 'Unknown',
          recentFavorites: book.recentFavorites
        }))
      }
    });

  } catch (error) {
    console.error('Favorite Books Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorite books analytics',
      error: error.message
    });
  }
};

// User Activity Charts Data
const getUserActivityCharts = async (req, res) => {
  try {
    // Get user registration trend (last 12 months)
    const userRegistrationTrend = await getUserRegistrationTrend();
    
    // Get reading activity trend
    const readingActivityTrend = await getReadingActivityTrend();
    
    // Get genre distribution
    const genreDistribution = await getGenreDistribution();
    
    // Get user engagement metrics
    const engagementMetrics = await getUserEngagementMetrics();

    res.json({
      success: true,
      data: {
        userRegistrationTrend,
        readingActivityTrend,
        genreDistribution,
        engagementMetrics
      }
    });

  } catch (error) {
    console.error('Charts Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charts data',
      error: error.message
    });
  }
};

// Helper Functions
async function getSystemStatus() {
  try {
    // Check database connectivity and system health
    const dbStatus = await User.findOne().select('_id').lean();
    return {
      status: 'Active',
      uptime: process.uptime(),
      dbConnected: !!dbStatus,
      lastChecked: new Date()
    };
  } catch (error) {
    return {
      status: 'Error',
      uptime: process.uptime(),
      dbConnected: false,
      lastChecked: new Date(),
      error: error.message
    };
  }
}

async function getUserGenrePreferences(userId) {
  const userFav = await UserFavourite.findOne({ userId });
  if (!userFav || !userFav.books) return [];
  
  const genreCount = {};
  userFav.books.forEach(book => {
    if (book.categories) {
      book.categories.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    }
  });
  
  return Object.entries(genreCount)
    .map(([genre, count]) => ({ _id: genre, count }))
    .sort((a, b) => b.count - a.count);
}

async function getMonthlyReadingActivity(userId) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  return await UserFavourite.aggregate([
    { 
      $match: { 
        userId: userId,
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
}

async function getUserRegistrationTrend() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  return await User.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
}

async function getReadingActivityTrend() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await UserFavourite.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
}

async function getGenreDistribution() {
  return await Book.aggregate([
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

async function getUserEngagementMetrics() {
  const [
    totalUsers,
    activeUsers,
    usersWithFavorites,
    usersWithReviews
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    UserFavourite.distinct('userId').then(users => users.length),
    Review.distinct('userId').then(users => users.length)
  ]);

  return {
    totalUsers,
    activeUsers,
    engagementRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
    usersWithFavorites,
    usersWithReviews,
    favoriteRate: totalUsers > 0 ? ((usersWithFavorites / totalUsers) * 100).toFixed(1) : 0,
    reviewRate: totalUsers > 0 ? ((usersWithReviews / totalUsers) * 100).toFixed(1) : 0
  };
}

// Full user export data (user details, favorites, library lists, reviews)
const getUserExportData = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const userFavorites = await UserFavourite.findOne({ userId });
    const userLibraries = await LibraryList.find({ userId });
    const userReviews = await Review.find({ userId }).populate('bookId', 'title authors');

    res.json({
      success: true,
      data: {
        user,
        favorites: userFavorites ? userFavorites.books : [],
        libraries: userLibraries || [],
        reviews: userReviews || []
      }
    });
  } catch (error) {
    console.error('User export data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user export data', error: error.message });
  }
};

export {
  getSystemAnalytics,
  getUserAnalytics,
  getFavoriteBookAnalytics,
  getUserActivityCharts,
  getUserExportData
};