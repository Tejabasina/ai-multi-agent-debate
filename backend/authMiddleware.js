import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_default_secret_for_silicon_debate';

/**
 * Express middleware to verify the JWT authorization token.
 * Attaches decoded user payload to req.user.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Malformed authorization header. Expected: Bearer <token>' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  } catch (err) {
    console.error('[AuthMiddleware] JWT Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }
}

/**
 * Utility helper to verify JWT inside connection contexts (like WebSockets).
 * Returns the decoded payload or throws an error.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
