// HackerZone Authentication Routes
// Handles user registration, login, and logout

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const config = require('../config/config');
const { userOps, auditOps, tokenOps } = require('../database/db');
const { 
    verifyToken, 
    checkAccountLockout, 
    getClientIP,
    validatePasswordStrength,
    validateUsername,
    validateEmail
} = require('../middleware/security');

// Maximum login attempts before lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// POST /api/auth/register - User registration
router.post('/register', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('confirmPassword').notEmpty().withMessage('Password confirmation is required')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { username, email, password, confirmPassword } = req.body;

        // Validate username format
        if (!validateUsername(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet requirements',
                errors: passwordValidation.errors
            });
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Check if username already exists
        const existingUser = userOps.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Check if email already exists
        const existingEmail = userOps.findByEmail(email);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password with bcrypt
        const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

        // Create user
        const result = userOps.create(username, email, passwordHash);

        // Log registration
        auditOps.log(
            'USER_REGISTERED',
            username,
            'user',
            username,
            'New user registration',
            getClientIP(req),
            req.headers['user-agent']
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please login.'
        });

    } catch (error) {
        console.error('[AUTH] Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// POST /api/auth/login - User login
router.post('/login', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { username, password } = req.body;

        // Find user
        const user = userOps.findByUsername(username);
        
        if (!user) {
            // Log failed attempt
            auditOps.log(
                'LOGIN_FAILED',
                username,
                'anonymous',
                'login',
                'User not found',
                getClientIP(req),
                req.headers['user-agent']
            );
            
            // Generic error to prevent username enumeration
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Check if account is banned
        if (user.is_banned) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Contact admin.'
            });
        }

        // Check account lockout
        const lockoutStatus = checkAccountLockout(user);
        if (lockoutStatus.locked) {
            return res.status(423).json({
                success: false,
                message: `Account locked. Try again in ${lockoutStatus.remainingMinutes} minutes.`
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            // Increment login attempts
            userOps.incrementLoginAttempts(username);
            
            // Check if should lock account
            if (user.login_attempts + 1 >= MAX_LOGIN_ATTEMPTS) {
                const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
                userOps.lockAccount(username, lockUntil.toISOString());
                
                auditOps.log(
                    'ACCOUNT_LOCKED',
                    username,
                    'system',
                    username,
                    `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts`,
                    getClientIP(req),
                    req.headers['user-agent']
                );
            }

            auditOps.log(
                'LOGIN_FAILED',
                username,
                'anonymous',
                'login',
                'Invalid password',
                getClientIP(req),
                req.headers['user-agent']
            );

            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Reset login attempts on successful login
        userOps.resetLoginAttempts(username);
        userOps.updateLastLogin(user.id);

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                email: user.email
            },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        // Set secure cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Log successful login
        auditOps.log(
            'LOGIN_SUCCESS',
            username,
            'user',
            'login',
            'Successful login',
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                score: user.score
            }
        });

    } catch (error) {
        console.error('[AUTH] Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// POST /api/auth/logout - User logout
router.post('/logout', verifyToken, (req, res) => {
    try {
        const token = req.cookies.authToken || req.headers['x-auth-token'];
        
        if (token) {
            // Blacklist the token
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const decoded = jwt.decode(token);
            const expiresAt = new Date(decoded.exp * 1000).toISOString();
            tokenOps.blacklist(tokenHash, expiresAt);
        }

        // Clear cookie
        res.clearCookie('authToken');

        auditOps.log(
            'LOGOUT',
            req.user.username,
            'user',
            'logout',
            'User logged out',
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('[AUTH] Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', verifyToken, (req, res) => {
    try {
        const user = userOps.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                score: user.score,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('[AUTH] Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user info'
        });
    }
});

// GET /api/auth/check - Check if user is authenticated
router.get('/check', (req, res) => {
    try {
        const token = req.cookies.authToken || req.headers['x-auth-token'];
        
        if (!token) {
            return res.json({ authenticated: false });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        if (tokenOps.isBlacklisted(tokenHash)) {
            return res.json({ authenticated: false });
        }

        res.json({ 
            authenticated: true,
            user: {
                userId: decoded.userId,
                username: decoded.username
            }
        });

    } catch (error) {
        res.json({ authenticated: false });
    }
});

module.exports = router;
