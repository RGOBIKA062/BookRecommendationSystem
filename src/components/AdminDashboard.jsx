import React, { useState, useEffect, useCallback } from 'react';
import './style/AdminDashboard.css';

const AdminDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Analytics data states
  const [systemAnalytics, setSystemAnalytics] = useState({});
  const [favoriteAnalytics, setFavoriteAnalytics] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState({});
  const [chartsData, setChartsData] = useState({});
  
  // Management data states
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);

  // Helper function for authenticated API calls
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    return response;
  };

  // Analytics API calls
  const fetchSystemAnalytics = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/analytics/system');
      const result = await response.json();
      if (result.success) {
        setSystemAnalytics(result.data);
      }
    } catch (err) {
      console.error('Error fetching system analytics:', err);
      setError('Failed to load system analytics');
    }
  }, []);

  const fetchFavoriteAnalytics = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/analytics/favorites');
      const result = await response.json();
      if (result.success) {
        setFavoriteAnalytics(result.data);
      }
    } catch (err) {
      console.error('Error fetching favorite analytics:', err);
      setError('Failed to load favorite analytics');
    }
  }, []);

  const fetchChartsData = useCallback(async () => {
    try {
      setChartsData({
        userRegistrationTrend: [],
        readingActivityTrend: [],
        genreDistribution: [],
        engagementMetrics: { engagementRate: 0 }
      });
    } catch (err) {
      console.error('Error fetching charts data:', err);
    }
  }, []);

  const fetchUserAnalytics = useCallback(async (userId) => {
    try {
      const response = await fetchWithAuth(`/api/analytics/user/${userId}`);
      const result = await response.json();
      if (result.success) {
        setUserAnalytics(result.data);
      }
    } catch (err) {
      console.error('Error fetching user analytics:', err);
    }
  }, []);

  // Management API calls
  const fetchUsersData = useCallback(async () => {
    try {
      const response = await fetchWithAuth("/api/analytics/users");
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || []);
        setTotalUsers(result.total || 0);
      }
    } catch (err) {
      console.error('Error fetching users data:', err);
      setError('Failed to load users data');
    }
  }, []);

  const fetchBooksData = useCallback(async () => {
    try {
      const response = await fetchWithAuth("/api/analytics/books");
      const result = await response.json();
      if (result.success) {
        setBooks(result.data || []);
        setTotalBooks(result.total || 0);
      }
    } catch (err) {
      console.error('Error fetching books data:', err);
      setError('Failed to load books data');
    }
  }, []);

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchSystemAnalytics(),
          fetchFavoriteAnalytics(),
          fetchChartsData()
        ]);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        if (err.message?.includes('403') || err.message?.includes('Access denied')) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError('Failed to initialize dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [fetchSystemAnalytics, fetchFavoriteAnalytics, fetchChartsData]);

  // Tab-specific data loading
  useEffect(() => {
    if (activeTab === 'userManagement') {
      fetchUsersData();
    } else if (activeTab === 'bookManagement') {
      fetchBooksData();
    }
  }, [activeTab, fetchUsersData, fetchBooksData]);

  // Component Renderers
  const renderOverviewSection = () => (
    <div className="overview-section">
      <h2>System Analytics Overview</h2>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total Users</h3>
          <p className="analytics-number">
            {typeof systemAnalytics.totalUsers === 'object' 
              ? systemAnalytics.totalUsers?.count || 0 
              : systemAnalytics.totalUsers || 0}
          </p>
          {systemAnalytics.totalUsers?.growth && (
            <div className="growth-indicator">
              +{systemAnalytics.totalUsers.growth} this month ({systemAnalytics.totalUsers.growthPercentage}%)
            </div>
          )}
        </div>
        <div className="analytics-card">
          <h3>Active Users</h3>
          <p className="analytics-number">
            {typeof systemAnalytics.activeUsers === 'object' 
              ? systemAnalytics.activeUsers?.count || 0 
              : systemAnalytics.activeUsers || 0}
          </p>
          {systemAnalytics.activeUsers?.percentage && (
            <div className="percentage-indicator">
              {systemAnalytics.activeUsers.percentage}% of total users
            </div>
          )}
        </div>
        <div className="analytics-card">
          <h3>Total Books</h3>
          <p className="analytics-number">
            {typeof systemAnalytics.libraryBooks === 'object' 
              ? systemAnalytics.libraryBooks?.count || 0 
              : systemAnalytics.totalBooks || 0}
          </p>
          {systemAnalytics.libraryBooks?.totalReviews && (
            <div className="reviews-indicator">
              {systemAnalytics.libraryBooks.totalReviews} total reviews
            </div>
          )}
        </div>
        <div className="analytics-card">
          <h3>Total Favorites</h3>
          <p className="analytics-number">
            {typeof systemAnalytics.totalFavorites === 'object' 
              ? systemAnalytics.totalFavorites?.count || 0 
              : systemAnalytics.totalFavorites || 0}
          </p>
          {systemAnalytics.totalFavorites?.avgPerUser && (
            <div className="avg-indicator">
              {systemAnalytics.totalFavorites.avgPerUser} avg per user
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderIndividualUserSection = () => (
    <div className="individual-user-section">
      <h2>Individual User Analytics</h2>
      <div className="user-analytics-container">
        <div className="user-search">
          <input
            type="text"
            placeholder="Search user by ID or username..."
            className="user-search-input"
          />
          <button 
            className="search-btn"
            onClick={() => {
              const input = document.querySelector('.user-search-input');
              if (input.value.trim()) {
                fetchUserAnalytics(input.value.trim());
              }
            }}
          >
            Search User
          </button>
        </div>
        
        {userAnalytics.user && (
          <div className="user-analytics-details">
            <h3>User: {userAnalytics.user.username}</h3>
            <div className="user-stats-grid">
              <div className="user-stat">
                <label>Books Read:</label>
                <span>{userAnalytics.booksRead || 0}</span>
              </div>
              <div className="user-stat">
                <label>Reviews Written:</label>
                <span>{userAnalytics.reviewsWritten || 0}</span>
              </div>
              <div className="user-stat">
                <label>Favorite Books:</label>
                <span>{userAnalytics.favoriteBooks || 0}</span>
              </div>
              <div className="user-stat">
                <label>Account Created:</label>
                <span>{userAnalytics.user.createdAt ? new Date(userAnalytics.user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFavoriteBooksSection = () => (
    <div className="favorite-books-section">
      <h2>Most Favorite Books Analysis</h2>
      <div className="favorite-books-list">
        {favoriteAnalytics.length > 0 ? (
          favoriteAnalytics.map((book, index) => (
            <div key={index} className="favorite-book-item">
              <div className="book-rank">#{index + 1}</div>
              <div className="book-info">
                <h4>{book.title}</h4>
                <p>by {book.author}</p>
                <div className="book-stats">
                  <span className="favorite-count">{book.favoriteCount} favorites</span>
                  <span className="average-rating">Rating: {book.averageRating?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No favorite books data available.</p>
        )}
      </div>
    </div>
  );

  const renderChartsSection = () => (
    <div className="charts-section">
      <h2>Interactive Charts & Graphs</h2>
      <div className="charts-grid">
        <div className="chart-container">
          <h3>User Registration Trend</h3>
          <div className="chart-placeholder">
            [User Registration Chart Placeholder]
            <p>Chart.js integration coming soon</p>
          </div>
        </div>
        <div className="chart-container">
          <h3>Reading Activity</h3>
          <div className="chart-placeholder">
            [Reading Activity Chart Placeholder]
            <p>Chart.js integration coming soon</p>
          </div>
        </div>
        <div className="chart-container">
          <h3>Genre Distribution</h3>
          <div className="chart-placeholder">
            [Genre Distribution Chart Placeholder]
            <p>Chart.js integration coming soon</p>
          </div>
        </div>
        <div className="chart-container">
          <h3>Engagement Metrics</h3>
          <div className="chart-placeholder">
            [Engagement Metrics Chart Placeholder]
            <p>Chart.js integration coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagementSection = () => (
    <div className="user-management-section">
      <h2>User Management</h2>
      <div className="management-controls">
        <button 
          className="refresh-btn"
          onClick={fetchUsersData}
        >
          Refresh Users
        </button>
        <span className="total-count">Total Users: {totalUsers}</span>
      </div>
      
      <div className="users-table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user._id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role || 'user'}</td>
                  <td>
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn view-btn">View</button>
                    <button className="action-btn edit-btn">Edit</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No users data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBookManagementSection = () => (
    <div className="book-management-section">
      <h2>Book Management</h2>
      <div className="management-controls">
        <button 
          className="refresh-btn"
          onClick={fetchBooksData}
        >
          Refresh Books
        </button>
        <span className="total-count">Total Books: {totalBooks}</span>
      </div>
      
      <div className="books-table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.length > 0 ? (
              books.map((book) => (
                <tr key={book._id}>
                  <td>{book._id}</td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.genre}</td>
                  <td>{book.averageRating?.toFixed(1) || 'N/A'}</td>
                  <td>{book.reviewCount || 0}</td>
                  <td>
                    <span className={`status ${book.isActive ? 'active' : 'inactive'}`}>
                      {book.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn view-btn">View</button>
                    <button className="action-btn edit-btn">Edit</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">No books data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewSection();
      case 'individualUser':
        return renderIndividualUserSection();
      case 'favoriteBooks':
        return renderFavoriteBooksSection();
      case 'charts':
        return renderChartsSection();
      case 'userManagement':
        return renderUserManagementSection();
      case 'bookManagement':
        return renderBookManagementSection();
      default:
        return renderOverviewSection();
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Comprehensive analytics and management for your book recommendation system</p>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="dashboard-navigation">
        <button 
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          System Overview
        </button>
        <button 
          className={`nav-btn ${activeTab === 'individualUser' ? 'active' : ''}`}
          onClick={() => setActiveTab('individualUser')}
        >
          Individual User
        </button>
        <button 
          className={`nav-btn ${activeTab === 'favoriteBooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('favoriteBooks')}
        >
          Most Favorite Books
        </button>
        <button 
          className={`nav-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts & Graphs
        </button>
        <button 
          className={`nav-btn ${activeTab === 'userManagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('userManagement')}
        >
          User Management
        </button>
        <button 
          className={`nav-btn ${activeTab === 'bookManagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookManagement')}
        >
          Book Management
        </button>
      </div>

      <div className="dashboard-content">
        {renderActiveTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;