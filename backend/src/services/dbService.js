'use strict';

const pool = require('../config/database');

async function upsertLandRecord(landData) {
    const query = `
        INSERT INTO land_records (
            land_id, survey_number, district, taluka, state, pin_code,
            area_sqft, area_acres, land_type, owner_name, owner_aadhaar_hash,
            document_ipfs_hash, survey_ipfs_hash, gis_coordinates, status,
            mortgage_lock, dispute_flag, market_value, government_value,
            registrar_id, blockchain_tx_id, registration_date, last_updated
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
        )
        ON CONFLICT (land_id) DO UPDATE SET
            status = EXCLUDED.status,
            owner_name = EXCLUDED.owner_name,
            mortgage_lock = EXCLUDED.mortgage_lock,
            dispute_flag = EXCLUDED.dispute_flag,
            blockchain_tx_id = EXCLUDED.blockchain_tx_id,
            last_updated = EXCLUDED.last_updated;
    `;
    const values = [
        landData.landId, landData.surveyNumber, landData.district,
        landData.taluka, landData.state, landData.pinCode,
        landData.areaSqFt, landData.areaAcres, landData.landType,
        landData.ownerName, landData.ownerAadhaarHash,
        landData.documentIpfsHash, landData.surveyIpfsHash,
        landData.gisCoordinates, landData.status,
        landData.mortgageLock, landData.disputeFlag,
        landData.marketValue, landData.governmentValue,
        landData.registrarId, landData.blockchainTxId,
        landData.registrationDate, landData.lastUpdated
    ];
    await pool.query(query, values);
}

async function getLandFromDB(landId) {
    const result = await pool.query(
        'SELECT * FROM land_records WHERE land_id = $1',
        [landId]
    );
    return result.rows[0] || null;
}

async function getAllLands(filters = {}) {
    let query = 'SELECT * FROM land_records WHERE 1=1';
    const values = [];
    let i = 1;
    if (filters.district) {
        query += ` AND district = $${i++}`;
        values.push(filters.district);
    }
    if (filters.status) {
        query += ` AND status = $${i++}`;
        values.push(filters.status);
    }
    if (filters.owner_name) {
        query += ` AND owner_name ILIKE $${i++}`;
        values.push(`%${filters.owner_name}%`);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
}

module.exports = { upsertLandRecord, getLandFromDB, getAllLands };
