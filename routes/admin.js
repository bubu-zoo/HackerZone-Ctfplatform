// HackerZone Admin Routes (Protected - /hackur)
// All routes require admin authentication

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult, param } = require('express-validator');
const config = require('../config/config');
const { 
    adminOps, 
    challengeOps, 
    userOps,
    auditOps,
    tokenOps,
    statsOps 
} = require('../database/db');
const { 
    verifyAdminToken, 
    checkAccountLockout, 
    getClientIP 
} = require('../middleware/security');

// Maximum login attempts before lockout
const MAX_ADMIN_LOGIN_ATTEMPTS = 3;
const ADMIN_LOCKOUT_DURATION_MINUTES = 30;

// POST /hackur/api/login - Admin login
router.post('/api/login', [
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

        // Log all admin login attempts
        auditOps.log(
            'ADMIN_LOGIN_ATTEMPT',
            username,
            'anonymous',
            'admin_login',
            `Admin login attempt from ${getClientIP(req)}`,
            getClientIP(req),
            req.headers['user-agent']
        );

        // Find admin
        const admin = adminOps.findByUsername(username);
        
        if (!admin) {
            // Add delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            auditOps.log(
                'ADMIN_LOGIN_FAILED',
                username,
                'anonymous',
                'admin_login',
                'Admin user not found',
                getClientIP(req),
                req.headers['user-agent']
            );
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check account lockout
        const lockoutStatus = checkAccountLockout(admin);
        if (lockoutStatus.locked) {
            auditOps.log(
                'ADMIN_LOGIN_LOCKED',
                username,
                'anonymous',
                'admin_login',
                `Locked account login attempt`,
                getClientIP(req),
                req.headers['user-agent']
            );
            
            return res.status(423).json({
                success: false,
                message: `Account locked. Try again in ${lockoutStatus.remainingMinutes} minutes.`
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!validPassword) {
            // Increment login attempts
            adminOps.incrementLoginAttempts(username);
            
            // Check if should lock account
            if (admin.login_attempts + 1 >= MAX_ADMIN_LOGIN_ATTEMPTS) {
                const lockUntil = new Date(Date.now() + ADMIN_LOCKOUT_DURATION_MINUTES * 60 * 1000);
                adminOps.lockAccount(username, lockUntil.toISOString());
                
                auditOps.log(
                    'ADMIN_ACCOUNT_LOCKED',
                    username,
                    'system',
                    username,
                    `Admin account locked after ${MAX_ADMIN_LOGIN_ATTEMPTS} failed attempts`,
                    getClientIP(req),
                    req.headers['user-agent']
                );
            }

            auditOps.log(
                'ADMIN_LOGIN_FAILED',
                username,
                'anonymous',
                'admin_login',
                'Invalid password',
                getClientIP(req),
                req.headers['user-agent']
            );

            // Add delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 1000));

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Reset login attempts on successful login
        adminOps.resetLoginAttempts(username);
        adminOps.updateLastLogin(admin.id);

        // Generate JWT token with admin-specific secret
        const token = jwt.sign(
            { 
                adminId: admin.id, 
                username: admin.username,
                isAdmin: true
            },
            config.JWT_ADMIN_SECRET,
            { expiresIn: config.JWT_ADMIN_EXPIRES_IN }
        );

        // Set secure cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000 // 2 hours
        });

        // Log successful login
        auditOps.log(
            'ADMIN_LOGIN_SUCCESS',
            username,
            'admin',
            'admin_login',
            'Successful admin login',
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Admin login successful'
        });

    } catch (error) {
        console.error('[ADMIN] Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// POST /hackur/api/logout - Admin logout
router.post('/api/logout', verifyAdminToken, (req, res) => {
    try {
        const token = req.cookies.adminToken || req.headers['x-admin-token'];
        
        if (token) {
            // Blacklist the token
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const decoded = jwt.decode(token);
            const expiresAt = new Date(decoded.exp * 1000).toISOString();
            tokenOps.blacklist(tokenHash, expiresAt);
        }

        // Clear cookie
        res.clearCookie('adminToken');

        auditOps.log(
            'ADMIN_LOGOUT',
            req.admin.username,
            'admin',
            'admin_logout',
            'Admin logged out',
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('[ADMIN] Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// GET /hackur/api/check - Check admin authentication
router.get('/api/check', (req, res) => {
    try {
        const token = req.cookies.adminToken || req.headers['x-admin-token'];
        
        if (!token) {
            return res.json({ authenticated: false });
        }

        const decoded = jwt.verify(token, config.JWT_ADMIN_SECRET);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        if (tokenOps.isBlacklisted(tokenHash)) {
            return res.json({ authenticated: false });
        }

        if (!decoded.isAdmin) {
            return res.json({ authenticated: false });
        }

        res.json({ authenticated: true });

    } catch (error) {
        res.json({ authenticated: false });
    }
});

// GET /hackur/api/dashboard - Get dashboard statistics
router.get('/api/dashboard', verifyAdminToken, (req, res) => {
    try {
        const stats = statsOps.getDashboardStats();
        const recentLogs = auditOps.getRecent(10);

        res.json({
            success: true,
            stats,
            recentActivity: recentLogs
        });

    } catch (error) {
        console.error('[ADMIN] Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard'
        });
    }
});

// ==================== CHALLENGE MANAGEMENT ====================

// GET /hackur/api/challenges - Get all challenges (including disabled)
router.get('/api/challenges', verifyAdminToken, (req, res) => {
    try {
        const challenges = challengeOps.getAll();

        res.json({
            success: true,
            challenges
        });

    } catch (error) {
        console.error('[ADMIN] Challenges list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load challenges'
        });
    }
});

// POST /hackur/api/challenges - Create new challenge
router.post('/api/challenges', verifyAdminToken, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('difficulty').trim().notEmpty().withMessage('Difficulty is required'),
    body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
    body('flag').trim().notEmpty().withMessage('Flag is required')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { title, description, category, difficulty, points, flag, hint, attachment_url, is_enabled } = req.body;

        // Validate category
        if (!config.CATEGORIES.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Validate difficulty
        if (!config.DIFFICULTY_LEVELS.includes(difficulty)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid difficulty level'
            });
        }

        const result = challengeOps.create({
            title,
            description,
            category,
            difficulty,
            points,
            flag,
            hint,
            attachment_url,
            is_enabled: is_enabled !== false ? 1 : 0
        });

        auditOps.log(
            'CHALLENGE_CREATED',
            req.admin.username,
            'admin',
            title,
            `Created challenge: ${title}`,
            getClientIP(req),
            req.headers['user-agent']
        );

        res.status(201).json({
            success: true,
            message: 'Challenge created successfully',
            challengeId: result.lastInsertRowid
        });

    } catch (error) {
        console.error('[ADMIN] Create challenge error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create challenge'
        });
    }
});

// GET /hackur/api/challenges/:id - Get single challenge with flag
router.get('/api/challenges/:id', verifyAdminToken, [
    param('id').isInt().withMessage('Invalid challenge ID')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const challenge = challengeOps.findById(parseInt(req.params.id));
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        res.json({
            success: true,
            challenge
        });

    } catch (error) {
        console.error('[ADMIN] Get challenge error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load challenge'
        });
    }
});

// PUT /hackur/api/challenges/:id - Update challenge
router.put('/api/challenges/:id', verifyAdminToken, [
    param('id').isInt().withMessage('Invalid challenge ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('difficulty').trim().notEmpty().withMessage('Difficulty is required'),
    body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
    body('flag').trim().notEmpty().withMessage('Flag is required')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const challengeId = parseInt(req.params.id);
        const { title, description, category, difficulty, points, flag, hint, attachment_url, is_enabled } = req.body;

        // Check if challenge exists
        const existing = challengeOps.findById(challengeId);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        // Validate category
        if (!config.CATEGORIES.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Validate difficulty
        if (!config.DIFFICULTY_LEVELS.includes(difficulty)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid difficulty level'
            });
        }

        challengeOps.update(challengeId, {
            title,
            description,
            category,
            difficulty,
            points,
            flag,
            hint,
            attachment_url,
            is_enabled: is_enabled ? 1 : 0
        });

        auditOps.log(
            'CHALLENGE_UPDATED',
            req.admin.username,
            'admin',
            title,
            `Updated challenge: ${title}`,
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Challenge updated successfully'
        });

    } catch (error) {
        console.error('[ADMIN] Update challenge error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update challenge'
        });
    }
});

// DELETE /hackur/api/challenges/:id - Delete challenge
router.delete('/api/challenges/:id', verifyAdminToken, [
    param('id').isInt().withMessage('Invalid challenge ID')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const challengeId = parseInt(req.params.id);
        
        const challenge = challengeOps.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        challengeOps.delete(challengeId);

        auditOps.log(
            'CHALLENGE_DELETED',
            req.admin.username,
            'admin',
            challenge.title,
            `Deleted challenge: ${challenge.title}`,
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Challenge deleted successfully'
        });

    } catch (error) {
        console.error('[ADMIN] Delete challenge error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete challenge'
        });
    }
});

// POST /hackur/api/challenges/:id/enable - Enable challenge
router.post('/api/challenges/:id/enable', verifyAdminToken, [
    param('id').isInt().withMessage('Invalid challenge ID')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const challengeId = parseInt(req.params.id);
        const challenge = challengeOps.findById(challengeId);
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        challengeOps.enable(challengeId);

        auditOps.log(
            'CHALLENGE_ENABLED',
            req.admin.username,
            'admin',
            challenge.title,
            `Enabled challenge: ${challenge.title}`,
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Challenge enabled'
        });

    } catch (error) {
        console.error('[ADMIN] Enable challenge error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enable challenge'
        });
    }
});

// POST /hackur/api/challenges/:id/disable - Disable challenge
router.post('/api/challenges/:id/disable', verifyAdminToken, [
    param('id').isInt().withMessage('Invalid challenge ID')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const challengeId = parseInt(req.params.id);
        const challenge = challengeOps.findById(challengeId);
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        challengeOps.disable(challengeId);

        auditOps.log(
            'CHALLENGE_DISABLED',
            req.admin.username,
            'admin',
            challenge.title,
            `Disabled challenge: ${challenge.title}`,
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'Challenge disabled'
        });

    } catch (error) {
        console.error('[ADMIN] Disable challenge error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable challenge'
        });
    }
});

// ==================== USER MANAGEMENT ====================

// GET /hackur/api/users - Get all users
router.get('/api/users', verifyAdminToken, (req, res) => {
    try {
        const users = userOps.getAllUsers();

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('[ADMIN] Users list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load users'
        });
    }
});

// POST /hackur/api/users/:id/ban - Ban user
router.post('/api/users/:id/ban', verifyAdminToken, [
    param('id').isInt().withMessage('Invalid user ID')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const userId = parseInt(req.params.id);
        const user = userOps.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        userOps.banUser(userId);

        auditOps.log(
            'USER_BANNED',
            req.admin.username,
            'admin',
            user.username,
            `Banned user: ${user.username}`,
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'User banned'
        });

    } catch (error) {
        console.error('[ADMIN] Ban user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to ban user'
        });
    }
});

// POST /hackur/api/users/:id/unban - Unban user
router.post('/api/users/:id/unban', verifyAdminToken, [
    param('id').isInt().withMessage('Invalid user ID')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const userId = parseInt(req.params.id);
        const user = userOps.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        userOps.unbanUser(userId);

        auditOps.log(
            'USER_UNBANNED',
            req.admin.username,
            'admin',
            user.username,
            `Unbanned user: ${user.username}`,
            getClientIP(req),
            req.headers['user-agent']
        );

        res.json({
            success: true,
            message: 'User unbanned'
        });

    } catch (error) {
        console.error('[ADMIN] Unban user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unban user'
        });
    }
});

// ==================== AUDIT LOGS ====================

// GET /hackur/api/logs - Get audit logs
router.get('/api/logs', verifyAdminToken, (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        const action = req.query.action;
        
        let logs;
        if (action) {
            logs = auditOps.getByAction(action, limit);
        } else {
            logs = auditOps.getRecent(limit);
        }

        res.json({
            success: true,
            logs
        });

    } catch (error) {
        console.error('[ADMIN] Logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load logs'
        });
    }
});

module.exports = router;
