import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Modal, Form, Alert, Spinner } from "react-bootstrap";

const Library = () => {
  const [library, setLibrary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view your library');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/library', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLibrary(data);
        setError('');
        
        // Initialize default lists if library is empty
        if (Object.keys(data).length === 0) {
          await initializeDefaultLists();
        }
      } else if (response.status === 401) {
        setError('Please log in to view your library');
        localStorage.removeItem('token');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load library');
      }
    } catch (error) {
      console.error('Error fetching library:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultLists = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/user/library/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh library data
        fetchLibrary();
      }
    } catch (error) {
      console.error('Error initializing default lists:', error);
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/user/library/list', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listName: newListName.trim() })
      });

      if (response.ok) {
        setLibrary({ ...library, [newListName.trim()]: [] });
        setNewListName("");
        setShowModal(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create list');
      }
    } catch (error) {
      console.error('Error adding list:', error);
      setError('Failed to create list');
    }
  };

  const handleRemoveList = async (listName) => {
    if (!confirm(`Are you sure you want to delete the "${listName}" list?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/user/library/${encodeURIComponent(listName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updated = { ...library };
        delete updated[listName];
        setLibrary(updated);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete list');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      setError('Failed to delete list');
    }
  };

  const handleRemoveBook = async (listName, googleId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/user/library/${encodeURIComponent(listName)}/${googleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setLibrary({
          ...library,
          [listName]: library[listName].filter((b) => b.googleId !== googleId),
        });
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to remove book');
      }
    } catch (error) {
      console.error('Error removing book:', error);
      setError('Failed to remove book');
    }
  };

  if (loading) {
    return (
      <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ minHeight: "100vh", color: "#222" }}>
      <h2 className="text-center mb-4" style={{ color: "#43cea2", fontWeight: 700 }}>
        Personal Library
      </h2>
      
      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="success" onClick={() => setShowModal(true)}>
            + Add New List
          </Button>
        </div>
      </div>
      
      <Row>
        {Object.keys(library).length === 0 ? (
          <Col className="text-center py-5">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <p className="lead">No library lists yet!</p>
            <p>Create your first list to start organizing your books.</p>
          </Col>
        ) : (
          Object.entries(library).map(([listName, books]) => (
            <Col md={6} key={listName} className="mb-4">
              <Card className="shadow-lg h-100">
                <Card.Header 
                  className="d-flex justify-content-between align-items-center" 
                  style={{ 
                    background: "linear-gradient(90deg, #43cea2 0%, #ee0979 100%)", 
                    color: "#fff", 
                    fontWeight: "bold", 
                    fontSize: "1.2rem" 
                  }}
                >
                  {listName} ({books.length})
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    onClick={() => handleRemoveList(listName)} 
                    title="Delete List"
                  >
                    &times;
                  </Button>
                </Card.Header>
                <Card.Body>
                  {books.length === 0 ? (
                    <div className="text-center py-3">
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
                      <p>No books in this list yet.</p>
                      <small className="text-muted">Add books from the Book Recommendation page!</small>
                    </div>
                  ) : (
                    <Row>
                      {books.map((book) => (
                        <Col md={6} key={book.googleId} className="mb-3">
                          <Card className="h-100 position-relative" style={{ cursor: "pointer" }}>
                            {/* Remove button */}
                            <button
                              className="btn-close position-absolute"
                              style={{ 
                                top: '5px', 
                                right: '5px', 
                                zIndex: 2,
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                borderRadius: '50%',
                                width: '25px',
                                height: '25px',
                                border: '1px solid #ddd'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBook(listName, book.googleId);
                              }}
                              title="Remove from list"
                            />
                            
                            <div 
                              style={{
                                background: "#fff",
                                borderRadius: "8px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                border: "1px solid #e0e0e0",
                                width: "100%",
                                height: "160px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                marginBottom: "0px",
                                padding: "0"
                              }}
                              onClick={() => window.open(`https://books.google.com/books?id=${book.googleId}`, '_blank')}
                            >
                              <img
                                src={book.image && book.image !== "/images/no_cover.jpg" ? book.image : "https://books.google.com/googlebooks/images/no_cover_thumb.gif"}
                                alt={book.title}
                                style={{
                                  height: "120px",
                                  width: "auto",
                                  objectFit: "contain",
                                  background: "#fff",
                                  margin: "0",
                                  display: "block",
                                  borderRadius: "4px",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                                }}
                                loading="lazy"
                              />
                            </div>
                            <Card.Body style={{ padding: "0.5rem 1rem 1rem 1rem" }}>
                              <Card.Title style={{ fontSize: "0.9rem", marginBottom: '0.3rem' }}>
                                {book.title}
                              </Card.Title>
                              <Card.Text style={{ fontSize: "0.8rem", color: '#666' }}>
                                {book.authors ? book.authors.join(', ') : 'Unknown Author'}
                              </Card.Text>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
      
      {/* Add List Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>List Name</Form.Label>
            <Form.Control
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g. Currently Reading, Want to Read, Completed"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddList();
                }
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAddList} disabled={!newListName.trim()}>
            Add List
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Library;
