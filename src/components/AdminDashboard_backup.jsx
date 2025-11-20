import React, { useEffect, useState, useCallback } from "react";
import './style/AdminDashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

import { apiUrl } from '../utils/apiUrl';

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

const AdminDashboard = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('overview');
  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const [favoriteAnalytics, setFavoriteAnalytics] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [books, setBooks] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Fetch System Analytics
  const fetchSystemAnalytics = useCallback(async () => {
    try {
      const response = await fetchWithAuth(apiUrl('/api/analytics/system'));
      const result = await response.json();
      if (result.success) {
        setSystemAnalytics(result.data);
      }
    } catch (err) {
      console.error('Error fetching system analytics:', err);
    }
  }, []);

  // Fetch Favorite Books Analytics
  const fetchFavoriteAnalytics = useCallback(async () => {
    try {
      const response = await fetchWithAuth(apiUrl('/api/analytics/favorites'));
      const result = await response.json();
      if (result.success) {
        setFavoriteAnalytics(result.data);
      }
    } catch (err) {
      console.error('Error fetching favorite analytics:', err);
    }
  }, []);

  // Fetch Users List
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetchWithAuth(apiUrl('/api/analytics/users'));
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  // Fetch Books List
  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetchWithAuth(apiUrl('/api/analytics/books'));
      const result = await response.json();
      if (result.success) {
        setBooks(result.data);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  }, []);

  // Fetch Charts Data
  const fetchChartsData = useCallback(async () => {
    try {
      const response = await fetchWithAuth(apiUrl('/api/analytics/charts'));
      const result = await response.json();
      if (result.success) {
        setChartsData(result.data);
      }
    } catch (err) {
      console.error('Error fetching charts data:', err);
      // Set some placeholder data to prevent crashes
      setChartsData({
        userRegistrationTrend: [],
        readingActivityTrend: [],
        genreDistribution: [],
        engagementMetrics: { engagementRate: 0 }
      });
    }
  }, []);

  // Fetch Individual User Analytics
  const fetchUserAnalytics = useCallback(async (userId) => {
    try {
      const response = await fetchWithAuth(apiUrl(`/api/analytics/user/${userId}`));
      const result = await response.json();
      if (result.success) {
        setUserAnalytics(result.data);
      }
    } catch (err) {
      console.error('Error fetching user analytics:', err);
    }
  }, []);

  // Initialize Dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchSystemAnalytics(),
          fetchFavoriteAnalytics(),
          fetchChartsData(),
          fetchUsers(),
          fetchBooks()
        ]);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    // Set up auto-refresh every 30 seconds for system data
    const interval = setInterval(() => {
      fetchSystemAnalytics();
      fetchFavoriteAnalytics();
    }, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchSystemAnalytics, fetchFavoriteAnalytics, fetchChartsData, fetchUsers, fetchBooks]);

  // Handle User Selection for Individual Analytics
  const handleUserSelect = async (userId) => {
    setSelectedUser(userId);
    await fetchUserAnalytics(userId);
  };

  // System Analytics Cards Component
  const SystemAnalyticsCards = () => {
    if (!systemAnalytics) return null;

    const cards = [
      {
        title: "Total Users",
        value: systemAnalytics.totalUsers.count,
        growth: systemAnalytics.totalUsers.growthPercentage,
        icon: "👥",
        colorClass: "purple"
      },
      {
        title: "Active Users",
        value: systemAnalytics.activeUsers.count,
        subtitle: `${systemAnalytics.activeUsers.percentage}% of total`,
        icon: "✅",
        colorClass: "green"
      },
      {
        title: "Blocked Users",
        value: systemAnalytics.blockedUsers.count,
        subtitle: `${systemAnalytics.blockedUsers.percentage}% of total`,
        icon: "🚫",
        colorClass: "red"
      },
      {
        title: "Total Favorites",
        value: systemAnalytics.totalFavorites.count,
        subtitle: `${systemAnalytics.totalFavorites.avgPerUser} avg per user`,
        icon: "❤️",
        colorClass: "pink"
      },
      {
        title: "Library Books",
        value: systemAnalytics.libraryBooks.count,
        subtitle: `${systemAnalytics.libraryBooks.totalReviews} reviews`,
        icon: "📚",
        colorClass: "blue"
      },
      {
        title: "System Status",
        value: "Active",
        subtitle: `Uptime: ${Math.floor(systemAnalytics.systemStatus.uptime / 3600)}h`,
        icon: "🟢",
        colorClass: "orange"
      }
    ];

    return (
      <div className="stats-grid">
        {cards.map((card, index) => (
          <div key={index} className={`dashboard-card ${card.colorClass}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', opacity: '0.9', margin: '0 0 8px 0' }}>
                  {card.title}
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p style={{ fontSize: '0.75rem', opacity: '0.75', margin: '4px 0 0 0' }}>
                    {card.subtitle}
                  </p>
                )}
                {card.growth && (
                  <p style={{ fontSize: '0.75rem', opacity: '0.75', margin: '4px 0 0 0' }}>
                    +{card.growth}% growth
                  </p>
                )}
              </div>
              <div style={{ fontSize: '2.5rem', opacity: '0.8' }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Individual User Overview Component
  const IndividualUserOverview = () => (
    <div className="analytics-section">
      <h3 className="section-title">Individual User Overview</h3>
      
      {/* User Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Select User for Analysis:
        </label>
        <select
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: '1px solid #d1d5db', 
            borderRadius: '8px',
            fontSize: '1rem',
            backgroundColor: 'white'
          }}
          onChange={(e) => handleUserSelect(e.target.value)}
          value={selectedUser || ''}
        >
          <option value="">Choose a user...</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* User Analytics Display */}
      {userAnalytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* User Info Card */}
          <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '12px' }}>{userAnalytics.user.name}</h4>
            <div className="metrics-grid">
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 4px 0' }}>Email</p>
                <p style={{ fontWeight: '500', margin: '0' }}>{userAnalytics.user.email}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 4px 0' }}>Join Date</p>
                <p style={{ fontWeight: '500', margin: '0' }}>{new Date(userAnalytics.user.joinDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 4px 0' }}>Status</p>
                <p style={{ fontWeight: '500', color: userAnalytics.user.status === 'active' ? '#059669' : '#dc2626', margin: '0' }}>
                  {userAnalytics.user.status}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 4px 0' }}>Last Active</p>
                <p style={{ fontWeight: '500', margin: '0' }}>{new Date(userAnalytics.user.lastActive).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* User Metrics */}
          <div className="metrics-grid">
            <div className="metric-card" style={{ background: '#dbeafe' }}>
              <p className="metric-value" style={{ color: '#1d4ed8' }}>{userAnalytics.metrics.totalBooksRead}</p>
              <p className="metric-label">Books Read</p>
            </div>
            <div className="metric-card" style={{ background: '#fce7f3' }}>
              <p className="metric-value" style={{ color: '#c2185b' }}>{userAnalytics.metrics.totalFavorites}</p>
              <p className="metric-label">Favorites</p>
            </div>
            <div className="metric-card" style={{ background: '#dcfce7' }}>
              <p className="metric-value" style={{ color: '#16a34a' }}>{userAnalytics.metrics.totalReviews}</p>
              <p className="metric-label">Reviews</p>
            </div>
            <div className="metric-card" style={{ background: '#fef3c7' }}>
              <p className="metric-value" style={{ color: '#d97706' }}>{userAnalytics.metrics.averageRating}</p>
              <p className="metric-label">Avg Rating</p>
            </div>
          </div>

          {/* Favorite Books */}
          {userAnalytics.favoriteBooks.length > 0 && (
            <div>
              <h5 style={{ fontWeight: '600', marginBottom: '12px' }}>Favorite Books</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {userAnalytics.favoriteBooks.slice(0, 5).map((book, idx) => (
                  <div key={idx} className="favorite-book-item">
                    <span style={{ fontWeight: '500' }}>{book.title}</span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>by {book.author}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Most Favorite Books Component
  const MostFavoriteBooksAnalysis = () => (
    <div className="dashboard-card">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>
        Most Favorite Books Analysis
      </h3>
      
      {favoriteAnalytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Favorite Books */}
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '16px', color: '#374151' }}>Top 10 Most Favorited Books</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {favoriteAnalytics.mostFavoriteBooks.slice(0, 10).map((book, idx) => (
                <div key={book.id} className="book-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', margin: '0', color: '#111827' }}>{book.title}</p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>by {book.author}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '600', color: '#ec4899', margin: '0' }}>{book.favoriteCount} ❤️</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>{book.userCount} users</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Genre Popularity */}
          {favoriteAnalytics.genrePopularity && (
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '16px', color: '#374151' }}>Genre Popularity</h4>
              <div className="metrics-grid">
                {favoriteAnalytics.genrePopularity.slice(0, 6).map((genre, idx) => (
                  <div key={idx} style={{
                    background: 'linear-gradient(to right, #faf5ff, #fdf2f8)',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ fontWeight: '600', color: '#7c3aed', margin: '0 0 8px 0' }}>{genre._id}</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', margin: '0' }}>{genre.totalFavorites}</p>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>{genre.bookCount} books</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Books */}
          {favoriteAnalytics.trendingBooks && favoriteAnalytics.trendingBooks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Trending Books (Last 30 Days)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoriteAnalytics.trendingBooks.slice(0, 6).map((book, idx) => (
                  <div key={book.id} className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4">
                    <p className="font-semibold text-green-800">{book.title}</p>
                    <p className="text-sm text-gray-600">by {book.author}</p>
                    <p className="text-lg font-bold text-green-600">+{book.recentFavorites} new favorites</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Charts and Graphs Component
  // Charts and Graphs Component
  const ChartsAndGraphs = () => (
    <div className="dashboard-card">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>
        📈 Charts & Analytics Visualization
      </h3>
      
      {chartsData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* User Registration Trend */}
          <div className="chart-container">
            <h4 style={{ textAlign: 'center', marginBottom: '16px', fontWeight: '600' }}>User Registration Trend</h4>
            <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              {chartsData.userRegistrationTrend && chartsData.userRegistrationTrend.length > 0 ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>📊</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: '8px 0' }}>
                    {chartsData.userRegistrationTrend.length}
                  </div>
                  <div>Data points available</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>📈</div>
                  <div style={{ marginTop: '12px' }}>No registration data available</div>
                </div>
              )}
            </div>
          </div>

          {/* Reading Activity Trend */}
          <div className="chart-container">
            <h4 style={{ textAlign: 'center', marginBottom: '16px', fontWeight: '600' }}>Reading Activity Trend</h4>
            <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              {chartsData.readingActivityTrend && chartsData.readingActivityTrend.length > 0 ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>📚</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: '8px 0' }}>
                    {chartsData.readingActivityTrend.length}
                  </div>
                  <div>Activity records</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>📖</div>
                  <div style={{ marginTop: '12px' }}>No activity data available</div>
                </div>
              )}
            </div>
          </div>

          {/* Genre Distribution */}
          <div className="chart-container">
            <h4 style={{ textAlign: 'center', marginBottom: '16px', fontWeight: '600' }}>Genre Distribution</h4>
            <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              {chartsData.genreDistribution && chartsData.genreDistribution.length > 0 ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>🎯</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', margin: '8px 0' }}>
                    {chartsData.genreDistribution.length}
                  </div>
                  <div>Genres tracked</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>📊</div>
                  <div style={{ marginTop: '12px' }}>No genre data available</div>
                </div>
              )}
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="chart-container">
            <h4 style={{ textAlign: 'center', marginBottom: '16px', fontWeight: '600' }}>User Engagement</h4>
            <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              {chartsData.engagementMetrics ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>⚡</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: '8px 0' }}>
                    {chartsData.engagementMetrics.engagementRate || 0}%
                  </div>
                  <div>Overall Engagement Rate</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>📊</div>
                  <div style={{ marginTop: '12px' }}>No engagement data available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Loading charts data...</p>
        </div>
      )}
    </div>
  );

  // User Management Component
  const UserManagement = () => (
    <div className="dashboard-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
          👥 User Management
        </h3>
        <button
          onClick={fetchUsers}
          className="refresh-button"
          style={{ fontSize: '14px', padding: '8px 16px' }}
        >
          🔄 Refresh Users
        </button>
      </div>
      
      {users && users.length > 0 ? (
        <div>
          <div style={{ marginBottom: '16px', color: '#6b7280' }}>
            Total Users: <strong>{users.length}</strong>
          </div>
          <div style={{ display: 'grid', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            {users.map(user => (
              <div key={user._id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{user.username}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{user.email}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: user.isBlocked ? '#fee2e2' : '#dcfce7',
                    color: user.isBlocked ? '#dc2626' : '#16a34a'
                  }}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                    color: user.role === 'admin' ? '#1d4ed8' : '#6b7280'
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <div>👤 No users found</div>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Click refresh to load user data</p>
        </div>
      )}
    </div>
  );

  // Book Management Component
  const BookManagement = () => (
    <div className="dashboard-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
          📚 Book Management
        </h3>
        <button
          onClick={() => {
            // Placeholder for add book functionality
            alert('Add Book functionality coming soon!');
          }}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          + Add New Book
        </button>
      </div>
      
      {books && books.length > 0 ? (
        <div>
          <div style={{ marginBottom: '16px', color: '#6b7280' }}>
            Total Books: <strong>{books.length}</strong>
          </div>
          <div style={{ display: 'grid', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            {books.slice(0, 20).map(book => (
              <div key={book._id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{book.title}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>by {book.author}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Added: {new Date(book.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: book.featured ? '#dbeafe' : '#f3f4f6',
                    color: book.featured ? '#1d4ed8' : '#6b7280'
                  }}>
                    {book.featured ? 'Featured' : 'Regular'}
                  </span>
                  <button
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => alert('Book editing coming soon!')}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <div>📖 No books found</div>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Add some books to get started</p>
        </div>
      )}
    </div>
  );

  // Main Render
  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div style={{ textAlign: 'center' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
              Loading Admin Dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <p className="error-text">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <div>
            <h1 className="header-title">📊 System Analytics</h1>
            <p className="header-subtitle">Comprehensive admin dashboard with real-time insights</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => {
                fetchSystemAnalytics();
                fetchFavoriteAnalytics();
                fetchChartsData();
              }}
              className="refresh-button"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <nav className="nav-tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'User Analytics', icon: '👥' },
              { id: 'favorites', name: 'Favorites Analysis', icon: '❤️' },
              { id: 'charts', name: 'Charts & Graphs', icon: '📈' },
              { id: 'management', name: 'Management', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <SystemAnalyticsCards />
            <IndividualUserOverview />
          </div>
        )}
        
        {activeTab === 'users' && <IndividualUserOverview />}
        
        {activeTab === 'favorites' && <MostFavoriteBooksAnalysis />}
        
        {activeTab === 'charts' && <ChartsAndGraphs />}
        
        {activeTab === 'management' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <UserManagement />
            <BookManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;