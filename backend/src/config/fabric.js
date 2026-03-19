'use strict';

const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CRYPTO_PATH = process.env.CRYPTO_PATH;
const MSP_ID = process.env.MSP_ID;
const PEER_ENDPOINT = process.env.PEER_ENDPOINT;
const PEER_HOST_ALIAS = process.env.PEER_HOST_ALIAS;

function getKeyPath() {
    const keyDir = path.join(CRYPTO_PATH, 'users', 'Admin@registry.landregistry.gov', 'msp', 'keystore');
    const files = fs.readdirSync(keyDir);
    return path.join(keyDir, files[0]);
}

function getCertPath() {
    return path.join(CRYPTO_PATH, 'users', 'Admin@registry.landregistry.gov', 'msp', 'signcerts', 'Admin@registry.landregistry.gov-cert.pem');
}

function getTLSCertPath() {
    return path.join(CRYPTO_PATH, 'peers', 'peer0.registry.landregistry.gov', 'tls', 'ca.crt');
}

async function newGrpcConnection() {
    const tlsRootCert = fs.readFileSync(getTLSCertPath());
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(PEER_ENDPOINT, tlsCredentials, {
        'grpc.ssl_target_name_override': PEER_HOST_ALIAS,
    });
}

async function newIdentity() {
    const credentials = fs.readFileSync(getCertPath());
    return { mspId: MSP_ID, credentials };
}

async function newSigner() {
    const privateKeyPem = fs.readFileSync(getKeyPath());
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function connectToFabric() {
    const client = await newGrpcConnection();
    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        hash: hash.sha256,
        endorseTimeout: 30000,
        submitTimeout: 30000,
        broadcastTimeout: 30000,
    });
    return { gateway, client };
}

module.exports = { connectToFabric };
