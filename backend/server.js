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

const PORT = parseInt(process.env.PORT, 10) || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bookrecommendation';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    // Global error handlers for better diagnostics
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception thrown:', err);
      // Recommended to exit after uncaught exception in Node apps
      process.exit(1);
    });

    // Try to listen on desired port. If port is in use, try next ports up to a limit.
    const maxAttempts = 10;
    let attempts = 0;

    const tryListen = (portToTry) => {
      attempts += 1;
      const server = app.listen(portToTry);

      server.on('listening', () => {
        const host = process.env.HOST || 'localhost';
        console.log(`Server running on port ${portToTry}`);
        console.log(`Accessible at: http://${host}:${portToTry}/`);
      });

      server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`Port ${portToTry} is already in use.`);
          if (attempts < maxAttempts) {
            const nextPort = portToTry + 1;
            console.log(`Trying port ${nextPort}... (${attempts}/${maxAttempts})`);
            // small delay before retrying to avoid tight loop
            setTimeout(() => tryListen(nextPort), 200);
          } else {
            console.error(`No available ports found in range ${PORT}-${portToTry}. Exiting.`);
            process.exit(1);
          }
        } else {
          console.error('Server error:', err);
          process.exit(1);
        }
      });
    };

    tryListen(PORT);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
