const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev_secret';

/** Middleware: verifies JWT and attaches req.user */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // { user_id, username, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Optional auth: sets req.user if token present, but doesn't reject */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      req.user = jwt.verify(token, SECRET);
    } catch {
      // ignore invalid token
    }
  }
  next();
}

/** Generate a JWT for a user */
function generateToken(user) {
  return jwt.sign(
    { user_id: user.user_id, username: user.username, email: user.email },
    SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authenticate, optionalAuth, generateToken };
