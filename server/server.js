// Load environment variables from parent directory
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const NodeCache = require('node-cache');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize cache with default TTL (300 seconds = 5 minutes)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

// Create Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080', 
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Rate limiting - more lenient to avoid blocking legitimate requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for cached responses
  skip: (req) => {
    // Check if this might be a cached request
    return req.path.includes('/api/');
  }
});

app.use(limiter);

// Hiro API configuration
const HIRO_API_BASE = process.env.HIRO_API_URL || 'https://api.testnet.hiro.so';
// Support both HIRO_API_KEY and VITE_HIRO_API_KEY for flexibility
const HIRO_API_KEY = process.env.HIRO_API_KEY || process.env.VITE_HIRO_API_KEY;

const getHiroHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (HIRO_API_KEY) {
    headers['x-api-key'] = HIRO_API_KEY;
  }

  return headers;
};

// Stacks.js network configuration
const DEFAULT_NETWORK = process.env.STACKS_NETWORK || 'testnet';
const { StacksTestnet, StacksMainnet } = require('@stacks/network');
const { callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV, hexToCV } = require('@stacks/transactions');

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Cache management endpoints
app.get('/cache/stats', (req, res) => {
  res.json({
    keys: cache.keys(),
    count: cache.keys().length,
    stats: cache.getStats()
  });
});

app.delete('/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({ message: 'Cache cleared successfully' });
});

app.delete('/cache/key/:key', (req, res) => {
  const { key } = req.params;
  const deleted = cache.del(key);
  res.json({ deleted, key });
});

// Simple cache invalidation endpoint
app.post('/cache/invalidate', (req, res) => {
  try {
    const { keys } = req.body;
    
    if (!keys || !Array.isArray(keys)) {
      return res.status(400).json({ error: 'Invalid keys array' });
    }

    // Delete specific keys
    const results = keys.map(key => {
      const deleted = cache.del(key);
      return { key, deleted };
    });

    res.json({ 
      message: 'Cache invalidated',
      results 
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
});

// Import route handlers
require('./routes/hiro')(app, cache, axios, getHiroHeaders, HIRO_API_BASE);
require('./routes/stacks')(app, cache, callReadOnlyFunction, cvToJSON, hexToCV, uintCV, standardPrincipalCV, DEFAULT_NETWORK);
require('./routes/optimized')(app, cache, axios, callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV, DEFAULT_NETWORK);

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  
  // Handle rate limiting errors
  if (err.status === 429 || err.response?.status === 429) {
    return res.status(429).json({
      error: 'Rate Limited',
      message: 'Too many requests. Please try again later.',
      retryAfter: err.response?.headers['retry-after'] || 60
    });
  }
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed'
    });
  }
  
  // Generic error
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// 404 handler (must be after error handler)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Validate environment variables
const validateEnv = () => {
  const warnings = [];
  
  if (!HIRO_API_KEY) {
    warnings.push('⚠️  HIRO_API_KEY not set - API calls may be rate limited');
    warnings.push('   Consider getting an API key from https://www.hiro.so/');
  }
  
  if (!process.env.FRONTEND_URL) {
    warnings.push('⚠️  FRONTEND_URL not set - using default http://localhost:5173');
  }
  
  return warnings;
};

// Request counter for monitoring
let requestCount = 0;
let rateLimitHits = 0;

// Add request monitoring middleware
app.use((req, res, next) => {
  requestCount++;
  
  // Log every 50th request
  if (requestCount % 50 === 0) {
    console.log(`📊 Processed ${requestCount} requests (Rate limits hit: ${rateLimitHits})`);
  }
  
  // Track rate limit responses
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 429) {
      rateLimitHits++;
      console.warn(`⚠️  Rate limit hit on ${req.path} (Total: ${rateLimitHits})`);
    }
    return originalJson.call(this, data);
  };
  
  next();
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Blockchain Cache Server Started');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Hiro API: ${HIRO_API_BASE}`);
  console.log(`⛓️  Network: ${DEFAULT_NETWORK}`);
  console.log(`🔑 API Key: ${HIRO_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('═══════════════════════════════════════════════════════');
  
  const warnings = validateEnv();
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }
  
  console.log('✅ Server ready to accept requests\n');
});

module.exports = app;