'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile } = require('../services/ipfsService');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = '/tmp/uploads';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only PDF and image files are allowed'));
    }
});

router.post('/document', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const result = await uploadFile(req.file.path, req.file.originalname, {
            type: 'document',
            landId: req.body.landId || 'unknown'
        });
        fs.unlinkSync(req.file.path);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/photo', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const result = await uploadFile(req.file.path, req.file.originalname, {
            type: 'photo',
            landId: req.body.landId || 'unknown'
        });
        fs.unlinkSync(req.file.path);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/multiple', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files?.length) return res.status(400).json({ success: false, error: 'No files uploaded' });
        const results = await Promise.all(
            req.files.map(file => uploadFile(file.path, file.originalname, {
                landId: req.body.landId || 'unknown'
            }))
        );
        req.files.forEach(file => fs.unlinkSync(file.path));
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
