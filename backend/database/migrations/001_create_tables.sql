CREATE TABLE IF NOT EXISTS land_records (
    id SERIAL PRIMARY KEY,
    land_id VARCHAR(50) UNIQUE NOT NULL,
    survey_number VARCHAR(100),
    district VARCHAR(100),
    taluka VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(10),
    area_sqft DECIMAL,
    area_acres DECIMAL,
    land_type VARCHAR(50),
    owner_name VARCHAR(200),
    owner_aadhaar_hash VARCHAR(256),
    document_ipfs_hash VARCHAR(256),
    survey_ipfs_hash VARCHAR(256),
    gis_coordinates VARCHAR(100),
    status VARCHAR(50),
    mortgage_lock BOOLEAN DEFAULT FALSE,
    dispute_flag BOOLEAN DEFAULT FALSE,
    market_value BIGINT,
    government_value BIGINT,
    registrar_id TEXT,
    blockchain_tx_id VARCHAR(256),
    registration_date TIMESTAMP,
    last_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfer_records (
    id SERIAL PRIMARY KEY,
    land_id VARCHAR(50) NOT NULL,
    from_owner VARCHAR(200),
    to_owner VARCHAR(200),
    transfer_type VARCHAR(50),
    blockchain_tx_id VARCHAR(256),
    transfer_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_id ON land_records(land_id);
CREATE INDEX IF NOT EXISTS idx_district ON land_records(district);
CREATE INDEX IF NOT EXISTS idx_status ON land_records(status);
