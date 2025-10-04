import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Regular user authentication middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('authMiddleware - authHeader:', authHeader);
  
  if (!authHeader) return res.status(401).json({ message: 'No token provided.' });
  
  const token = authHeader.split(' ')[1];
  console.log('authMiddleware - token:', token);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('authMiddleware - decoded token:', decoded);
    
    // Set both userId and id for compatibility
    req.user = {
      ...decoded,
      id: decoded.userId, // Add id property from userId
    };
    console.log('authMiddleware - req.user after setting:', req.user);
    next();
  } catch (err) {
    console.log('authMiddleware - JWT verification error:', err);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Admin authentication middleware
export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided.' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Access denied.' });
    // Set both userId and id for compatibility
    req.user = {
      ...decoded,
      id: decoded.userId, // Add id property from userId
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Export the regular auth middleware as well
export { authMiddleware };

export default authMiddleware;
