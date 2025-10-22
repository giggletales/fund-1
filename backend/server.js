import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import accountsRoutes from './routes/accounts.js';
import leaderboardRoutes from './routes/leaderboard.js';
import affiliatesRoutes from './routes/affiliates.js';
import certificatesRoutes from './routes/certificates.js';
import notificationsRoutes from './routes/notifications.js';
import supportRoutes from './routes/support.js';
import challengesRoutes from './routes/challenges.js';
import analyticsRoutes from './routes/analytics.js';
import verificationRoutes from './routes/verification.js';

dotenv.config();

// Import monitoring service with error handling
let monitoringService = null;
try {
  const module = await import('./services/monitoringService.js');
  monitoringService = module.default;
  console.log('✅ Monitoring service loaded');
} catch (error) {
  console.warn('⚠️  Monitoring service failed to load (MetaAPI issue):', error.message);
  // Create a mock monitoring service
  monitoringService = {
    activeMonitors: new Map(),
    startMonitoring: async () => {},
    stopAllMonitoring: async () => {}
  };
}

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/', limiter);

app.use('/api/accounts', accountsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/affiliates', affiliatesRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/verification', verificationRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeMonitors: monitoringService?.activeMonitors?.size || 0
  });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { default: emailService } = await import('./services/emailService.js');
    const { type = 'all' } = req.body;
    
    const result = await emailService.sendTestEmail(type);
    
    res.json({
      success: true,
      message: 'Test emails sent successfully',
      details: result
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Server ready for requests`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (monitoringService?.stopAllMonitoring) {
    await monitoringService.stopAllMonitoring();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (monitoringService?.stopAllMonitoring) {
    await monitoringService.stopAllMonitoring();
  }
  process.exit(0);
});

startServer();

export default app;
