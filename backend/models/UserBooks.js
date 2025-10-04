import mongoose from 'mongoose';

// Schema for individual books in user's library/favorites
const userBookSchema = new mongoose.Schema({
  googleId: { type: String, required: true }, // Google Books API ID
  title: { type: String, required: true },
  authors: [{ type: String }],
  description: { type: String },
  publishedDate: { type: String },
  image: { type: String },
  categories: [{ type: String }],
  pageCount: { type: Number },
  language: { type: String },
  isbn: { type: String },
  publisher: { type: String },
  averageRating: { type: Number },
  ratingsCount: { type: Number }
}, { _id: false }); // Don't create separate _id for subdocuments

// Schema for user favorites
const userFavouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  books: [userBookSchema]
}, { timestamps: true });

// Schema for user library lists
const libraryListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listName: { type: String, required: true },
  books: [userBookSchema]
}, { timestamps: true });

// Create indexes for efficient queries
userFavouriteSchema.index({ userId: 1 }, { unique: true });
libraryListSchema.index({ userId: 1, listName: 1 }, { unique: true });

export const UserFavourite = mongoose.model('UserFavourite', userFavouriteSchema);
export const LibraryList = mongoose.model('LibraryList', libraryListSchema);