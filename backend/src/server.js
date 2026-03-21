'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const landRoutes = require('./routes/land');
const authRoutes = require('./routes/auth');
const { authenticateToken, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: ['https://blockchainlandregistry-ochre.vercel.app', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Land Registry API is running' });
});

app.use('/api/auth', authRoutes);
const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

app.use('/api/land', (req, res, next) => {
    if (req.method === 'POST') {
        return authenticateToken(req, res, () => {
            requireRole('registrar')(req, res, next);
        });
    }
    next();
}, landRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});