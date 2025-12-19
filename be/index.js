import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import { logger } from './utils/logger.js';
import { createRateLimit, corsOptions, securityHeaders } from './middleware/security.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production') {
  app.use(securityHeaders);
  app.use(createRateLimit()); // Global rate limiting
}

// CORS
app.use(cors(corsOptions));

// Rate limiting untuk development - lebih longgar
if (process.env.NODE_ENV === 'production') {
  // Rate limiting for auth routes
  app.use('/api/auth', createRateLimit(15 * 60 * 1000, 20)); // 20 requests per 15 min for auth
  
  // Rate limiting for requests routes
  app.use('/api/requests', createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 min
} else {
  // Development - very relaxed rate limiting
  app.use('/api/auth', createRateLimit(1 * 60 * 1000, 1000)); // 1000 requests per minute
  app.use('/api/requests', createRateLimit(1 * 60 * 1000, 1000)); // 1000 requests per minute
}

// Test database connection
const testDatabaseConnection = async () => {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'BRIRoom API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Update health endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbCheck = await db.query('SELECT NOW() as time, COUNT(*) as user_count FROM users');
    
    // Check critical tables
    const tablesCheck = await db.query(`
      SELECT COUNT(*) as requests_count FROM requests WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        timestamp: dbCheck.rows[0].time,
        users_count: dbCheck.rows[0].user_count,
        recent_requests: tablesCheck.rows[0].requests_count
      },
      version: '1.0.0',
      uptime: Math.floor(process.uptime())
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Setup database schema dengan sample data untuk analytics
app.post('/api/setup-database', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const sqlFile = path.join(__dirname, 'database_schema.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL commands
    await db.query(sqlContent);
    
    res.json({
      success: true,
      message: 'Database schema dan sample data berhasil dibuat',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error setup database:', error);
    res.status(500).json({
      success: false,
      message: 'Database setup failed',
      error: error.message
    });
  }
});

// LOAD ROUTES (SEBELUM ERROR HANDLERS)
const loadRoutes = async () => {
  try {
    const authRoutes = await import('./routes/authRoutes.js');
    app.use('/api/auth', authRoutes.default);
    console.log('✅ Auth routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
  }

  // Uncomment ini setelah request routes siap
  
  try {
    const requestRoutes = await import('./routes/requestRoutes.js');
    app.use('/api/requests', requestRoutes.default);
    console.log('✅ Request routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load request routes:', error.message);
  }

  try {
    const workflowRoutes = await import('./routes/workflowRoutes.js');
    app.use('/api/workflow', workflowRoutes.default);
    console.log('✅ Workflow routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load workflow routes:', error.message);
  }

  try {
    const bpmnWorkflowRoutes = await import('./routes/bpmnWorkflowRoutes.js');
    app.use('/api/workflow', bpmnWorkflowRoutes.default);
    console.log('✅ BPMN workflow routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load BPMN workflow routes:', error.message);
  }

  try {
    const resourceRoutes = await import('./routes/resourceRoutes.js');
    app.use('/api/resources', resourceRoutes.default);
    console.log('✅ Resource routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load resource routes:', error.message);
  }

  try {
    const analyticsRoutes = await import('./routes/analytics.js');
    app.use('/api/analytics', analyticsRoutes.default);
    console.log('✅ Analytics routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load analytics routes:', error.message);
  }

  try {
    const roleBasedApprovalRoutes = await import('./routes/roleBasedApprovalRoutes.js');
    app.use('/api/role-based', roleBasedApprovalRoutes.default);
    console.log('✅ Role-based approval routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load role-based approval routes:', error.message);
  }

  try {
    const adminRoutes = await import('./routes/adminRoutes.js');
    app.use('/api/admin', adminRoutes.default);
    console.log('✅ Admin routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load admin routes:', error.message);
  }
  
};

// Load routes sebelum error handlers
await loadRoutes();

// 404 handler untuk API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/auth/test',
      'POST /api/auth/login',
      
      // User endpoints
      'GET /api/requests/schedule',
      'POST /api/requests',
      'GET /api/requests/me',
      'GET /api/requests/me/:id',
      'PUT /api/requests/me/:id',
      'PATCH /api/requests/me/:id/cancel',
      
      // Admin endpoints
      'GET /api/requests/all',
      'GET /api/requests/room-requests',
      'GET /api/requests/zoom-requests',
      
      // Approval endpoints
      'PATCH /api/requests/room/:id/approve',
      'PATCH /api/requests/zoom/:id/approve',
      'PATCH /api/requests/admin/:id/approve'
    ]
  });
});

// // Error handlers (PALING AKHIR)
// app.use((err, req, res, next) => {
//   console.error('❌ Error:', err);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: err.message
//   });
// });

// // Global 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found',
//     path: req.originalUrl
//   });
// });


// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting BRIRoom Server...');
    
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.log('⚠️  Database connection failed, but continuing...');
    }
    
    app.listen(PORT, () => {
      console.log('✅ Server started successfully!');
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth Test: http://localhost:${PORT}/api/auth/test`);
      console.log(`📝 Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log('=' .repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
