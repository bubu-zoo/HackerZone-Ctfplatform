// HackerZone Database Setup
// Uses SQLite with parameterized queries to prevent SQL Injection (OWASP A03:2021)

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const config = require('../config/config');

const dbPath = path.join(__dirname, 'hackerzone.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            is_banned INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            login_attempts INTEGER DEFAULT 0,
            locked_until DATETIME
        )
    `);

    // Admin table (separate for security)
    db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            login_attempts INTEGER DEFAULT 0,
            locked_until DATETIME
        )
    `);

    // Challenges table
    db.exec(`
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            points INTEGER NOT NULL,
            flag TEXT NOT NULL,
            hint TEXT,
            attachment_url TEXT,
            is_enabled INTEGER DEFAULT 1,
            solves INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // User submissions/solves table
    db.exec(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            challenge_id INTEGER NOT NULL,
            submitted_flag TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (challenge_id) REFERENCES challenges(id)
        )
    `);

    // Solves table (correct submissions only)
    db.exec(`
        CREATE TABLE IF NOT EXISTS solves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            challenge_id INTEGER NOT NULL,
            solved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, challenge_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (challenge_id) REFERENCES challenges(id)
        )
    `);

    // Audit log table for security monitoring
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            actor TEXT,
            actor_type TEXT,
            target TEXT,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Session blacklist for JWT invalidation
    db.exec(`
        CREATE TABLE IF NOT EXISTS token_blacklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_hash TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Hint unlocks table - tracks which users have unlocked hints
    db.exec(`
        CREATE TABLE IF NOT EXISTS hint_unlocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            challenge_id INTEGER NOT NULL,
            points_spent INTEGER NOT NULL,
            unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, challenge_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (challenge_id) REFERENCES challenges(id)
        )
    `);

    // Create indexes for performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
        CREATE INDEX IF NOT EXISTS idx_challenges_enabled ON challenges(is_enabled);
        CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON submissions(challenge_id);
        CREATE INDEX IF NOT EXISTS idx_solves_user ON solves(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_hint_unlocks_user ON hint_unlocks(user_id);
    `);

    // Initialize admin account
    initializeAdmin();
    
    console.log('[DB] Database initialized successfully');
}

// Initialize admin account with hashed password
function initializeAdmin() {
    const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get(config.ADMIN_USERNAME);
    
    if (!existingAdmin) {
        const hashedPassword = bcrypt.hashSync(config.ADMIN_PASSWORD, config.BCRYPT_ROUNDS);
        db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(
            config.ADMIN_USERNAME,
            hashedPassword
        );
        console.log('[DB] Admin account created');
    }
}

// User operations
const userOps = {
    create: (username, email, passwordHash) => {
        const stmt = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
        return stmt.run(username, email, passwordHash);
    },
    
    findByUsername: (username) => {
        return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    },
    
    findByEmail: (email) => {
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    },
    
    findById: (id) => {
        return db.prepare('SELECT id, username, email, score, created_at, last_login FROM users WHERE id = ?').get(id);
    },
    
    updateScore: (userId, points) => {
        return db.prepare('UPDATE users SET score = score + ? WHERE id = ?').run(points, userId);
    },
    
    deductScore: (userId, points) => {
        // Deduct points but never go below 0
        return db.prepare('UPDATE users SET score = MAX(0, score - ?) WHERE id = ?').run(points, userId);
    },
    
    getScore: (userId) => {
        const result = db.prepare('SELECT score FROM users WHERE id = ?').get(userId);
        return result ? result.score : 0;
    },
    
    updateLastLogin: (userId) => {
        return db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    },
    
    incrementLoginAttempts: (username) => {
        return db.prepare('UPDATE users SET login_attempts = login_attempts + 1 WHERE username = ?').run(username);
    },
    
    resetLoginAttempts: (username) => {
        return db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE username = ?').run(username);
    },
    
    lockAccount: (username, until) => {
        return db.prepare('UPDATE users SET locked_until = ? WHERE username = ?').run(until, username);
    },
    
    getLeaderboard: (limit = 50) => {
        return db.prepare(`
            SELECT id, username, score, 
                   (SELECT COUNT(*) FROM solves WHERE solves.user_id = users.id) as solves_count
            FROM users 
            WHERE is_banned = 0
            ORDER BY score DESC, solves_count DESC
            LIMIT ?
        `).all(limit);
    },
    
    getAllUsers: () => {
        return db.prepare('SELECT id, username, email, score, is_banned, created_at, last_login FROM users').all();
    },
    
    banUser: (userId) => {
        return db.prepare('UPDATE users SET is_banned = 1 WHERE id = ?').run(userId);
    },
    
    unbanUser: (userId) => {
        return db.prepare('UPDATE users SET is_banned = 0 WHERE id = ?').run(userId);
    }
};

// Admin operations
const adminOps = {
    findByUsername: (username) => {
        return db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    },
    
    updateLastLogin: (adminId) => {
        return db.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(adminId);
    },
    
    incrementLoginAttempts: (username) => {
        return db.prepare('UPDATE admins SET login_attempts = login_attempts + 1 WHERE username = ?').run(username);
    },
    
    resetLoginAttempts: (username) => {
        return db.prepare('UPDATE admins SET login_attempts = 0, locked_until = NULL WHERE username = ?').run(username);
    },
    
    lockAccount: (username, until) => {
        return db.prepare('UPDATE admins SET locked_until = ? WHERE username = ?').run(until, username);
    }
};

// Challenge operations
const challengeOps = {
    create: (challenge) => {
        const stmt = db.prepare(`
            INSERT INTO challenges (title, description, category, difficulty, points, flag, hint, attachment_url, is_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            challenge.title,
            challenge.description,
            challenge.category,
            challenge.difficulty,
            challenge.points,
            challenge.flag,
            challenge.hint || null,
            challenge.attachment_url || null,
            challenge.is_enabled !== undefined ? challenge.is_enabled : 1
        );
    },
    
    findById: (id) => {
        return db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
    },
    
    findByIdPublic: (id) => {
        // Don't return hint or flag to public - hints must be unlocked
        return db.prepare(`
            SELECT id, title, description, category, difficulty, points, attachment_url, solves 
            FROM challenges WHERE id = ? AND is_enabled = 1
        `).get(id);
    },
    
    // Admin only - includes flag and hint
    findByIdAdmin: (id) => {
        return db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
    },
    
    getAll: () => {
        return db.prepare('SELECT * FROM challenges ORDER BY category, difficulty').all();
    },
    
    getAllEnabled: () => {
        // Don't include hints - they must be unlocked separately
        return db.prepare(`
            SELECT id, title, description, category, difficulty, points, attachment_url, solves
            FROM challenges WHERE is_enabled = 1 ORDER BY category, points
        `).all();
    },
    
    getByCategory: (category) => {
        return db.prepare(`
            SELECT id, title, description, category, difficulty, points, attachment_url, solves
            FROM challenges WHERE category = ? AND is_enabled = 1 ORDER BY points
        `).all(category);
    },
    
    update: (id, challenge) => {
        const stmt = db.prepare(`
            UPDATE challenges SET 
                title = ?, description = ?, category = ?, difficulty = ?, 
                points = ?, flag = ?, hint = ?, attachment_url = ?, 
                is_enabled = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(
            challenge.title,
            challenge.description,
            challenge.category,
            challenge.difficulty,
            challenge.points,
            challenge.flag,
            challenge.hint || null,
            challenge.attachment_url || null,
            challenge.is_enabled,
            id
        );
    },
    
    delete: (id) => {
        // First delete related solves and submissions
        db.prepare('DELETE FROM solves WHERE challenge_id = ?').run(id);
        db.prepare('DELETE FROM submissions WHERE challenge_id = ?').run(id);
        return db.prepare('DELETE FROM challenges WHERE id = ?').run(id);
    },
    
    enable: (id) => {
        return db.prepare('UPDATE challenges SET is_enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    },
    
    disable: (id) => {
        return db.prepare('UPDATE challenges SET is_enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    },
    
    incrementSolves: (id) => {
        return db.prepare('UPDATE challenges SET solves = solves + 1 WHERE id = ?').run(id);
    },
    
    getCategories: () => {
        return db.prepare('SELECT DISTINCT category FROM challenges WHERE is_enabled = 1').all();
    }
};

// Submission operations
const submissionOps = {
    create: (userId, challengeId, flag, isCorrect, ipAddress) => {
        const stmt = db.prepare(`
            INSERT INTO submissions (user_id, challenge_id, submitted_flag, is_correct, ip_address)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(userId, challengeId, flag, isCorrect ? 1 : 0, ipAddress);
    },
    
    getByUser: (userId) => {
        return db.prepare('SELECT * FROM submissions WHERE user_id = ? ORDER BY submitted_at DESC').all(userId);
    },
    
    getRecentByUserAndChallenge: (userId, challengeId, minutes = 1) => {
        return db.prepare(`
            SELECT COUNT(*) as count FROM submissions 
            WHERE user_id = ? AND challenge_id = ? 
            AND submitted_at > datetime('now', '-${minutes} minutes')
        `).get(userId, challengeId);
    }
};

// Solve operations
const solveOps = {
    create: (userId, challengeId) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO solves (user_id, challenge_id) VALUES (?, ?)');
        return stmt.run(userId, challengeId);
    },
    
    exists: (userId, challengeId) => {
        return db.prepare('SELECT id FROM solves WHERE user_id = ? AND challenge_id = ?').get(userId, challengeId);
    },
    
    getByUser: (userId) => {
        return db.prepare(`
            SELECT s.*, c.title, c.category, c.points 
            FROM solves s 
            JOIN challenges c ON s.challenge_id = c.id 
            WHERE s.user_id = ?
            ORDER BY s.solved_at DESC
        `).all(userId);
    },
    
    getSolvedChallengeIds: (userId) => {
        return db.prepare('SELECT challenge_id FROM solves WHERE user_id = ?').all(userId).map(s => s.challenge_id);
    }
};

// Audit log operations
const auditOps = {
    log: (action, actor, actorType, target, details, ipAddress, userAgent) => {
        const stmt = db.prepare(`
            INSERT INTO audit_logs (action, actor, actor_type, target, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(action, actor, actorType, target, details, ipAddress, userAgent);
    },
    
    getRecent: (limit = 100) => {
        return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
    },
    
    getByAction: (action, limit = 100) => {
        return db.prepare('SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ?').all(action, limit);
    }
};

// Token blacklist operations
const tokenOps = {
    blacklist: (tokenHash, expiresAt) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO token_blacklist (token_hash, expires_at) VALUES (?, ?)');
        return stmt.run(tokenHash, expiresAt);
    },
    
    isBlacklisted: (tokenHash) => {
        return db.prepare('SELECT id FROM token_blacklist WHERE token_hash = ?').get(tokenHash);
    },
    
    cleanExpired: () => {
        return db.prepare("DELETE FROM token_blacklist WHERE expires_at < datetime('now')").run();
    }
};

// Statistics
const statsOps = {
    getDashboardStats: () => {
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const totalChallenges = db.prepare('SELECT COUNT(*) as count FROM challenges').get().count;
        const enabledChallenges = db.prepare('SELECT COUNT(*) as count FROM challenges WHERE is_enabled = 1').get().count;
        const totalSolves = db.prepare('SELECT COUNT(*) as count FROM solves').get().count;
        const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
        
        return {
            totalUsers,
            totalChallenges,
            enabledChallenges,
            totalSolves,
            totalSubmissions
        };
    }
};

// Hint unlock operations
const hintOps = {
    unlock: (userId, challengeId, pointsSpent) => {
        const stmt = db.prepare(`
            INSERT INTO hint_unlocks (user_id, challenge_id, points_spent)
            VALUES (?, ?, ?)
        `);
        return stmt.run(userId, challengeId, pointsSpent);
    },
    
    isUnlocked: (userId, challengeId) => {
        return db.prepare('SELECT id FROM hint_unlocks WHERE user_id = ? AND challenge_id = ?').get(userId, challengeId);
    },
    
    getUnlockedChallengeIds: (userId) => {
        return db.prepare('SELECT challenge_id FROM hint_unlocks WHERE user_id = ?').all(userId).map(h => h.challenge_id);
    },
    
    getHintForChallenge: (challengeId) => {
        return db.prepare('SELECT hint FROM challenges WHERE id = ?').get(challengeId);
    },
    
    getTotalSpentByUser: (userId) => {
        const result = db.prepare('SELECT SUM(points_spent) as total FROM hint_unlocks WHERE user_id = ?').get(userId);
        return result.total || 0;
    }
};

module.exports = {
    db,
    initializeDatabase,
    userOps,
    adminOps,
    challengeOps,
    submissionOps,
    solveOps,
    auditOps,
    tokenOps,
    statsOps,
    hintOps
};
