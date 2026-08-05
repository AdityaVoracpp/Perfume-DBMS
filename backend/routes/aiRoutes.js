const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// POST /api/ai/recommend
router.post('/recommend', async (req, res) => {
    let { query, userGender } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter.' });
    }

    // If userGender was not passed in body, try extracting from Authorization header token
    if (!userGender && req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded && decoded.userId) {
                    const [users] = await pool.execute('SELECT gender FROM Users WHERE user_id = ?', [decoded.userId]);
                    if (users.length > 0 && users[0].gender) {
                        userGender = users[0].gender;
                    }
                }
            }
        } catch (err) {
            console.warn('Could not extract user gender from auth token:', err.message);
        }
    }

    try {
        // Step 1: Agentic Intent Extraction
        const intent = await geminiService.generateSearchIntent(query, userGender);
        console.log("Extracted Intent:", intent);

        // Step 2: Dynamic Database Querying
        const recommendations = await geminiService.executeDynamicQuery(intent);

        res.json({
            success: true,
            intent,
            recommendations
        });
    } catch (error) {
        console.error('Error in AI recommendation route:', error);
        res.status(500).json({ error: 'Failed to process AI recommendation.' });
    }
});

module.exports = router;
