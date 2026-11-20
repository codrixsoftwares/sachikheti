import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import paymentRouter from './routes/payment.js';
import bannersRouter from './routes/banners.js';
import uploadRouter from './routes/upload.js';
import metricsRouter from './routes/metrics.js';
import whatsappRouter from './routes/whatsapp.js';
import settingsRouter from './routes/settings.js';
import { setWhatsAppIO } from './lib/whatsapp.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Express and Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Provide socket.io instance to all Express routes & services
app.set('io', io);
setWhatsAppIO(io);

io.on('connection', (socket) => {
  // Client connected
  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Middleware with high payload limit for image uploads
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static upload file serving
const publicUploadsPath = path.join(__dirname, '../../client/public/uploads');
app.use('/uploads', express.static(publicUploadsPath, {
  maxAge: '7d',
  immutable: true,
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payment/razorpay', paymentRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin/metrics', metricsRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    statusCode: 200,
    service: 'SachiKheti API (LFPC)',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Serve frontend build if deployed together on single EC2
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath, {
  maxAge: '1d',
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('SachiKheti API server is operational. Client bundle not built yet.');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: err.message || 'Internal server error occurred.',
  });
});

server.listen(PORT, () => {
  console.log(`🌾 SachiKheti backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket IO active on ws://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

