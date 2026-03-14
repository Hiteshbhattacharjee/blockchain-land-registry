'use strict';

const { connectToFabric } = require('../config/fabric');

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
    const { gateway, client } = await connectToFabric();
    try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        await contract.submitTransaction(
            'RegisterLand',
            landData.landId,
            landData.surveyNumber,
            landData.district,
            landData.taluka,
            landData.state,
            landData.pinCode,
            String(landData.areaSqFt),
            String(landData.areaAcres),
            landData.landType,
            landData.ownerName,
            landData.ownerAadhaarHash,
            landData.documentIpfsHash,
            landData.surveyIpfsHash,
            landData.gisCoordinates,
            String(landData.marketValue),
            String(landData.governmentValue)
        );
        return { success: true, landId: landData.landId };
    } finally {
        gateway.close();
        client.close();
    }
}

module.exports = { getLand, registerLand };
