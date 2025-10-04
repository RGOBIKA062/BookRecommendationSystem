import express from 'express';
import { UserFavourite, LibraryList } from '../models/UserBooks.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// FAVORITES ROUTES

// Get user's favorites
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    // Debug logging
    console.log('Get favorites - req.user:', req.user);
    console.log('Get favorites - req.user.id:', req.user.id);
    
    if (!req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const userFavorites = await UserFavourite.findOne({ userId: req.user.id });
    res.json(userFavorites ? userFavorites.books : []);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error fetching favorites' });
  }
});

// Add book to favorites
router.post('/favorites', authMiddleware, async (req, res) => {
  try {
    const { book } = req.body;
    
    // Debug logging
    console.log('req.user:', req.user);
    console.log('req.user.id:', req.user.id);
    console.log('req.user.userId:', req.user.userId);
    
    if (!book || !book.googleId || !book.title) {
      return res.status(400).json({ message: 'Invalid book data' });
    }

    if (!req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    let userFavorites = await UserFavourite.findOne({ userId: req.user.id });
    
    if (!userFavorites) {
      userFavorites = new UserFavourite({ userId: req.user.id, books: [] });
    }

    // Check if book already exists in favorites
    const existingBook = userFavorites.books.find(b => b.googleId === book.googleId);
    if (existingBook) {
      return res.status(400).json({ message: 'Book already in favorites' });
    }

    userFavorites.books.push(book);
    await userFavorites.save();

    res.json({ message: 'Book added to favorites', favorites: userFavorites.books });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Server error adding to favorites' });
  }
});

// Remove book from favorites
router.delete('/favorites/:googleId', authMiddleware, async (req, res) => {
  try {
    const userFavorites = await UserFavourite.findOne({ userId: req.user.id });
    
    if (!userFavorites) {
      return res.status(404).json({ message: 'No favorites found' });
    }

    userFavorites.books = userFavorites.books.filter(book => book.googleId !== req.params.googleId);
    await userFavorites.save();

    res.json({ message: 'Book removed from favorites', favorites: userFavorites.books });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Server error removing from favorites' });
  }
});

// LIBRARY ROUTES

// Get all user's library lists
router.get('/library', authMiddleware, async (req, res) => {
  try {
    // Debug logging
    console.log('Get library - req.user:', req.user);
    console.log('Get library - req.user.id:', req.user.id);
    
    if (!req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const libraryLists = await LibraryList.find({ userId: req.user.id });
    
    // Convert to object format expected by frontend
    const library = {};
    libraryLists.forEach(list => {
      library[list.listName] = list.books;
    });

    res.json(library);
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({ message: 'Server error fetching library' });
  }
});

// Add book to library (simple format for LibraryManager)
router.post('/library', authMiddleware, async (req, res) => {
  try {
    const { googleId, title, authors, image, description, listName } = req.body;
    
    // Debug logging
    console.log('Add to library - req.user:', req.user);
    console.log('Add to library - req.user.id:', req.user.id);
    console.log('Add to library - data:', { googleId, title, listName });
    
    if (!googleId || !title || !listName) {
      return res.status(400).json({ message: 'Missing required fields: googleId, title, listName' });
    }

    if (!req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    let libraryList = await LibraryList.findOne({ userId: req.user.id, listName });
    
    if (!libraryList) {
      // Create the list if it doesn't exist
      libraryList = new LibraryList({
        userId: req.user.id,
        listName,
        books: []
      });
    }
    
    // Check if book already exists in the list
    const existingBook = libraryList.books.find(book => book.googleId === googleId);
    if (existingBook) {
      return res.status(400).json({ message: 'Book already exists in this library list' });
    }
    
    // Add the book
    const bookData = {
      googleId,
      title,
      authors: authors || [],
      image: image || '',
      description: description || '',
      addedDate: new Date()
    };
    
    libraryList.books.push(bookData);
    await libraryList.save();
    
    console.log('Book added successfully:', bookData.title);
    res.json({ success: true, message: 'Book added to library successfully', book: bookData });
  } catch (error) {
    console.error('Error adding book to library:', error);
    res.status(500).json({ message: 'Server error adding book to library' });
  }
});

// Create new library list
router.post('/library/list', authMiddleware, async (req, res) => {
  try {
    const { listName } = req.body;
    
    if (!listName) {
      return res.status(400).json({ message: 'List name is required' });
    }

    // Check if list already exists
    const existingList = await LibraryList.findOne({ userId: req.user.id, listName });
    if (existingList) {
      return res.status(400).json({ message: 'List already exists' });
    }

    const newList = new LibraryList({
      userId: req.user.id,
      listName,
      books: []
    });

    await newList.save();
    res.json({ message: 'List created successfully', listName });
  } catch (error) {
    console.error('Error creating library list:', error);
    res.status(500).json({ message: 'Server error creating library list' });
  }
});

// Add book to library list
router.post('/library/:listName', authMiddleware, async (req, res) => {
  try {
    const { listName } = req.params;
    const { book } = req.body;
    
    // Debug logging
    console.log('Library route - req.user:', req.user);
    console.log('Library route - req.user.id:', req.user.id);
    console.log('Library route - listName:', listName);
    
    if (!book || !book.googleId || !book.title) {
      return res.status(400).json({ message: 'Invalid book data' });
    }

    if (!req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    let libraryList = await LibraryList.findOne({ userId: req.user.id, listName });
    
    if (!libraryList) {
      // Create the list if it doesn't exist
      libraryList = new LibraryList({
        userId: req.user.id,
        listName,
        books: []
      });
    }

    // Check if book already exists in this list
    const existingBook = libraryList.books.find(b => b.googleId === book.googleId);
    if (existingBook) {
      return res.status(400).json({ message: 'Book already in this list' });
    }

    libraryList.books.push(book);
    await libraryList.save();

    res.json({ message: 'Book added to library list', listName, books: libraryList.books });
  } catch (error) {
    console.error('Error adding to library list:', error);
    res.status(500).json({ message: 'Server error adding to library list' });
  }
});

// Remove book from library list
router.delete('/library/:listName/:googleId', authMiddleware, async (req, res) => {
  try {
    const { listName, googleId } = req.params;
    
    const libraryList = await LibraryList.findOne({ userId: req.user.id, listName });
    
    if (!libraryList) {
      return res.status(404).json({ message: 'Library list not found' });
    }

    libraryList.books = libraryList.books.filter(book => book.googleId !== googleId);
    await libraryList.save();

    res.json({ message: 'Book removed from library list', listName, books: libraryList.books });
  } catch (error) {
    console.error('Error removing from library list:', error);
    res.status(500).json({ message: 'Server error removing from library list' });
  }
});

// Delete entire library list
router.delete('/library/:listName', authMiddleware, async (req, res) => {
  try {
    const { listName } = req.params;
    
    const result = await LibraryList.findOneAndDelete({ userId: req.user.id, listName });
    
    if (!result) {
      return res.status(404).json({ message: 'Library list not found' });
    }

    res.json({ message: 'Library list deleted successfully', listName });
  } catch (error) {
    console.error('Error deleting library list:', error);
    res.status(500).json({ message: 'Server error deleting library list' });
  }
});

// Initialize default library lists for new users
router.post('/library/initialize', authMiddleware, async (req, res) => {
  try {
    const defaultLists = ['To Read', 'Completed', 'Favorites'];
    const userId = req.user.id;

    // Check if user already has any lists
    const existingLists = await LibraryList.find({ userId });
    if (existingLists.length > 0) {
      return res.status(400).json({ message: 'User already has library lists' });
    }

    // Create default lists
    const listsToCreate = defaultLists.map(listName => ({
      userId,
      listName,
      books: []
    }));

    await LibraryList.insertMany(listsToCreate);
    
    res.json({ message: 'Default library lists initialized', lists: defaultLists });
  } catch (error) {
    console.error('Error initializing library:', error);
    res.status(500).json({ message: 'Server error initializing library' });
  }
});

export default router;