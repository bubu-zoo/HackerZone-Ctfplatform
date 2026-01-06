// HackerZone Configuration
// SECURITY: All sensitive values should be environment variables in production

const crypto = require('crypto');

module.exports = {
    // Server Configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // JWT Configuration - Strong secret key
    JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    JWT_ADMIN_SECRET: process.env.JWT_ADMIN_SECRET || crypto.randomBytes(64).toString('hex'),
    JWT_EXPIRES_IN: '24h',
    JWT_ADMIN_EXPIRES_IN: '2h', // Shorter session for admin
    
    // Cookie Configuration
    COOKIE_SECRET: process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex'),
    
    // Admin Credentials - MUST be set via environment variables in production
    // These are loaded from .env file or system environment
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    
    // Hint System - Points cost to unlock hints
    HINT_COST_PERCENTAGE: 0.25, // 25% of challenge points to unlock hint
    MIN_HINT_COST: 10, // Minimum points to unlock any hint
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    ADMIN_RATE_LIMIT_MAX: 20, // Stricter for admin
    
    // Security
    BCRYPT_ROUNDS: 12,
    
    // Challenge Categories
    CATEGORIES: [
        'Web Exploitation',
        'Cryptography',
        'Reverse Engineering',
        'Binary Exploitation',
        'Forensics',
        'OSINT',
        'Miscellaneous',
        'Steganography'
    ],
    
    // Difficulty Levels
    DIFFICULTY_LEVELS: ['Easy', 'Medium', 'Hard', 'Expert', 'Insane'],
    
    // Points by difficulty
    POINTS_BY_DIFFICULTY: {
        'Easy': 100,
        'Medium': 200,
        'Hard': 300,
        'Expert': 400,
        'Insane': 500
    }
};
