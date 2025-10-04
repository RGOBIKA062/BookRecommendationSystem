import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createConversation,
  sendMessage,
  getConversation,
  getUserConversations,
  archiveConversation,
  getBookRecommendations
} from '../controllers/chatbotController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Conversation management routes
router.post('/conversation', createConversation);              // Create new conversation
router.get('/conversations', getUserConversations);            // Get user's conversations
router.get('/conversation/:sessionId', getConversation);       // Get specific conversation
router.post('/conversation/:sessionId/message', sendMessage);  // Send message to conversation
router.delete('/conversation/:sessionId', archiveConversation);// Archive conversation

// Book recommendation routes
router.get('/recommendations', getBookRecommendations);        // Get AI book recommendations

export default router;