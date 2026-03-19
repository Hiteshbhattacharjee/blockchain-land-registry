'use strict';

const { exec } = require('child_process');

const CHANNEL = 'land-registry-channel';
const CHAINCODE = 'land-registry';

function invokeChaincode(fcn, args) {
    return new Promise((resolve, reject) => {
        const payload = { function: fcn, Args: args };
        const payloadStr = JSON.stringify(payload);
        
        const wslCmd = `docker exec cli peer chaincode invoke \
-o orderer.orderer.landregistry.gov:7050 \
-C ${CHANNEL} \
-n ${CHAINCODE} \
--tls \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/orderer.landregistry.gov/orderers/orderer.orderer.landregistry.gov/tls/ca.crt \
--peerAddresses peer0.registry.landregistry.gov:7051 \
--tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/registry.landregistry.gov/peers/peer0.registry.landregistry.gov/tls/ca.crt \
--peerAddresses peer0.revenue.landregistry.gov:9051 \
--tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/revenue.landregistry.gov/peers/peer0.revenue.landregistry.gov/tls/ca.crt \
--waitForEvent \
-c "${payloadStr.replace(/"/g, '\\"')}"`;

        const cmd = `wsl bash -c '${wslCmd.replace(/'/g, "'\\''")}'`;

        exec(cmd, { shell: 'cmd.exe', timeout: 60000 }, (error, stdout, stderr) => {
            const output = stderr + stdout;
            if (output.includes('committed with status (VALID)') || output.includes('invoke successful')) {
                return resolve({ success: true });
            }
            if (error || output.includes('Error') || output.includes('ERRO')) {
                return reject(new Error(output || error?.message));
            }
            resolve({ success: true });
        });
    });
}

module.exports = { invokeChaincode };
