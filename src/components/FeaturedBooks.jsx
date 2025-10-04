import { Row, Col, Card } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import LibraryManager from './LibraryManager';

function FeaturedBooks({ books, query, favourites = [], library = {}, onFavourite, onAddToLibrary }) {
  const [showLibraryManager, setShowLibraryManager] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [libraryLists, setLibraryLists] = useState([]);
  const [user, setUser] = useState(null);

  // Get available library lists from the library prop or fetch from server
  useEffect(() => {
    if (Object.keys(library).length > 0) {
      setLibraryLists(Object.keys(library));
    } else {
      fetchLibraryLists();
    }
    fetchUserData();
  }, [library]);

  const fetchLibraryLists = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/library', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const lists = Object.keys(data);
        setLibraryLists(lists);
      }
    } catch (error) {
      console.error('Error fetching library lists:', error);
      setLibraryLists(['Want to Read', 'Currently Reading', 'Completed']);
    }
  };

  const fetchUserData = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.username, id: payload.userId });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  };

  const handleOpenLibraryManager = (book) => {
    setSelectedBook(book);
    setShowLibraryManager(true);
  };

  const handleCloseLibraryManager = () => {
    setShowLibraryManager(false);
    setSelectedBook(null);
  };

  const handleCreateLibrary = async (libraryName) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Use the simple library creation API
      const response = await fetch('/api/user/library/list', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listName: libraryName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create library');
      }

      // Update local library lists and refresh from server
      setLibraryLists(prev => [...prev, libraryName]);
      
      // Refresh library lists from server to ensure consistency
      setTimeout(() => {
        fetchLibraryLists();
      }, 500);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error creating library:', error);
      throw error;
    }
  };

  const handleAddToLibraryComplete = async (book, libraryName) => {
    try {
      await onAddToLibrary(book, libraryName);
      
      // Refresh library lists to show any changes
      setTimeout(() => {
        fetchLibraryLists();
      }, 300);
    } catch (error) {
      console.error('Error adding to library:', error);
      throw error;
    }
  };

  if (!books || books.length === 0) {
    return (
      <p className="text-center" style={{ color: "#fff" }}>
        No books found for "{query}"
      </p>
    );
  }

  return (
    <div className="mb-5">
      <h3 className="mb-4" style={{ color: "#fff" }}>
        Search results for "{query}"
      </h3>
      <Row>
        {books.map((book) => {
          const isFav = favourites.some((b) => b.googleId === book.googleId || b.googleId === book.id);
          
          return (
            <Col md={3} key={book.id || book.title} className="mb-4">
              <Card className="h-100 book-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* Favourite Star at Top Right */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '16px',
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavourite(book);
                    }}
                    title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill={isFav ? '#FFD700' : 'none'} stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: isFav ? 'drop-shadow(0 0 4px #FFD700)' : 'none', transition: 'fill 0.2s' }}>
                      <polygon points="12,2 15,9 22,9.3 17,14.1 18.5,21 12,17.5 5.5,21 7,14.1 2,9.3 9,9" />
                    </svg>
                  </span>
                </div>
                {/* Book Image and Info */}
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.open(`https://books.google.com/books?id=${book.id}`, '_blank')}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e0e0e0',
                    width: '100%',
                    height: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: '0px',
                    padding: '0'
                  }}>
                    <img
                      src={book.image && book.image !== '/images/no_cover.jpg' ? book.image : 'https://books.google.com/googlebooks/images/no_cover_thumb.gif'}
                      alt={book.title}
                      style={{
                        height: '200px',
                        width: 'auto',
                        objectFit: 'contain',
                        background: '#fff',
                        margin: '0',
                        display: 'block',
                        borderRadius: '4px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                      }}
                      loading="lazy"
                    />
                  </div>
                  <Card.Body style={{ padding: '0.75rem 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                    {/* Book Title styled */}
                    <span style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 800, 
                      color: '#ff6600', 
                      fontFamily: 'Segoe UI, Arial, sans-serif', 
                      letterSpacing: '0.5px', 
                      minHeight: '48px', 
                      display: 'flex', 
                      alignItems: 'center',
                      lineHeight: '1.3',
                      textAlign: 'left'
                    }}>{book.title || 'Untitled Book'}</span>
                    {/* Author styled and only if available */}
                    {book.author && (
                      <span style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: 600, 
                        color: '#1a73e8', 
                        fontFamily: 'Georgia, serif', 
                        letterSpacing: '0.3px', 
                        minHeight: '28px', 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>by {book.author}</span>
                    )}
                    {/* Description styled and always shown */}
                    <span style={{ 
                      fontSize: '1rem', 
                      color: '#ffffff', 
                      fontFamily: 'Arial, sans-serif', 
                      fontWeight: 500, 
                      minHeight: '56px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      whiteSpace: 'normal',
                      lineHeight: '1.4'
                    }}>
                      {book.description && book.description.length > 0
                        ? book.description.length > 150 ? `${book.description.substring(0, 150)}...` : book.description
                        : (
                          book.title && book.title.toLowerCase().includes('write-and-read math story books') ?
                            'This book provides reproducible patterns for 12 interactive books that build early math and reading skills. Students are invited to fill in numbers, words, and sentences as they read.' :
                          book.title && book.title.toLowerCase().includes('budget story books') ?
                            'Discover engaging stories that teach budgeting and financial wisdom, helping readers understand the value of money and planning.' :
                          book.title && book.title.toLowerCase().includes('british books') ?
                            'Explore British literature and guides, offering insights into the culture, history, and society of Britain.' :
                          book.title && book.title.toLowerCase().includes('really good books for kids') ?
                            'A practical guide for parents and teachers to find worthwhile books for children, addressing the challenges of finding quality reading material today.' :
                          book.title && book.author ?
                            `Learn more about "${book.title}" by ${book.author}. This book promises an engaging and informative experience.` :
                          'Explore this book for unique insights and stories.'
                        )}
                    </span>
                  </Card.Body>
                </div>
                {/* Professional Add to Library Button */}
                <div style={{ width: '100%', padding: '0.5rem 1rem 1rem 1rem', marginTop: 'auto' }}>
                  <button
                    style={{ 
                      borderRadius: '12px', 
                      border: '2px solid #007bff', 
                      padding: '8px 16px', 
                      fontSize: '0.9rem', 
                      background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                      color: 'white',
                      cursor: 'pointer', 
                      outline: 'none', 
                      width: '100%',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenLibraryManager(book);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                    title="Add to Personal Library"
                  >
                    <span>📚</span>
                    <span>Add to Library</span>
                  </button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Professional Library Manager Modal */}
      <LibraryManager
        show={showLibraryManager}
        onHide={handleCloseLibraryManager}
        book={selectedBook}
        libraryLists={libraryLists}
        onAddToLibrary={handleAddToLibraryComplete}
        onCreateLibrary={handleCreateLibrary}
        user={user}
      />
    </div>
  );
}

export default FeaturedBooks;