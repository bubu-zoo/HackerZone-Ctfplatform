// HackerZone Security Middleware
// Implements OWASP Top 10 protections

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');
const { tokenOps, auditOps } = require('../database/db');

// OWASP A01:2021 - Broken Access Control
// Verify JWT token for authenticated routes
const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.authToken || req.headers['x-auth-token'];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        // Check if token is blacklisted
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        if (tokenOps.isBlacklisted(tokenHash)) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has been invalidated.' 
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired.' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token.' 
        });
    }
};

// Admin token verification with separate secret
const verifyAdminToken = (req, res, next) => {
    try {
        const token = req.cookies.adminToken || req.headers['x-admin-token'];
        
        if (!token) {
            // Log unauthorized access attempt
            auditOps.log(
                'ADMIN_ACCESS_DENIED',
                'unknown',
                'anonymous',
                req.originalUrl,
                'No admin token provided',
                getClientIP(req),
                req.headers['user-agent']
            );
            return res.status(401).json({ 
                success: false, 
                message: 'Admin access denied.' 
            });
        }

        // Check if token is blacklisted
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        if (tokenOps.isBlacklisted(tokenHash)) {
            auditOps.log(
                'ADMIN_BLACKLISTED_TOKEN',
                'unknown',
                'anonymous',
                req.originalUrl,
                'Blacklisted token used',
                getClientIP(req),
                req.headers['user-agent']
            );
            return res.status(401).json({ 
                success: false, 
                message: 'Token has been invalidated.' 
            });
        }

        const decoded = jwt.verify(token, config.JWT_ADMIN_SECRET);
        
        // Verify it's actually an admin token
        if (!decoded.isAdmin) {
            auditOps.log(
                'ADMIN_ACCESS_DENIED',
                decoded.username || 'unknown',
                'user',
                req.originalUrl,
                'Non-admin token used for admin route',
                getClientIP(req),
                req.headers['user-agent']
            );
            return res.status(403).json({ 
                success: false, 
                message: 'Admin privileges required.' 
            });
        }
        
        req.admin = decoded;
        next();
    } catch (error) {
        auditOps.log(
            'ADMIN_AUTH_FAILED',
            'unknown',
            'anonymous',
            req.originalUrl,
            error.message,
            getClientIP(req),
            req.headers['user-agent']
        );
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Admin session expired. Please login again.' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid admin token.' 
        });
    }
};

// OWASP A03:2021 - Injection Prevention
// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove potential XSS vectors
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    
    next();
};

// OWASP A04:2021 - Insecure Design Prevention
// CSRF Token generation and validation
const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET requests (they should be idempotent)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const clientToken = req.headers['x-csrf-token'] || req.body._csrf;
    const serverToken = req.cookies.csrfToken;

    if (!clientToken || !serverToken) {
        auditOps.log(
            'CSRF_TOKEN_MISSING',
            req.user?.username || 'anonymous',
            'user',
            req.originalUrl,
            'Missing CSRF token',
            getClientIP(req),
            req.headers['user-agent']
        );
        return res.status(403).json({ 
            success: false, 
            message: 'CSRF token missing.' 
        });
    }

    // Timing-safe comparison to prevent timing attacks
    const clientBuffer = Buffer.from(clientToken);
    const serverBuffer = Buffer.from(serverToken);
    
    if (clientBuffer.length !== serverBuffer.length || 
        !crypto.timingSafeEqual(clientBuffer, serverBuffer)) {
        auditOps.log(
            'CSRF_TOKEN_INVALID',
            req.user?.username || 'anonymous',
            'user',
            req.originalUrl,
            'Invalid CSRF token',
            getClientIP(req),
            req.headers['user-agent']
        );
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid CSRF token.' 
        });
    }

    next();
};

// Set CSRF cookie
const setCSRFCookie = (req, res, next) => {
    if (!req.cookies.csrfToken) {
        const token = generateCSRFToken();
        res.cookie('csrfToken', token, {
            httpOnly: false, // Needs to be readable by JavaScript
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
    }
    next();
};

// OWASP A05:2021 - Security Misconfiguration
// Security headers middleware (used alongside helmet)
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
    );
    
    next();
};

// OWASP A07:2021 - Identification and Authentication Failures
// Account lockout check
const checkAccountLockout = (user) => {
    if (user.locked_until) {
        const lockedUntil = new Date(user.locked_until);
        if (lockedUntil > new Date()) {
            const remainingTime = Math.ceil((lockedUntil - new Date()) / 1000 / 60);
            return {
                locked: true,
                remainingMinutes: remainingTime
            };
        }
    }
    return { locked: false };
};

// OWASP A09:2021 - Security Logging and Monitoring Failures
// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: getClientIP(req),
            userAgent: req.headers['user-agent']
        };
        
        // Log suspicious activities
        if (res.statusCode === 401 || res.statusCode === 403) {
            console.log(`[SECURITY] Unauthorized access attempt: ${JSON.stringify(logData)}`);
        }
        
        // Log admin actions
        if (req.originalUrl.startsWith('/hackur/api')) {
            console.log(`[ADMIN] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
        }
    });
    
    next();
};

// Get real client IP (handles proxies)
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
};

// Validate flag format
const validateFlagFormat = (flag) => {
    // Flags should be in format: HZ{...} or similar
    const flagPattern = /^HZ\{[\w\-_!@#$%^&*()+=]+\}$/;
    return flagPattern.test(flag);
};

// Password strength validation
const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUppercase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowercase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecial) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Username validation
const validateUsername = (username) => {
    const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
    return usernamePattern.test(username);
};

// Email validation
const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
};

module.exports = {
    verifyToken,
    verifyAdminToken,
    sanitizeInput,
    csrfProtection,
    setCSRFCookie,
    generateCSRFToken,
    securityHeaders,
    checkAccountLockout,
    requestLogger,
    getClientIP,
    validateFlagFormat,
    validatePasswordStrength,
    validateUsername,
    validateEmail
};
