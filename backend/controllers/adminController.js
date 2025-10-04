import User from '../models/User.js';
import { UserFavourite } from '../models/UserBooks.js';
import Book from '../models/Book.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const user = await User.findByIdAndUpdate(id, { isBlocked }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully.`, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getSystemAnalytics = async (req, res) => {
  try {
    // Get total users
    const totalUsersCount = await User.countDocuments();
    const activeUsersCount = await User.countDocuments({ isBlocked: { $ne: true } });
    
    // Get total favorites (count all books in all user favorites)
    const userFavorites = await UserFavourite.find();
    const totalFavoritesCount = userFavorites.reduce((total, userFav) => total + userFav.books.length, 0);
    
    // Get total books
    const totalBooksCount = await Book.countDocuments();
    
    // Calculate average favorites per user
    const avgFavoritesPerUser = totalUsersCount > 0 ? (totalFavoritesCount / totalUsersCount).toFixed(1) : 0;
    
    // Get users created this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    
    const analytics = {
      totalUsers: {
        count: totalUsersCount,
        growth: newUsersThisMonth,
        growthPercentage: totalUsersCount > 0 ? ((newUsersThisMonth / totalUsersCount) * 100).toFixed(1) : 0
      },
      totalFavorites: {
        count: totalFavoritesCount,
        avgPerUser: parseFloat(avgFavoritesPerUser)
      },
      totalBooks: {
        count: totalBooksCount
      },
      activeUsers: {
        count: activeUsersCount,
        percentage: totalUsersCount > 0 ? ((activeUsersCount / totalUsersCount) * 100).toFixed(1) : 0
      }
    };
    
    res.json({ success: true, data: analytics });
  } catch (err) {
    console.error('System analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getFavoriteAnalytics = async (req, res) => {
  try {
    const favorites = await UserFavourite.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(100);
      
    res.json({ success: true, data: favorites });
  } catch (err) {
    console.error('Favorite analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getUsersAnalytics = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const totalUsers = await User.countDocuments();
    
    res.json({ success: true, data: users, total: totalUsers });
  } catch (err) {
    console.error('Users analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getMonthlyUserAnalytics = async (req, res) => {
  try {
    // Get user registrations grouped by month for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyData = await User.aggregate([
      {
        $match: {
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
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Create array for all 12 months with proper labels
    const months = [];
    const counts = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      months.push(monthName);
      
      // Find matching data for this month
      const monthData = monthlyData.find(item => 
        item._id.year === date.getFullYear() && 
        item._id.month === date.getMonth() + 1
      );
      
      counts.push(monthData ? monthData.count : 0);
    }
    
    res.json({ 
      success: true, 
      data: {
        months,
        counts,
        total: counts.reduce((sum, count) => sum + count, 0)
      }
    });
  } catch (err) {
    console.error('Monthly user analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getMostFavoriteBooksAnalytics = async (req, res) => {
  try {
    // Aggregate favorite books data to find most favorited books
    const favoriteBooksData = await UserFavourite.aggregate([
      // Unwind the books array to treat each book as separate document
      { $unwind: '$books' },
      // Group by book googleId and title to count favorites
      {
        $group: {
          _id: {
            googleId: '$books.googleId',
            title: '$books.title'
          },
          title: { $first: '$books.title' },
          authors: { $first: '$books.authors' },
          image: { $first: '$books.image' },
          description: { $first: '$books.description' },
          categories: { $first: '$books.categories' },
          averageRating: { $first: '$books.averageRating' },
          favoriteCount: { $sum: 1 }
        }
      },
      // Sort by favorite count in descending order
      { $sort: { favoriteCount: -1 } },
      // Limit to top 10 most favorited books
      { $limit: 10 }
    ]);
    
    // Format data for chart usage
    const bookTitles = favoriteBooksData.map(book => 
      book.title.length > 25 ? book.title.substring(0, 25) + '...' : book.title
    );
    const favoriteCounts = favoriteBooksData.map(book => book.favoriteCount);
    
    res.json({ 
      success: true, 
      data: {
        books: favoriteBooksData,
        chartData: {
          labels: bookTitles,
          counts: favoriteCounts
        },
        total: favoriteBooksData.reduce((sum, book) => sum + book.favoriteCount, 0)
      }
    });
  } catch (err) {
    console.error('Most favorite books analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
