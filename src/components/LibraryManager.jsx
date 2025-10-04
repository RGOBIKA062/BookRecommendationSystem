import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup, Alert, Spinner, Badge, InputGroup } from 'react-bootstrap';
import './style/LibraryManager.css';

const LibraryManager = ({ 
  show, 
  onHide, 
  book, 
  libraryLists = [], 
  onAddToLibrary,
  onCreateLibrary,
  user 
}) => {
  const [activeTab, setActiveTab] = useState('select');
  const [newLibraryName, setNewLibraryName] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  // Filter libraries based on search
  const filteredLibraries = libraryLists.filter(library =>
    library.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset states when modal opens/closes
  useEffect(() => {
    if (show) {
      setError(null);
      setSuccess(null);
      setNewLibraryName('');
      setSelectedLibrary('');
      setSearchTerm('');
      
      // Check if user is new (no libraries)
      const userIsNew = libraryLists.length === 0;
      setIsNewUser(userIsNew);
      
      if (userIsNew) {
        setActiveTab('create');
      } else {
        setActiveTab('select');
      }
    }
  }, [show, libraryLists.length]);

  const handleAddToExisting = async () => {
    if (!selectedLibrary) {
      setError('Please select a library');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onAddToLibrary(book, selectedLibrary);
      setSuccess(`📚 "${book.title}" added to "${selectedLibrary}" successfully!`);
      
      // Auto-close after success
      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err) {
      setError('Failed to add book to library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newLibraryName.trim()) {
      setError('Please enter a library name');
      return;
    }

    if (libraryLists.includes(newLibraryName.trim())) {
      setError('A library with this name already exists');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create library first
      await onCreateLibrary(newLibraryName.trim());
      
      // Then add book to the new library
      await onAddToLibrary(book, newLibraryName.trim());
      
      // Special success message for first-time users
      if (isNewUser) {
        setSuccess(`🎉 Welcome! Created your first library "${newLibraryName}" and added "${book.title}"!`);
        setIsNewUser(false);
      } else {
        setSuccess(`✨ Created "${newLibraryName}" and added "${book.title}" successfully!`);
      }
      
      // Auto-close after success
      setTimeout(() => {
        onHide();
      }, 2000);
    } catch (err) {
      setError('Failed to create library or add book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!book) return null;

  return (
    <Modal show={show} onHide={onHide} centered className="library-manager-modal">
      <Modal.Header closeButton className="border-0 pb-2">
        <Modal.Title className="text-dark fw-bold fs-4">
          {isNewUser ? '📚 Create Your First Library' : '📚 Add to Library'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {/* New User Welcome Message */}
        {isNewUser && (
          <div className="welcome-card mb-4 p-4 bg-gradient-primary text-white rounded-3">
            <div className="text-center">
              <div className="welcome-icon mb-2">🌟</div>
              <h5 className="mb-2">Welcome to Your Personal Library!</h5>
              <p className="mb-0 opacity-90">
                Create your first library to organize your books perfectly.
              </p>
            </div>
          </div>
        )}

        {/* Book Info Card */}
        <div className="book-info-card mb-4 p-3 bg-light rounded-3">
          <div className="d-flex align-items-center">
            <div className="book-icon me-3">📖</div>
            <div className="flex-grow-1">
              <h6 className="mb-1 fw-semibold text-dark">{book.title}</h6>
              {book.author && (
                <small className="text-muted">by {book.author}</small>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <Alert variant="success" className="mb-3 border-0 rounded-3 shadow-sm">
            <div className="d-flex align-items-center">
              <Spinner animation="grow" size="sm" className="me-2" />
              {success}
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mb-3 border-0 rounded-3">
            ⚠️ {error}
          </Alert>
        )}

        {/* Navigation Tabs - Only show for existing users */}
        {!isNewUser && (
          <div className="nav-tabs-custom mb-4">
            <div className="d-flex bg-light rounded-3 p-1">
              <Button
                variant={activeTab === 'select' ? 'primary' : 'light'}
                size="sm"
                className={`flex-fill border-0 rounded-2 transition-all ${
                  activeTab === 'select' ? 'shadow-sm' : ''
                }`}
                onClick={() => setActiveTab('select')}
                disabled={libraryLists.length === 0}
              >
                📋 Select Library
              </Button>
              <Button
                variant={activeTab === 'create' ? 'primary' : 'light'}
                size="sm"
                className={`flex-fill border-0 rounded-2 ms-1 transition-all ${
                  activeTab === 'create' ? 'shadow-sm' : ''
                }`}
                onClick={() => setActiveTab('create')}
              >
                ✨ Create New
              </Button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {(activeTab === 'select' && !isNewUser) && (
          <div className="select-library-tab">
            {libraryLists.length === 0 ? (
              <div className="text-center py-5">
                <div className="empty-state mb-3">📚</div>
                <h5 className="text-muted mb-2">No libraries yet!</h5>
                <p className="text-muted small">
                  Create your first library to organize your books.
                </p>
                <Button
                  variant="outline-primary"
                  onClick={() => setActiveTab('create')}
                  className="rounded-3"
                >
                  Create Library
                </Button>
              </div>
            ) : (
              <>
                {/* Search Libraries */}
                {libraryLists.length > 3 && (
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Search libraries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-end-0 rounded-start-3"
                    />
                    <InputGroup.Text className="bg-light border-start-0 rounded-end-3">
                      🔍
                    </InputGroup.Text>
                  </InputGroup>
                )}

                {/* Library List */}
                <div className="library-list-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredLibraries.length === 0 ? (
                    <div className="text-center py-3 text-muted">
                      No libraries found
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {filteredLibraries.map((library, index) => (
                        <ListGroup.Item
                          key={index}
                          action
                          active={selectedLibrary === library}
                          onClick={() => setSelectedLibrary(library)}
                          className={`border-0 rounded-3 mb-2 ${
                            selectedLibrary === library 
                              ? 'bg-primary text-white shadow-sm' 
                              : 'bg-light hover-bg-primary-subtle'
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <span className="me-2">📁</span>
                              <span className="fw-medium">{library}</span>
                            </div>
                            {selectedLibrary === library && (
                              <Badge bg="light" text="primary">✓</Badge>
                            )}
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </div>

                {/* Add to Selected Library Button */}
                {selectedLibrary && (
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      onClick={handleAddToExisting}
                      disabled={loading}
                      className="w-100 rounded-3 py-2"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Adding to "{selectedLibrary}"...
                        </>
                      ) : (
                        <>
                          📚 Add to "{selectedLibrary}"
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {(activeTab === 'create' || isNewUser) && (
          <div className="create-library-tab">
            {/* Library Name Input */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium text-dark">
                {isNewUser ? 'What would you like to call your first library?' : 'Library Name'}
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={isNewUser 
                  ? "e.g., My Reading List, Want to Read, Favorites..." 
                  : "e.g., Fiction, Non-Fiction, Technical Books..."
                }
                value={newLibraryName}
                onChange={(e) => setNewLibraryName(e.target.value)}
                className="rounded-3 border-2"
                maxLength={50}
                autoFocus
              />
              <Form.Text className="text-muted">
                {50 - newLibraryName.length} characters remaining
              </Form.Text>
            </Form.Group>

            {/* Create and Add Button */}
            <Button
              variant={isNewUser ? "gradient-primary" : "success"}
              onClick={handleCreateAndAdd}
              disabled={loading || !newLibraryName.trim()}
              className="w-100 rounded-3 py-3"
              style={isNewUser ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: '600'
              } : {}}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {isNewUser ? 'Creating your library...' : 'Creating library...'}
                </>
              ) : (
                <>
                  {isNewUser ? (
                    <>
                      🚀 Create "{newLibraryName || 'My First Library'}" & Add Book
                    </>
                  ) : (
                    <>
                      ✨ Create "{newLibraryName || 'New Library'}" & Add Book
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <div className="d-flex justify-content-between w-100 align-items-center">
          <small className="text-muted">
            {isNewUser ? (
              <>👋 Welcome {user?.username || 'to your library'}!</>
            ) : (
              <>👤 Adding to {user?.username || 'your'} library</>
            )}
          </small>
          <Button variant="outline-secondary" onClick={onHide} className="rounded-3">
            {isNewUser ? 'Maybe Later' : 'Cancel'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default LibraryManager;