import React, { useState, useEffect, useCallback } from 'react';
import { UserGrowthChart, FavoriteBooksChart } from './PremiumCharts';
import './style/AdminDashboard_Premium.css';

const AdminDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Analytics data states
  const [systemAnalytics, setSystemAnalytics] = useState({});
  const [monthlyUserData, setMonthlyUserData] = useState({ months: [], counts: [] });
  const [favoriteBooksData, setFavoriteBooksData] = useState({ labels: [], counts: [], books: [] });
  
  // Management data states
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

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

  // Analytics API calls with error handling
  const fetchSystemAnalytics = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/admin/analytics/system');
      const result = await response.json();
      if (result.success) {
        setSystemAnalytics(result.data);
      }
    } catch (err) {
      console.error('Error fetching system analytics:', err);
      setError('Failed to load system analytics');
    }
  }, []);

  const fetchMonthlyUserData = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/admin/analytics/users/monthly');
      const result = await response.json();
      if (result.success) {
        setMonthlyUserData({
          months: result.data.months,
          counts: result.data.counts
        });
      }
    } catch (err) {
      console.error('Error fetching monthly user data:', err);
    }
  }, []);

  const fetchFavoriteBooksAnalytics = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/admin/analytics/books/favorites');
      const result = await response.json();
      if (result.success) {
        setFavoriteBooksData({
          labels: result.data.chartData.labels,
          counts: result.data.chartData.counts,
          books: result.data.books
        });
      }
    } catch (err) {
      console.error('Error fetching favorite books analytics:', err);
    }
  }, []);

  const fetchUsersData = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/admin/users');
      const usersData = await response.json();
      setUsers(usersData);
      setTotalUsers(usersData.length);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  }, []);

  // Block/Unblock user handler
  const handleBlockUser = async (userId, isBlocked) => {
    try {
      const response = await fetchWithAuth(`/api/admin/users/${userId}/block`, {
        method: 'PUT',
        body: JSON.stringify({ isBlocked }),
      });
      
      if (response.ok) {
        // Update local state
        setUsers(users.map(user => 
          user._id === userId ? { ...user, isBlocked } : user
        ));
      } else {
        setError('Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user status');
    }
  };

  // User selection handlers
  const handleUserSelect = (userId, isSelected) => {
    const newSelection = new Set(selectedUsers);
    if (isSelected) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allUserIds = users.map(user => user._id);
      setSelectedUsers(new Set(allUserIds));
      setShowBulkActions(true);
    } else {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    }
  };

  const exportUsersData = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'users_data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredAndSortedUsers = () => {
    return users.filter(user =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchSystemAnalytics(),
          fetchMonthlyUserData(),
          fetchFavoriteBooksAnalytics(),
        ]);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setError('Failed to initialize dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [fetchSystemAnalytics, fetchMonthlyUserData, fetchFavoriteBooksAnalytics]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersData();
    }
  }, [activeTab, fetchUsersData]);

  // Sidebar menu items
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', count: null },
    { id: 'analytics', icon: '📈', label: 'Analytics', count: null },
    { id: 'users', icon: '👥', label: 'Users', count: totalUsers }
  ];

  // Render main dashboard cards
  const renderDashboardCards = () => (
    <div className="dashboard-cards-grid">
      <div className="analytics-card gradient-purple">
        <div className="card-icon">👥</div>
        <div className="card-content">
          <h3>Total Users</h3>
          <div className="metric-value">
            {systemAnalytics.totalUsers?.count || 0}
          </div>
          {systemAnalytics.totalUsers?.growth && (
            <div className="metric-change positive">
              ↗ +{systemAnalytics.totalUsers.growth} this month
            </div>
          )}
        </div>
        <div className="card-sparkline"></div>
      </div>

      <div className="analytics-card gradient-green">
        <div className="card-icon">❤️</div>
        <div className="card-content">
          <h3>Total Favorites</h3>
          <div className="metric-value">
            {systemAnalytics.totalFavorites?.count || 0}
          </div>
          <div className="metric-change positive">
            📊 {systemAnalytics.totalFavorites?.avgPerUser || 0} per user
          </div>
        </div>
        <div className="card-sparkline"></div>
      </div>
    </div>
  );

  // Render analytics section
  const renderAnalyticsSection = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h2>📈 Analytics</h2>
      </div>
      
      <div className="analytics-vertical">
        <div className="chart-container">
          <h3>📈 Users by Month</h3>
          <div className="chart-wrapper">
            <UserGrowthChart data={monthlyUserData} />
          </div>
        </div>
        <div className="chart-container">
          <h3>📚 Most Favorited Books</h3>
          <div className="chart-wrapper">
            <FavoriteBooksChart data={favoriteBooksData} />
          </div>
        </div>
      </div>
    </div>
  );

  // Render users management
  const renderUsersSection = () => (
    <div className="management-section">
      <div className="section-header">
        <h2>👥 Advanced User Management</h2>
        <div className="section-actions">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>
          <button className="btn-secondary" onClick={exportUsersData}>
            📊 Export Data
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span>{selectedUsers.size} users selected</span>
          </div>
          <div className="bulk-buttons">
            <button 
              className="bulk-btn export"
              onClick={exportUsersData}
            >
              📋 Export Selected
            </button>
            <button 
              className="bulk-btn clear"
              onClick={() => {setSelectedUsers(new Set()); setShowBulkActions(false);}}
            >
              🚫 Clear
            </button>
          </div>
        </div>
      )}

      <div className="data-table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedUsers.size === users.length && users.length > 0}
                />
              </th>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers().slice(0, 20).map((user) => (
              <tr key={user._id} className={`table-row ${selectedUsers.has(user._id) ? 'selected' : ''}`}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.has(user._id)}
                    onChange={(e) => handleUserSelect(user._id, e.target.checked)}
                  />
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{user.username?.charAt(0)?.toUpperCase()}</div>
                    <div className="user-info">
                      <div className="user-name">{user.username}</div>
                      <div className="user-id">ID: {user._id.slice(-6)}</div>
                    </div>
                  </div>
                </td>
                <td className="user-email">{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role || 'user'}`}>
                    {(user.role || 'user').toUpperCase()}
                  </span>
                </td>
                <td className="join-date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className={`action-btn ${user.isBlocked ? 'unblock' : 'block'}`}
                      title={user.isBlocked ? 'Unblock User' : 'Block User'}
                      onClick={() => handleBlockUser(user._id, !user.isBlocked)}
                    >
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Showing {Math.min(20, filteredAndSortedUsers().length)} of {filteredAndSortedUsers().length} users
        </div>
        <div className="pagination-controls">
          <button className="page-btn">← Previous</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <button className="page-btn">Next →</button>
        </div>
      </div>
    </div>
  );

  // Render active content
  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            {renderDashboardCards()}
          </div>
        );
      case 'analytics':
        return renderAnalyticsSection();
      case 'users':
        return renderUsersSection();
      default:
        return <div className="coming-soon">🚧 Coming Soon - {activeTab}</div>;
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Initializing Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard-premium ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">BookVerse Admin</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.count && (
                <span className="nav-count">{item.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {renderActiveContent()}
        </div>
      </div>

      {error && (
        <div className="error-toast">
          <span className="error-message">{error}</span>
          <button className="close-error" onClick={() => setError('')}>×</button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;