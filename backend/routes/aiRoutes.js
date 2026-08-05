const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// POST /api/ai/recommend
router.post('/recommend', async (req, res) => {
    const { query, userGender } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter.' });
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
