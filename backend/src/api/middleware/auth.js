import config from '../../config.js';

/**
 * Simple API key authentication middleware
 */
export function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== config.api.key) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key. Provide it via x-api-key header.',
    });
  }

  next();
}
