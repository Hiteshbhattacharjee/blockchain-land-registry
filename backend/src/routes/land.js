'use strict';

const express = require('express');
const router = express.Router();
const { getLand, registerLand } = require('../services/landService');
const { upsertLandRecord, getLandFromDB, getAllLands } = require('../services/dbService');

router.get('/', async (req, res) => {
    try {
        const lands = await getAllLands(req.query);
        res.json({ success: true, count: lands.length, data: lands });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:landId', async (req, res) => {
    try {
        const land = await getLand(req.params.landId);
        await upsertLandRecord(land);
        res.json({ success: true, source: 'blockchain', data: land });
    } catch (error) {
        const dbLand = await getLandFromDB(req.params.landId);
        if (dbLand) {
            return res.json({ success: true, source: 'database', data: dbLand });
        }
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
