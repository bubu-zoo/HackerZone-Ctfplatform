// HackerZone CTF Platform - Main Server
// Secure CTF platform following OWASP Top 10 guidelines

// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { initializeDatabase, tokenOps } = require('./database/db');
const { 
    sanitizeInput, 
    securityHeaders, 
    requestLogger,
    setCSRFCookie 
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');
const challengeFilesRoutes = require('./routes/challengeFiles');
const challengePagesRoutes = require('./routes/challengePages');

// Initialize Express app
const app = express();

// Trust proxy (for getting real IP behind reverse proxy)
app.set('trust proxy', 1);

// ==================== SECURITY MIDDLEWARE ====================

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: false, // We set our own CSP
    crossOriginEmbedderPolicy: false
}));

// Custom security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-auth-token', 'x-admin-token', 'x-csrf-token']
}));

// Body parsing with size limits (OWASP - Input validation)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser with signed cookies
app.use(cookieParser(config.COOKIE_SECRET));

// HTTP Parameter Pollution protection
app.use(hpp());

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// CSRF token cookie
app.use(setCSRFCookie);

// ==================== RATE LIMITING ====================

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Very strict rate limiter for admin endpoints
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.ADMIN_RATE_LIMIT_MAX,
    message: {
        success: false,
        message: 'Too many requests to admin panel, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Flag submission rate limiter
const flagLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 submissions per minute
    message: {
        success: false,
        message: 'Too many flag submissions, please slow down.'
    }
});

// Apply general rate limiter to all requests
app.use(generalLimiter);

// ==================== STATIC FILES ====================

// Serve public files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

// ==================== CHALLENGE ROUTES ====================

// Interactive challenge pages
app.use('/challenge', challengeFilesRoutes);
app.use('/challenge', challengePagesRoutes);

// ==================== API ROUTES ====================

// Auth routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Challenge routes with flag submission rate limiting
app.use('/api/challenges', challengeRoutes);
app.use('/api/challenges/:id/submit', flagLimiter);

// Leaderboard routes
app.use('/api/leaderboard', leaderboardRoutes);

// ==================== ADMIN PANEL (SECURED) ====================

// Admin panel static files - served from /hackur
app.use('/hackur', express.static(path.join(__dirname, 'hackur'), {
    index: 'index.html',
    maxAge: 0, // No caching for admin panel
    etag: false
}));

// Admin API routes (no rate limiting for admin operations)
app.use('/hackur', adminRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Catch-all for SPA routing (public)
app.get('*', (req, res, next) => {
    // Don't serve index.html for admin routes or API routes
    if (req.path.startsWith('/hackur') || req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);
    
    // Don't leak error details in production
    const isDev = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        success: false,
        message: isDev ? err.message : 'An unexpected error occurred',
        ...(isDev && { stack: err.stack })
    });
});

// ==================== SERVER STARTUP ====================

const PORT = config.PORT;

// Initialize database
initializeDatabase();

// Clean expired tokens periodically
setInterval(() => {
    try {
        tokenOps.cleanExpired();
    } catch (error) {
        console.error('[TOKEN CLEANUP] Error:', error);
    }
}, 60 * 60 * 1000); // Every hour

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗        ║
║   ██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗       ║
║   ███████║███████║██║     █████╔╝ █████╗  ██████╔╝       ║
║   ██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗       ║
║   ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║       ║
║   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝       ║
║                                                           ║
║   ███████╗ ██████╗ ███╗   ██╗███████╗                    ║
║   ╚══███╔╝██╔═══██╗████╗  ██║██╔════╝                    ║
║     ███╔╝ ██║   ██║██╔██╗ ██║█████╗                      ║
║    ███╔╝  ██║   ██║██║╚██╗██║██╔══╝                      ║
║   ███████╗╚██████╔╝██║ ╚████║███████╗                    ║
║   ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝                    ║
║                                                           ║
║   CTF Platform v1.0                                       ║
║   Server running on http://localhost:${PORT}                 ║
║   Admin Panel: http://localhost:${PORT}/hackur               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[SERVER] SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
