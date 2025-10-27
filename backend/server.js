import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import accountsRoutes from './routes/accounts.js';
import leaderboardRoutes from './routes/leaderboard.js';
import affiliatesRoutes from './routes/affiliates.js';
import certificatesRoutes from './routes/certificates.js';
import notificationsRoutes from './routes/notifications.js';
import supportRoutes from './routes/support.js';
import challengesRoutes from './routes/challenges.js';
import analyticsRoutes from './routes/analytics.js';
import verificationRoutes from './routes/Verification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both root and backend directories
dotenv.config({ path: path.join(__dirname, '../.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, '.env') }); // Backend .env (overrides root)

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
  'http://localhost:3000',
  'https://fund8r.onrender.com',
  'https://fund8r-frontend.onrender.com',
  'https://fund8r.com',
  'https://www.fund8r.com',
  'http://fund8r.com',
  'http://www.fund8r.com',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🔐 CORS allowed origins:', allowedOrigins);

// Enable pre-flight requests for all routes
app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400
}));

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    console.log('🔍 CORS: Checking origin:', origin);
    
    // Check if origin is in allowed list or is a Render/localhost domain or fund8r.com domain
    if (allowedOrigins.includes(origin) || 
        origin.endsWith('.onrender.com') || 
        origin.includes('localhost') ||
        origin.includes('fund8r.com')) {
      console.log('✅ CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.warn('⚠️  CORS: Unknown origin (allowing anyway):', origin);
      callback(null, true); // Allow anyway for now, but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply verification rate limiter to verification endpoints
// Temporarily disabled for testing - re-enable in production
// app.use('/api/verification', verificationLimiter);

// Apply general rate limiter to all other API endpoints
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

// Global error handler - must be after all routes
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  console.error('Error stack:', err.stack);
  
  // Ensure we always return JSON
  res.setHeader('Content-Type', 'application/json');
  
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    type: err.name || 'Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  });
});

// 404 handler - must be after all routes but before error handler
app.use((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

const startServer = async () => {
  const tryPort = (port) => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port)
        .on('listening', () => {
          console.log('\n' + '='.repeat(60));
          console.log('🚀 Fund8r Backend Server');
          console.log('='.repeat(60));
          console.log(`📡 Port: ${port}`);
          console.log(`📊 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
          console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
          console.log(`🗄️ Database: ${process.env.SUPABASE_URL ? 'Supabase Connected' : 'Not Configured'}`);
          console.log(`📧 Email: ${process.env.SMTP_HOST ? 'SMTP Configured' : 'Not Configured (emails will log to console)'}`);
          console.log('='.repeat(60));
          console.log('✅ Server ready for requests\n');
          resolve(server);
        })
        .on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            reject(err);
          } else {
            console.error('Server error:', err);
            process.exit(1);
          }
        });
    });
  };

  try {
    await tryPort(PORT);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${PORT} is already in use`);
      
      // Try alternative ports
      const alternativePorts = [5001, 5002, 5003, 3001, 3002];
      let serverStarted = false;
      
      for (const altPort of alternativePorts) {
        try {
          console.log(`🔄 Trying port ${altPort}...`);
          await tryPort(altPort);
          console.log(`✅ Server started on alternative port ${altPort}`);
          console.log(`💡 Update your frontend VITE_API_URL to: http://localhost:${altPort}/api`);
          serverStarted = true;
          break;
        } catch (err) {
          if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  Port ${altPort} is also in use`);
            continue;
          } else {
            throw err;
          }
        }
      }
      
      if (!serverStarted) {
        console.error('\n❌ All ports are in use. Please kill existing processes:');
        console.error('   Run: lsof -ti:5000 | xargs kill -9');
        console.error('   Or: pkill -f "node server.js"');
        process.exit(1);
      }
    } else {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
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
