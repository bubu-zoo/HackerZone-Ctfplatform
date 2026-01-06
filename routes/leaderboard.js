// HackerZone Leaderboard Routes

const express = require('express');
const router = express.Router();
const { userOps, statsOps } = require('../database/db');

// GET /api/leaderboard - Get top players
router.get('/', (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const leaderboard = userOps.getLeaderboard(limit);

        res.json({
            success: true,
            leaderboard: leaderboard.map((user, index) => ({
                rank: index + 1,
                username: user.username,
                score: user.score,
                solves: user.solves_count
            }))
        });

    } catch (error) {
        console.error('[LEADERBOARD] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load leaderboard'
        });
    }
});

// GET /api/leaderboard/stats - Get platform statistics
router.get('/stats', (req, res) => {
    try {
        const stats = statsOps.getDashboardStats();

        res.json({
            success: true,
            stats: {
                totalPlayers: stats.totalUsers,
                totalChallenges: stats.enabledChallenges,
                totalSolves: stats.totalSolves
            }
        });

    } catch (error) {
        console.error('[LEADERBOARD] Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load statistics'
        });
    }
});

module.exports = router;
