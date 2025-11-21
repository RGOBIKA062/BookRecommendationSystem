import React, { useState, useEffect, useCallback } from 'react';
import { UserGrowthChart, FavoriteBooksChart } from './PremiumCharts';
import './style/AdminDashboard_Premium.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

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
    // If some users are selected, export only them. Otherwise export all users.
    const idsToExport = selectedUsers.size > 0 ? Array.from(selectedUsers) : users.map(u => u._id);
    if (!idsToExport || idsToExport.length === 0) return alert('No users available for export');

    const filename = `users_export_${Date.now()}.pdf`;
    generateCombinedPdfForUsers(idsToExport, filename);
  };

  const generateCombinedPdfForUsers = async (userIds, filename) => {
    try {
      const allData = await Promise.all(userIds.map(id => fetchUserFullData(id)));
      const doc = new jsPDF();

      for (let i = 0; i < allData.length; i++) {
        const userData = allData[i];
        if (!userData) continue;

        if (i > 0) doc.addPage();

        const userObj = userData.user || {};
        const title = `User Export - ${userObj.username || userData.username || 'user'}`;
        doc.setFontSize(16);
        doc.text(title, 14, 20);

        const info = [
          ['ID', userObj._id || userData._id || 'N/A'],
          ['Username', userObj.username || userData.username || 'N/A'],
          ['Email', userObj.email || userData.email || 'N/A'],
          ['Role', userObj.role || userData.role || 'user'],
          ['Joined', userObj.createdAt ? new Date(userObj.createdAt).toLocaleString() : (userData.createdAt ? new Date(userData.createdAt).toLocaleString() : 'N/A')]
        ];

        doc.autoTable({ startY: 28, head: [['Field','Value']], body: info, styles: { fontSize: 10 } });
        let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 60;

        const favorites = userData.favorites || userData.favoriteBooks || [];
        if (favorites && favorites.length > 0) {
          doc.setFontSize(12);
          doc.text('Favorites', 14, nextY);
          nextY += 4;
          const favRows = favorites.map(f => [f.title || f.bookTitle || f.name || 'N/A', (f.author || (f.authors ? (Array.isArray(f.authors) ? f.authors.join(', ') : f.authors) : '') || 'N/A')]);
          doc.autoTable({ startY: nextY, head: [['Title','Author']], body: favRows, styles: { fontSize: 10 } });
          nextY = doc.lastAutoTable.finalY + 6;
        }

        const library = userData.libraries || userData.library || userData.libraryList || [];
        if (library && library.length > 0) {
          doc.setFontSize(12);
          doc.text('Library', 14, nextY);
          nextY += 6;

          if (library[0] && (library[0].listName || library[0].books)) {
            for (const lib of library) {
              const listName = lib.listName || 'Library';
              doc.setFontSize(11);
              doc.text(listName, 14, nextY);
              nextY += 4;
              const booksInList = lib.books || [];
              if (booksInList.length > 0) {
                const libRows = booksInList.map(b => [b.title || b.bookTitle || b.name || 'N/A']);
                doc.autoTable({ startY: nextY, head: [['Title']], body: libRows, styles: { fontSize: 9 } });
                nextY = doc.lastAutoTable.finalY + 6;
              } else {
                doc.setFontSize(9);
                doc.text('No books in this list', 14, nextY);
                nextY += 8;
              }
            }
          } else {
            const libRows = library.map(b => [b.title || b.bookTitle || b.name || 'N/A']);
            doc.autoTable({ startY: nextY, head: [['Title']], body: libRows, styles: { fontSize: 10 } });
            nextY = doc.lastAutoTable.finalY + 6;
          }
        }

        const reviews = userData.reviews || userData.userReviews || [];
        if (userData.metrics) {
          doc.setFontSize(12);
          doc.text('Metrics', 14, nextY);
          nextY += 4;
          const mrows = [
            ['Total Favorites', userData.metrics.totalFavorites || 'N/A'],
            ['Total Reviews', userData.metrics.totalReviews || 'N/A'],
            ['Average Rating', userData.metrics.averageRating || 'N/A']
          ];
          doc.autoTable({ startY: nextY, head: [['Metric','Value']], body: mrows, styles: { fontSize: 10 } });
          nextY = doc.lastAutoTable.finalY + 6;
        }

        if (reviews && reviews.length > 0) {
          doc.setFontSize(12);
          doc.text('Reviews', 14, nextY);
          nextY += 4;
          const revRows = reviews.map(r => [r.bookTitle || (r.book && r.book.title) || r.title || 'N/A', (r.rating != null ? r.rating : 'N/A'), (r.comment || r.text || '').slice(0,200)]);
          doc.autoTable({ startY: nextY, head: [['Book','Rating','Comment']], body: revRows, styles: { fontSize: 9 } });
          nextY = doc.lastAutoTable.finalY + 6;
        }
      }

      doc.save(filename || `users_export_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error generating combined PDF', err);
      alert('Failed to generate PDF. See console for details.');
    }
  };

  const fetchUserFullData = async (userId) => {
    try {
      const res = await fetchWithAuth(`/api/analytics/export/user/${userId}`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
    } catch (err) {
      console.error('Failed to fetch full user data for export', err);
    }
    // fallback to user object from list
    return users.find(u => u._id === userId) || null;
  };

  const generatePdfFromUserData = (userData, filename) => {
    try {
      const doc = new jsPDF();
      const userObj = userData.user || {};
      const title = `User Export - ${userObj.username || userData.username || 'user'}`;
      doc.setFontSize(16);
      doc.text(title, 14, 20);

      const info = [
        ['ID', userObj._id || userData._id || 'N/A'],
        ['Username', userObj.username || userData.username || 'N/A'],
        ['Email', userObj.email || userData.email || 'N/A'],
        ['Role', userObj.role || userData.role || 'user'],
        ['Joined', userObj.createdAt ? new Date(userObj.createdAt).toLocaleString() : (userData.createdAt ? new Date(userData.createdAt).toLocaleString() : 'N/A')]
      ];

      doc.autoTable({ startY: 28, head: [['Field','Value']], body: info, styles: { fontSize: 10 } });
      let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 60;

      const favorites = userData.favorites || userData.favoriteBooks || [];
      if (favorites && favorites.length > 0) {
        doc.setFontSize(12);
        doc.text('Favorites', 14, nextY);
        nextY += 4;
        const favRows = favorites.map(f => [f.title || f.bookTitle || f.name || 'N/A', (f.author || (f.authors ? (Array.isArray(f.authors) ? f.authors.join(', ') : f.authors) : '') || 'N/A')]);
        doc.autoTable({ startY: nextY, head: [['Title','Author']], body: favRows, styles: { fontSize: 10 } });
        nextY = doc.lastAutoTable.finalY + 6;
      }

        const library = userData.library || userData.libraryList || [];
      if (library && library.length > 0) {
        doc.setFontSize(12);
        doc.text('Library', 14, nextY);
        nextY += 4;
        const libRows = library.map(b => [b.title || b.bookTitle || b.name || 'N/A']);
        doc.autoTable({ startY: nextY, head: [['Title']], body: libRows, styles: { fontSize: 10 } });
        nextY = doc.lastAutoTable.finalY + 6;
      }

      const reviews = userData.reviews || userData.userReviews || [];
      if (userData.metrics) {
        doc.setFontSize(12);
        doc.text('Metrics', 14, nextY);
        nextY += 4;
        const mrows = [
          ['Total Favorites', userData.metrics.totalFavorites || 'N/A'],
          ['Total Reviews', userData.metrics.totalReviews || 'N/A'],
          ['Average Rating', userData.metrics.averageRating || 'N/A']
        ];
        doc.autoTable({ startY: nextY, head: [['Metric','Value']], body: mrows, styles: { fontSize: 10 } });
        nextY = doc.lastAutoTable.finalY + 6;
      }

      if (reviews && reviews.length > 0) {
        doc.setFontSize(12);
        doc.text('Reviews', 14, nextY);
        nextY += 4;
        const revRows = reviews.map(r => [r.bookTitle || (r.book && r.book.title) || r.title || 'N/A', (r.rating != null ? r.rating : 'N/A'), (r.comment || r.text || '').slice(0,200)]);
        doc.autoTable({ startY: nextY, head: [['Book','Rating','Comment']], body: revRows, styles: { fontSize: 9 } });
        nextY = doc.lastAutoTable.finalY + 6;
      }

      doc.save(filename || `${title}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Failed to generate PDF. See console for details.');
    }
  };

  const exportUserPDF = async (userId) => {
    const data = await fetchUserFullData(userId);
    if (!data) return alert('User data not found for export');
    const filename = `user_${userId}.pdf`;
    generatePdfFromUserData(data, filename);
  };

  const filteredAndSortedUsers = () => {
    return users.filter(user =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Derived pagination values
  const filteredUsers = filteredAndSortedUsers();
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const indexOfFirstUser = (currentPage - 1) * usersPerPage;
  const indexOfLastUser = currentPage * usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Pagination handlers
  const handleClickPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Reset to first page when filter or users change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, users.length]);

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
            {/** Pass only top 4 entries to the chart for clarity */}
            <FavoriteBooksChart data={{
              labels: (favoriteBooksData.labels || []).slice(0, 4),
              counts: (favoriteBooksData.counts || []).slice(0, 4)
            }} />
          </div>

          {/** Show a compact list of top 4 books underneath the chart */}
          <div className="top-books-list" style={{ marginTop: '12px' }}>
            {(favoriteBooksData.books || []).slice(0, 4).map((book, idx) => (
              <div key={book._id || book.id || idx} className="top-book-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)'}}>
                <div className="rank" style={{ fontWeight: '700', width: '28px' }}>#{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{book.title || book.name || 'Untitled'}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                  <div style={{ fontWeight: 700 }}>{book.favoriteCount ?? book.count ?? favoriteBooksData.counts?.[idx] ?? '-'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>favorites</div>
                </div>
              </div>
            ))}
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
            {currentUsers.map((user) => (
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
                    <button className="action-btn export" onClick={() => exportUserPDF(user._id)} title="Export user as PDF">Export</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>

      {/* Pagination */}
      <div className="pagination d-flex justify-content-between align-items-center">
        <div className="pagination-info">
          Showing {filteredUsers.length === 0 ? 0 : indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
        </div>
        <div className="pagination-controls">
          <button className="page-btn" onClick={handlePrevPage} disabled={currentPage === 1}>← Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handleClickPage(page)}>{page}</button>
          ))}
          <button className="page-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>Next →</button>
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