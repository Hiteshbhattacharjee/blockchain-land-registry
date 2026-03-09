#!/bin/bash
# network-down.sh — Tears down the entire network cleanly

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}Bringing down Land Registry Network...${NC}"

cd "$(dirname "$0")/.."

docker-compose down --volumes --remove-orphans

echo -e "${GREEN}✓ All containers stopped and volumes removed${NC}"

# Optional: remove crypto material (uncomment if you want full reset)
# rm -rf organizations/peerOrganizations
# rm -rf organizations/ordererOrganizations
# rm -rf channel-artifacts
# echo -e "${GREEN}✓ Crypto material and channel artifacts removed${NC}"