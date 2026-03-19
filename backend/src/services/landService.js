'use strict';

const { connectToFabric } = require('../config/fabric');
const { invokeChaincode } = require('./cliService');

const CHANNEL_NAME = process.env.CHANNEL_NAME;
const CHAINCODE_NAME = process.env.CHAINCODE_NAME;

async function getLand(landId) {
    const { gateway, client } = await connectToFabric();
    try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const resultBytes = await contract.evaluateTransaction('GetLand', landId);
        return JSON.parse(Buffer.from(resultBytes).toString());
    } finally {
        gateway.close();
        client.close();
    }
}

async function registerLand(landData) {
    await invokeChaincode('RegisterLand', [
        landData.landId, landData.surveyNumber, landData.district,
        landData.taluka, landData.state, landData.pinCode,
        String(landData.areaSqFt), String(landData.areaAcres),
        landData.landType, landData.ownerName, landData.ownerAadhaarHash,
        landData.documentIpfsHash, landData.surveyIpfsHash,
        landData.gisCoordinates, String(landData.marketValue),
        String(landData.governmentValue)
    ]);
    return { success: true, landId: landData.landId };
}

async function approveLand(landId, approvalNotes) {
    await invokeChaincode('ApproveLandRegistration', [
        landId,
        approvalNotes || 'Approved by registrar'
    ]);
    return { success: true, landId };
}

async function transferOwnership(transferData) {
    await invokeChaincode('TransferOwnership', [
        transferData.landId, transferData.newOwnerName,
        transferData.newOwnerAadhaarHash, transferData.transferType,
        String(transferData.saleValue || 0), String(transferData.stampDuty || 0),
        String(transferData.registrationFee || 0), transferData.sellerSignature,
        transferData.buyerSignature, transferData.ipfsDocHash || '',
        String(transferData.fraudScore || 0.0), transferData.fraudFlags || '[]'
    ]);
    return { success: true, landId: transferData.landId, newOwner: transferData.newOwnerName };
}

async function getLandHistory(landId) {
    const { gateway, client } = await connectToFabric();
    try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const resultBytes = await contract.evaluateTransaction('GetLandHistory', landId);
        const result = Buffer.from(resultBytes).toString();
        return result ? JSON.parse(result) : [];
    } finally {
        gateway.close();
        client.close();
    }
}

module.exports = { getLand, registerLand, transferOwnership, getLandHistory, approveLand };
