const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const lowStockAlertsRouter = require('./part3_api');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    details: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bynry_case_study', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully');
  console.log('Database:', db.name);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bynry Backend Case Study Server is running',
    timestamp: new Date().toISOString(),
    database: db.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api', lowStockAlertsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Bynry Backend Case Study API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      low_stock_alerts: '/api/companies/{company_id}/alerts/low-stock',
      low_stock_summary: '/api/companies/{company_id}/alerts/low-stock/summary'
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    details: 'The requested resource was not found',
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/companies/{company_id}/alerts/low-stock',
      'GET /api/companies/{company_id}/alerts/low-stock/summary'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Bynry Backend Case Study Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  console.log(`🗄️  Database: ${db.name || 'Connecting...'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
  console.log('📁 Project Structure:');
  console.log('  ├── Part 1: Code Review & Fixed Implementation');
  console.log('  ├── Part 2: Database Schema & ER Diagram');
  console.log('  └── Part 3: Low Stock Alerts API');
  console.log('='.repeat(60));
});

module.exports = app;


