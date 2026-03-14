'use strict';

const express = require('express');
const router = express.Router();
const { getLand, registerLand } = require('../services/landService');

router.get('/:landId', async (req, res) => {
    try {
        const land = await getLand(req.params.landId);
        res.json({ success: true, data: land });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        const result = await registerLand(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
