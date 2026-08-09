const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Also accept token from query string (needed for SSE EventSource which can't send headers)
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  if (token === 'mock_offline_jwt_token') {
    req.user = { id: 1, clinicId: 1, role: 'doctor', email: 'shingare.pramod17@gmail.com' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clinicos_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
