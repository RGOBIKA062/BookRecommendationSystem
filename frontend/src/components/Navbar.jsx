import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/Navbar.css";

const Navbar = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  
  // Get current logged-in user from your auth system
  const getCurrentUser = () => {
    // First check if user prop is passed
    if (user?.username || user?.name || user?.email) {
      return user;
    }
    
    // Check localStorage for logged-in user (from your login system)
    try {
      const storedUser = localStorage.getItem('user'); // This matches your Login.jsx
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          return parsedUser;
        }
      }
    } catch (e) {
      console.log('Error reading user data');
    }
    
    // Return null if no user found (not logged in)
    return null;
  };
  
  const currentUser = getCurrentUser();
  
  // Extract username/name from user data
  let displayName = 'Guest';
  if (currentUser) {
    displayName = currentUser.username || 
                 currentUser.name || 
                 currentUser.firstName || 
                 currentUser.email?.split('@')[0] || // Use email prefix if available
                 'User';
  }
  
  const firstLetter = displayName.charAt(0).toUpperCase();
  const isLoggedIn = !!currentUser;

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Logout button clicked');
    
    // Close the dropdown first
    setShowDropdown(false);
    
    // Clear authentication data
    // localStorage.removeItem('authToken');
    // sessionStorage.clear();
    
    // Redirect to login page
    navigate('/login');
    
    console.log('User redirected to login page');
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg" style={{ padding: '0.3rem 0' }}>
      <div className="container-fluid">
        <Link className="navbar-brand fs-3 fw-bold" to="/">BookVerse</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto" style={{ gap: '-15px' }}>
            <li className="nav-item">
              <Link className="nav-link fs-6" style={{ padding: '0.3rem 0.1rem' }} to="/home">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fs-6" style={{ padding: '0.3rem 0.1rem' }} to="/recommendation">Book Recommendation</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fs-6" style={{ padding: '0.3rem 0.1rem' }} to="/favourites">Favourites</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fs-6" style={{ padding: '0.3rem 0.1rem' }} to="/library">Personal Library</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fs-6" style={{ padding: '0.3rem 0.1rem' }} to="/chatbot">AI Assistant</Link>
            </li>
            {currentUser?.role === 'admin' && (
              <li className="nav-item">
                <Link className="nav-link fs-6" style={{ padding: '0.2rem 0.1rem' }} to="/admin">Admin Dashboard</Link>
              </li>
            )}
            <li className="nav-item">
              <Link className="nav-link fs-6" style={{ padding: '0.2rem 0.1rem' }} to="/login">Login</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fs-6" style={{ padding: '0.2rem 0.1rem' }} to="/signup">Signup</Link>
            </li>
            {isLoggedIn && (
              <li className="nav-item dropdown" style={{ position: 'relative' }}>
                <button 
                  className="nav-link btn btn-link text-white border-0 bg-transparent" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  style={{ textDecoration: 'none', padding: '8px' }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '16px',
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  >
                    {firstLetter}
                  </div>
                </button>
                {showDropdown && (
                  <div 
                    style={{ 
                      position: 'absolute',
                      right: 0, 
                      top: '100%',
                      minWidth: '120px',
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      zIndex: 9999,
                      marginTop: '5px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      type="button"
                      onClick={handleLogout}
                      style={{
                        padding: '12px 16px',
                        border: 'none',
                        background: 'transparent',
                        width: '100%',
                        textAlign: 'left',
                        color: '#333',
                        fontSize: '14px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </li>
            )}
            </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
