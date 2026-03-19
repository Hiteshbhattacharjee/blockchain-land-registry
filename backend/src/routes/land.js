'use strict';

const express = require('express');
const router = express.Router();
const { getLand, registerLand, transferOwnership, getLandHistory, approveLand } = require('../services/landService');
const { upsertLandRecord, getLandFromDB, getAllLands } = require('../services/dbService');

router.get('/', async (req, res) => {
    try {
        const lands = await getAllLands(req.query);
        res.json({ success: true, count: lands.length, data: lands });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/history/:landId', async (req, res) => {
    try {
        const history = await getLandHistory(req.params.landId);
        res.json({ success: true, count: history.length, data: history });
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

router.post('/transfer', async (req, res) => {
    try {
        const result = await transferOwnership(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/approve', async (req, res) => {
    try {
        const { landId, approvalNotes } = req.body;
        if (!landId) {
            return res.status(400).json({ success: false, error: 'landId is required' });
        }
        const result = await approveLand(landId, approvalNotes);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

router.post('/approve-cli', async (req, res) => {
    const { exec } = require('child_process');
    const { landId } = req.body;
    if (!landId) return res.status(400).json({ success: false, error: 'landId required' });
    
    const cmd = `docker exec cli peer chaincode invoke \
        -o orderer.orderer.landregistry.gov:7050 \
        -C land-registry-channel \
        -n land-registry \
        --tls \
        --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/orderer.landregistry.gov/orderers/orderer.orderer.landregistry.gov/tls/ca.crt \
        --peerAddresses peer0.registry.landregistry.gov:7051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/registry.landregistry.gov/peers/peer0.registry.landregistry.gov/tls/ca.crt \
        --peerAddresses peer0.revenue.landregistry.gov:9051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/revenue.landregistry.gov/peers/peer0.revenue.landregistry.gov/tls/ca.crt \
        --waitForEvent \
        -c '{"function":"ApproveLandRegistration","Args":["${landId}","Approved by registrar"]}'`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, error: stderr || error.message });
        }
        res.json({ success: true, data: { landId, message: 'Land approved successfully' } });
    });
});
