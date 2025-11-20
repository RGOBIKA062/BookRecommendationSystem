import dotenv from 'dotenv';
// Load environment variables FIRST before importing any modules that use them
console.log('🔧 Loading environment variables...');
// Try to load .env.local first (for development with real API keys), then fall back to .env
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: './.env.local' });
}
dotenv.config();
console.log('🔧 Environment loaded. GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
console.log('🔧 Environment loaded. OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userBooksRoutes from './routes/userBooks.js';
import analyticsRoutes from './routes/analytics.js';
import chatbotRoutes from './routes/chatbot.js';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userBooksRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check for readiness / probes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    timestamp: Date.now()
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bookrecommendation';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
