import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
<<<<<<< HEAD
=======
import path from 'path';
import { fileURLToPath } from 'url';
>>>>>>> email-verification

import accountsRoutes from './routes/accounts.js';
import leaderboardRoutes from './routes/leaderboard.js';
import affiliatesRoutes from './routes/affiliates.js';
import certificatesRoutes from './routes/certificates.js';
import notificationsRoutes from './routes/notifications.js';
import supportRoutes from './routes/support.js';
import challengesRoutes from './routes/challenges.js';
import analyticsRoutes from './routes/analytics.js';
<<<<<<< HEAD
import verificationRoutes from './routes/verification.js';

dotenv.config();
=======
import verificationRoutes from './routes/Verification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both root and backend directories
dotenv.config({ path: path.join(__dirname, '../.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, '.env') }); // Backend .env (overrides root)
>>>>>>> email-verification

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

<<<<<<< HEAD
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
=======
// More lenient rate limiter for verification endpoints
const verificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute (very lenient for testing)
  message: 'email rate limit exceeded'
});

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://fund8r.onrender.com',
  'https://fund8r-frontend.onrender.com',
  'https://fund8r.com',
  'https://www.fund8r.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a Render/localhost domain or fund8r.com domain
    if (allowedOrigins.includes(origin) || 
        origin.endsWith('.onrender.com') || 
        origin.includes('localhost') ||
        origin.endsWith('fund8r.com')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for now, but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
>>>>>>> email-verification
}));

app.use(express.json());
app.use(cookieParser());
<<<<<<< HEAD
=======

// Apply verification rate limiter to verification endpoints
// Temporarily disabled for testing - re-enable in production
// app.use('/api/verification', verificationLimiter);

// Apply general rate limiter to all other API endpoints
>>>>>>> email-verification
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
<<<<<<< HEAD
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Server ready for requests`);
=======
       console.log('\n' + '='.repeat(60));
 console.log('🚀 Fund8r Backend Server');
 console.log('='.repeat(60));
 console.log(`📡 Port: ${PORT}`);
      console.log(`📊 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: ${process.env.SUPABASE_URL ? 'Supabase Connected' : 'Not Configured'}`);
 console.log(`📧 Email: ${process.env.SMTP_HOST ? 'SMTP Configured' : 'Not Configured (emails will log to console)'}`);
 console.log('='.repeat(60));
 console.log('✅ Server ready for requests\n');
>>>>>>> email-verification
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
