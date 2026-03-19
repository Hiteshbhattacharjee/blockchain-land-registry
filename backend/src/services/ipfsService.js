'use strict';

const { PinataSDK } = require('pinata');
const fs = require('fs');
const path = require('path');

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
});

async function uploadFile(filePath, fileName, metadata = {}) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer], { type: getContentType(fileName) });
        const file = new File([blob], fileName, { type: getContentType(fileName) });
        
        const response = await pinata.upload.public.file(file);
        return {
            success: true,
            ipfsHash: response.cid,
            url: `${process.env.PINATA_GATEWAY}/ipfs/${response.cid}`
        };
    } catch (error) {
        throw new Error(`IPFS upload failed: ${error.message}`);
    }
}

async function uploadJSON(data, name) {
    try {
        const response = await pinata.upload.public.json(data);
        return {
            success: true,
            ipfsHash: response.cid,
            url: `${process.env.PINATA_GATEWAY}/ipfs/${response.cid}`
        };
    } catch (error) {
        throw new Error(`IPFS JSON upload failed: ${error.message}`);
    }
}

function getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const types = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    };
    return types[ext] || 'application/octet-stream';
}

module.exports = { uploadFile, uploadJSON };
