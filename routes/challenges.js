// HackerZone Challenge Routes
// Handles challenge listing and flag submission

const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const config = require('../config/config');
const { 
    challengeOps, 
    submissionOps, 
    solveOps, 
    userOps,
    auditOps,
    hintOps
} = require('../database/db');
const { verifyToken, getClientIP, validateFlagFormat } = require('../middleware/security');

// Rate limit for flag submissions (prevent brute force)
const submissionCooldowns = new Map();
const SUBMISSION_COOLDOWN_MS = 5000; // 5 seconds between submissions

// Calculate hint cost for a challenge
function calculateHintCost(challengePoints) {
    const cost = Math.ceil(challengePoints * config.HINT_COST_PERCENTAGE);
    return Math.max(cost, config.MIN_HINT_COST);
}

// GET /api/challenges - Get all enabled challenges
router.get('/', verifyToken, (req, res) => {
    try {
        const challenges = challengeOps.getAllEnabled();
        const solvedIds = solveOps.getSolvedChallengeIds(req.user.userId);
        const unlockedHintIds = hintOps.getUnlockedChallengeIds(req.user.userId);
        
        // Group challenges by category
        const grouped = {};
        config.CATEGORIES.forEach(cat => {
            grouped[cat] = [];
        });

        challenges.forEach(challenge => {
            const isSolved = solvedIds.includes(challenge.id);
            const hasUnlockedHint = unlockedHintIds.includes(challenge.id);
            const hintCost = calculateHintCost(challenge.points);
            
            // Never expose flags, hints only if unlocked
            const safeChallenge = {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                category: challenge.category,
                difficulty: challenge.difficulty,
                points: challenge.points,
                attachment_url: challenge.attachment_url,
                solves: challenge.solves,
                solved: isSolved,
                hintUnlocked: hasUnlockedHint,
                hintCost: hintCost
            };

            if (grouped[challenge.category]) {
                grouped[challenge.category].push(safeChallenge);
            } else {
                if (!grouped['Miscellaneous']) {
                    grouped['Miscellaneous'] = [];
                }
                grouped['Miscellaneous'].push(safeChallenge);
            }
        });

        res.json({
            success: true,
            challenges: grouped,
            categories: config.CATEGORIES
        });

    } catch (error) {
        console.error('[CHALLENGES] List error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load challenges'
        });
    }
});

// GET /api/challenges/categories - Get available categories
router.get('/categories', (req, res) => {
    res.json({
        success: true,
        categories: config.CATEGORIES,
        difficulties: config.DIFFICULTY_LEVELS
    });
});

// GET /api/challenges/:id - Get single challenge
router.get('/:id', verifyToken, [
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

        const challenge = challengeOps.findByIdPublic(parseInt(req.params.id));
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        const isSolved = solveOps.exists(req.user.userId, challenge.id);
        const hasUnlockedHint = hintOps.isUnlocked(req.user.userId, challenge.id);
        const hintCost = calculateHintCost(challenge.points);
        
        // Only include hint if unlocked
        let hint = null;
        if (hasUnlockedHint) {
            const hintData = hintOps.getHintForChallenge(challenge.id);
            hint = hintData ? hintData.hint : null;
        }

        res.json({
            success: true,
            challenge: {
                ...challenge,
                solved: !!isSolved,
                hint: hint,
                hintUnlocked: !!hasUnlockedHint,
                hintCost: hintCost
            }
        });

    } catch (error) {
        console.error('[CHALLENGES] Get error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load challenge'
        });
    }
});

// POST /api/challenges/:id/unlock-hint - Unlock hint for a challenge (costs points)
router.post('/:id/unlock-hint', verifyToken, [
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
        const userId = req.user.userId;

        // Check if challenge exists
        const challenge = challengeOps.findByIdPublic(challengeId);
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        // Check if already unlocked
        if (hintOps.isUnlocked(userId, challengeId)) {
            const hintData = hintOps.getHintForChallenge(challengeId);
            return res.json({
                success: true,
                message: 'Hint already unlocked',
                hint: hintData ? hintData.hint : 'No hint available for this challenge',
                alreadyUnlocked: true
            });
        }

        // Check if challenge has a hint
        const hintData = hintOps.getHintForChallenge(challengeId);
        if (!hintData || !hintData.hint) {
            return res.status(400).json({
                success: false,
                message: 'This challenge has no hint available'
            });
        }

        // Calculate cost
        const hintCost = calculateHintCost(challenge.points);

        // Check user's score
        const userScore = userOps.getScore(userId);
        if (userScore < hintCost) {
            return res.status(400).json({
                success: false,
                message: `Not enough points. You need ${hintCost} points but only have ${userScore}.`,
                required: hintCost,
                current: userScore
            });
        }

        // Deduct points and unlock hint
        userOps.deductScore(userId, hintCost);
        hintOps.unlock(userId, challengeId, hintCost);

        // Log the action
        auditOps.log(
            'HINT_UNLOCK',
            req.user.username,
            'user',
            `challenge:${challengeId}`,
            JSON.stringify({ points_spent: hintCost }),
            getClientIP(req),
            req.headers['user-agent']
        );

        // Get updated score
        const newScore = userOps.getScore(userId);

        res.json({
            success: true,
            message: `Hint unlocked! ${hintCost} points deducted.`,
            hint: hintData.hint,
            pointsSpent: hintCost,
            newScore: newScore
        });

    } catch (error) {
        console.error('[CHALLENGES] Hint unlock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlock hint'
        });
    }
});

// POST /api/challenges/:id/submit - Submit flag
router.post('/:id/submit', verifyToken, [
    param('id').isInt().withMessage('Invalid challenge ID'),
    body('flag').trim().notEmpty().withMessage('Flag is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const challengeId = parseInt(req.params.id);
        const { flag } = req.body;
        const userId = req.user.userId;

        // Check submission cooldown
        const cooldownKey = `${userId}-${challengeId}`;
        const lastSubmission = submissionCooldowns.get(cooldownKey);
        
        if (lastSubmission && Date.now() - lastSubmission < SUBMISSION_COOLDOWN_MS) {
            const waitTime = Math.ceil((SUBMISSION_COOLDOWN_MS - (Date.now() - lastSubmission)) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${waitTime} seconds before submitting again`
            });
        }

        // Update cooldown
        submissionCooldowns.set(cooldownKey, Date.now());

        // Check if already solved
        const existingSolve = solveOps.exists(userId, challengeId);
        if (existingSolve) {
            return res.status(400).json({
                success: false,
                message: 'You have already solved this challenge'
            });
        }

        // Get challenge (including flag for verification)
        const challenge = challengeOps.findById(challengeId);
        
        if (!challenge || !challenge.is_enabled) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        // Compare flags (case-sensitive, exact match)
        const isCorrect = flag === challenge.flag;

        // Log submission
        submissionOps.create(
            userId,
            challengeId,
            flag,
            isCorrect,
            getClientIP(req)
        );

        if (isCorrect) {
            // Record solve
            solveOps.create(userId, challengeId);
            
            // Update user score
            userOps.updateScore(userId, challenge.points);
            
            // Increment challenge solves
            challengeOps.incrementSolves(challengeId);

            // Audit log
            auditOps.log(
                'CHALLENGE_SOLVED',
                req.user.username,
                'user',
                challenge.title,
                `Solved ${challenge.title} for ${challenge.points} points`,
                getClientIP(req),
                req.headers['user-agent']
            );

            // Get updated user score
            const user = userOps.findById(userId);

            res.json({
                success: true,
                correct: true,
                message: 'Congratulations! Flag is correct!',
                points: challenge.points,
                newScore: user.score
            });

        } else {
            auditOps.log(
                'WRONG_FLAG',
                req.user.username,
                'user',
                challenge.title,
                'Incorrect flag submission',
                getClientIP(req),
                req.headers['user-agent']
            );

            res.json({
                success: true,
                correct: false,
                message: 'Incorrect flag. Try again!'
            });
        }

    } catch (error) {
        console.error('[CHALLENGES] Submit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit flag'
        });
    }
});

// GET /api/challenges/user/solves - Get user's solved challenges
router.get('/user/solves', verifyToken, (req, res) => {
    try {
        const solves = solveOps.getByUser(req.user.userId);
        
        res.json({
            success: true,
            solves
        });

    } catch (error) {
        console.error('[CHALLENGES] Solves error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load solves'
        });
    }
});

module.exports = router;
