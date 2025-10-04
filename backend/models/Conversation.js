import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      bookRecommendations: [{
        title: String,
        author: String,
        genre: String,
        description: String
      }],
      userContext: {
        favoriteGenres: [String],
        readingLevel: String,
        currentBooks: [String]
      }
    }
  }],
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
conversationSchema.index({ userId: 1, sessionId: 1 });
conversationSchema.index({ userId: 1, updatedAt: -1 });

// Update the updatedAt field on save
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;