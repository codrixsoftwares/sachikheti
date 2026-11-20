import jwt from 'jsonwebtoken';

export const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Access denied. No authorization token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sachikheti_jwt_secret_lfpc_superadmin_2026');
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        code: 'TOKEN_EXPIRED',
        message: 'Admin session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid authorization token. Please log in again.',
    });
  }
};

export const requireAdmin = verifyAdminToken;
export default verifyAdminToken;

