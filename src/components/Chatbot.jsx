import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/apiUrl';
import './style/Chatbot.css';

const Chatbot = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [userContext, setUserContext] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, token, logout } = useAuth();

  // Check authentication and initialize
  useEffect(() => {
    if (isAuthenticated && token && !isInitialized && !isInitializing) {
      initializeOrLoadChatbot();
    }
  }, [isAuthenticated, token, isInitialized, isInitializing]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      inputRef.current?.focus();
    }
  }, [isInitialized, isAuthenticated]);

  const fetchWithAuth = async (url, options = {}) => {
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Handle authentication errors
    if (response.status === 401) {
      handleAuthError('Your session has expired. Please log in again.');
      throw new Error('Your session has expired. Please log in again.');
    }

    return response;
  };

  const handleAuthError = (errorMessage) => {
    console.error('Authentication error:', errorMessage);
    logout(); // Use AuthContext logout function
    navigate('/login');
  };

  const redirectToLogin = () => {
    logout();
    navigate('/login');
  };

  const initializeOrLoadChatbot = async () => {
    if (isInitializing) {
      console.log('🔄 Already initializing, skipping...');
      return;
    }
    
    setIsInitializing(true);
    setIsLoading(true);
    setError('');
    
    try {
      // Check if we have a stored session from previous session
      const storedSessionId = localStorage.getItem(`chatbot_session_${user?.userId || user?._id}`);
      
      // First, check if user has existing conversations
      console.log('🔍 Checking for existing conversations...');
      const conversationsResponse = await fetchWithAuth(apiUrl('/api/chatbot/conversations'));
      const conversationsData = await conversationsResponse.json();
      
      if (conversationsData.success && conversationsData.data && conversationsData.data.length > 0) {
        // Load conversations list
        setConversations(conversationsData.data);
        
        // Try to load the stored session first, if it exists and is still valid
        let sessionToLoad = storedSessionId;
        const storedConversationExists = conversationsData.data.find(conv => conv.sessionId === storedSessionId);
        
        if (!storedConversationExists) {
          // If stored session doesn't exist, use the most recent one
          sessionToLoad = conversationsData.data[0].sessionId;
        }
        
        console.log('📚 Loading conversation:', sessionToLoad);
        await loadExistingConversation(sessionToLoad);
      } else {
        // No existing conversations, create a new one
        console.log('✨ No existing conversations found, creating new one...');
        await createNewConversation();
      }
      
    } catch (err) {
      console.error('❌ Initialization error:', err);
      
      if (err.message.includes('Authentication') || err.message.includes('session')) {
        handleAuthError(err.message);
      } else {
        setError(err.message || 'Failed to connect to AI Assistant. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  const loadExistingConversation = async (selectedSessionId) => {
    try {
      const response = await fetchWithAuth(apiUrl(`/api/chatbot/conversation/${selectedSessionId}`));
      const data = await response.json();
      
      if (data.success) {
        setSessionId(selectedSessionId);
        setMessages(data.data.messages || []);
        setIsInitialized(true);
        
        // Store the session ID in localStorage for persistence
        if (user?.userId || user?._id) {
          localStorage.setItem(`chatbot_session_${user.userId || user._id}`, selectedSessionId);
        }
        
        // Store user context if provided
        if (data.data.userContext) {
          setUserContext(data.data.userContext);
        }
        
        console.log('✅ Existing conversation loaded successfully');
      } else {
        throw new Error(data.message || 'Failed to load conversation');
      }
    } catch (err) {
      console.error('❌ Load conversation error:', err);
      // If loading fails, create a new conversation instead
      await createNewConversation();
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetchWithAuth(apiUrl('/api/chatbot/conversation'), {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.data.sessionId);
        setMessages([data.data.message]);
        setIsInitialized(true);
        
        // Store the new session ID in localStorage for persistence
        if (user?.userId || user?._id) {
          localStorage.setItem(`chatbot_session_${user.userId || user._id}`, data.data.sessionId);
        }
        
        // Store user context if provided
        if (data.data.userContext) {
          setUserContext(data.data.userContext);
        }
        
        console.log('✅ New conversation created successfully');
        
        // Reload conversations list to include the new one
        loadConversations();
      } else {
        throw new Error(data.message || 'Failed to create new conversation');
      }
    } catch (err) {
      console.error('❌ Create conversation error:', err);
      throw err; // Re-throw to be handled by calling function
    }
  };

  const initializeChatbot = async () => {
    // Legacy function - now just calls createNewConversation
    await createNewConversation();
  };

  const loadConversations = async () => {
    try {
      const response = await fetchWithAuth(apiUrl('/api/chatbot/conversations'));
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.data || []);
      } else {
        console.warn('Failed to load conversations:', data.message);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      if (err.message.includes('Authentication')) {
        handleAuthError(err.message);
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isLoading || !sessionId) return;

    const userMessage = {
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    setError('');

    try {
      const response = await fetchWithAuth(apiUrl(`/api/chatbot/conversation/${sessionId}/message`), {
        method: 'POST',
        body: JSON.stringify({ sessionId, message: userMessage.content })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add AI response
        setMessages(prev => [...prev, data.data.message]);
        console.log('✅ Message sent successfully');
      } else {
        // Handle specific error codes
        if (data.code === 'CONVERSATION_NOT_FOUND') {
          setError(data.message + ' Starting a new conversation...');
          // Auto-restart conversation
          setTimeout(() => {
            startNewConversation();
          }, 2000);
        } else {
          throw new Error(data.message || 'Failed to send message');
        }
      }
    } catch (err) {
      console.error('❌ Send message error:', err);
      
      if (err.message.includes('Authentication') || err.message.includes('session')) {
        handleAuthError(err.message);
      } else {
        setError(err.message || 'Failed to send message. Please try again.');
      }
      
      // Remove the user message if sending failed (unless it's auth error)
      if (!err.message.includes('Authentication')) {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsTyping(false);
    }
  };

  const startNewConversation = async () => {
    // Reset state
    setMessages([]);
    setSessionId(null);
    setError('');
    setIsInitialized(false);
    
    try {
      // Create a completely new conversation
      await createNewConversation();
    } catch (err) {
      console.error('❌ Error starting new conversation:', err);
      setError('Failed to start new conversation. Please try again.');
    }
  };

  const loadConversation = async (selectedSessionId) => {
    setIsLoading(true);
    setError('');
    
    try {
      await loadExistingConversation(selectedSessionId);
      console.log(`✅ Loaded conversation: ${selectedSessionId}`);
    } catch (err) {
      console.error('❌ Load conversation error:', err);
      
      if (err.message.includes('Authentication')) {
        handleAuthError(err.message);
      } else {
        setError(err.message || 'Failed to load conversation. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MessageBubble = ({ message, isAI = false }) => (
    <div className={`message-wrapper ${isAI ? 'ai-message' : 'user-message'}`}>
      <div className={`message-bubble ${isAI ? 'ai-bubble' : 'user-bubble'}`}>
        <div className="message-content">
          {message.content}
        </div>
        <div className="message-time">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );

  const TypingIndicator = () => (
    <div className="message-wrapper ai-message">
      <div className="message-bubble ai-bubble typing-indicator">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );

  if ((!isInitialized && isLoading) || isInitializing) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">
            {isInitializing ? 'Loading your BookVerse AI Assistant...' : 'Initializing BookVerse AI Assistant...'}
          </p>
          {userContext && (
            <small className="text-muted">
              Welcome back, {userContext.username}! Setting up your personalized experience...
            </small>
          )}
          {user && (
            <small className="text-muted">
              Welcome back, {user.username || user.name}! Setting up your personalized experience...
            </small>
          )}
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="chatbot-container">
      <Row className="h-100">
        {/* Sidebar for conversation history */}
        <Col lg={3} className="sidebar-conversations d-none d-lg-block">
          <div className="conversations-header">
            <h5 className="mb-3">💬 Conversations</h5>
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="w-100 mb-3"
              onClick={startNewConversation}
              disabled={isLoading}
            >
              ✨ New Chat
            </Button>
          </div>
          
          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map((conv, index) => (
                <div 
                  key={conv.sessionId || index}
                  className={`conversation-item ${sessionId === conv.sessionId ? 'active' : ''}`}
                  onClick={() => !isLoading && loadConversation(conv.sessionId)}
                  style={{ 
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  <div className="conversation-preview">
                    {conv.preview || `Conversation ${index + 1}`}
                  </div>
                  <small className="conversation-meta">
                    {conv.messageCount || 0} messages • {formatTime(conv.updatedAt)}
                  </small>
                </div>
              ))
            ) : (
              <div className="text-center text-muted py-4">
                <p>No previous conversations</p>
                <small>Start a new chat to begin!</small>
              </div>
            )}
          </div>
        </Col>

        {/* Main chat area */}
        <Col lg={9} className="chat-main">
          <div className="chat-header">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className="bot-avatar me-3">🤖</div>
                <div>
                  <h4 className="mb-0">BookVerse AI Assistant</h4>
                  <small className="text-muted">
                    {userContext 
                      ? `Welcome ${userContext.username}! Your personalized book companion` 
                      : user?.username 
                        ? `Welcome ${user.username}! Your personalized book companion`
                        : 'Your personal book recommendation companion'
                    }
                  </small>
                </div>
              </div>
              
              <div className="chat-actions d-lg-none">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={startNewConversation}
                  disabled={isLoading}
                >
                  New Chat
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert 
              variant={error.includes('Authentication') || error.includes('session') ? 'warning' : 'danger'} 
              dismissible 
              onClose={() => setError('')}
            >
              <Alert.Heading>
                {error.includes('Authentication') || error.includes('session') 
                  ? '🔐 Authentication Issue' 
                  : '⚠️ Something went wrong'
                }
              </Alert.Heading>
              <p>{error}</p>
              {(error.includes('Authentication') || error.includes('session')) && (
                <Button variant="outline-warning" size="sm" onClick={redirectToLogin} className="mt-2">
                  Go to Login
                </Button>
              )}
            </Alert>
          )}

          <div className="chat-messages">
            {messages.map((message, index) => (
              <MessageBubble 
                key={index} 
                message={message} 
                isAI={message.role === 'assistant'} 
              />
            ))}
            
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <Form onSubmit={sendMessage} className="chat-form">
              <div className="input-group">
                <Form.Control
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me for book recommendations, discuss your reading preferences, or chat about books..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isLoading || !isInitialized}
                  className="message-input"
                  maxLength={500}
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={!newMessage.trim() || isLoading || !isInitialized}
                  className="send-button"
                >
                  {isLoading || isTyping ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    '📤'
                  )}
                </Button>
              </div>
              
              <div className="input-footer">
                <small className="text-muted">
                  {newMessage.length}/500 characters • Press Enter to send
                </small>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Chatbot;