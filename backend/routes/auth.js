import express from 'express';
import { signup, login } from '../controllers/authController.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// Temporary endpoint to create admin user for testing
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin user
    const adminUser = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      role: 'admin' 
    });

    await adminUser.save();
    
    res.status(201).json({ 
      message: 'Admin user created successfully.',
      user: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Server error during admin creation.' });
  }
});

export default router;
