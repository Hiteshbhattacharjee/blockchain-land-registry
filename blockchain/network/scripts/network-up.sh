#!/bin/bash
# network-up.sh
# Brings up the entire Hyperledger Fabric network
# Run this from blockchain/network/ directory

set -e  # Exit immediately if any command fails

# ── Colors for output ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Land Registry Blockchain Network UP  ${NC}"
echo -e "${GREEN}========================================${NC}"

# ── Set PATH to include Fabric binaries ──
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}

# ── STEP 1: Generate crypto material ──
echo -e "\n${YELLOW}Step 1: Generating crypto material...${NC}"

if [ -d "organizations/peerOrganizations" ]; then
    echo "Crypto material already exists — skipping generation"
    echo "To regenerate: rm -rf organizations/peerOrganizations organizations/ordererOrganizations"
else
    cryptogen generate --config=./crypto-config.yaml --output="organizations"
    echo -e "${GREEN}✓ Crypto material generated${NC}"
fi

# ── STEP 2: Generate channel artifacts ──
echo -e "\n${YELLOW}Step 2: Generating channel artifacts...${NC}"

mkdir -p channel-artifacts

# Genesis block
configtxgen -profile LandRegistryGenesis \
    -channelID system-channel \
    -outputBlock ./channel-artifacts/genesis.block

echo -e "${GREEN}✓ Genesis block created${NC}"

# Channel 1 — Land Registry
configtxgen -profile LandRegistryChannel \
    -outputCreateChannelTx ./channel-artifacts/land-registry-channel.tx \
    -channelID land-registry-channel

echo -e "${GREEN}✓ land-registry-channel.tx created${NC}"

# Channel 2 — Mortgage
configtxgen -profile MortgageChannel \
    -outputCreateChannelTx ./channel-artifacts/mortgage-channel.tx \
    -channelID mortgage-channel

echo -e "${GREEN}✓ mortgage-channel.tx created${NC}"

# Channel 3 — Government Internal
configtxgen -profile GovInternalChannel \
    -outputCreateChannelTx ./channel-artifacts/gov-internal-channel.tx \
    -channelID gov-internal-channel

echo -e "${GREEN}✓ gov-internal-channel.tx created${NC}"

# ── STEP 3: Start Docker containers ──
echo -e "\n${YELLOW}Step 3: Starting Docker containers...${NC}"

docker compose up -d

echo -e "${GREEN}✓ Docker containers started${NC}"

# ── STEP 4: Wait for containers to be ready ──
echo -e "\n${YELLOW}Step 4: Waiting for network to be ready...${NC}"
sleep 5

# ── STEP 5: Verify everything is running ──
echo -e "\n${YELLOW}Step 5: Verifying network...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Network is UP! 🚀                    ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Run scripts/create-channels.sh to create channels"
echo "  2. Run scripts/deploy-chaincode.sh to deploy chaincode"