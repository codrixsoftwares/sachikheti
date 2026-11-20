import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Username and password are required.',
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { username: username.trim() },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid admin username or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid admin username or password.',
      });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'sachikheti_jwt_secret_lfpc_superadmin_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Login successful. Database session verified.',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Server error during admin authentication.',
      error: error.message,
    });
  }
});

// GET /api/auth/me (Check token validity)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'No authorization token provided.',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sachikheti_jwt_secret_lfpc_superadmin_2026');
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Admin account not found in database.',
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      admin,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        code: 'TOKEN_EXPIRED',
        message: 'Session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid authorization token.',
    });
  }
});

export default router;

