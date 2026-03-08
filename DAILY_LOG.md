# 📓 Daily Development Log

## Day 1 — [Today's Date]
### What I built:
- Set up monorepo structure for blockchain-land-registry
- Configured Git with proper identity
- Created 6-module folder structure: blockchain, backend, frontend, ai-module, database, infrastructure

### What I learned:
- Monorepo design for complex multi-service projects
- Why Hyperledger Fabric uses a different architecture than Ethereum
- Git professional workflow: always clone from remote, never init locally

### Tomorrow's goal:
- Install Go language for chaincode development
- Set up Hyperledger Fabric test network locally
- Write first chaincode struct
```

---

## STEP 8 — Your First Professional Git Commit

This is how real engineers commit. Every commit message follows a format:
```

type(scope): short description

## Day 2 — 07 March 2026
### What I built:
- Fixed Go GOROOT environment variable (User level was overriding Machine level)
- Confirmed WSL2 Ubuntu 24.04 + Docker Desktop integration
- Downloaded Hyperledger Fabric 2.5.9 binaries and all Docker images
- Wrote complete Go data models: LandAsset, TransferRecord, DisputeRecord, MortgageRecord
- Initialized Go module for land-registry chaincode
- Cleaned up .gitignore — removed binaries from Git tracking

### What I learned:
- Windows env variables have 3 levels: Process > User > Machine (User overrides Machine!)
- WSL2 gives real Linux inside Windows — essential for Fabric bash scripts
- NEVER commit binaries to Git — they're downloaded during setup, not version controlled
- git rm --cached removes files from Git tracking without deleting them locally
- Aadhaar security pattern: always SHA-256 hash sensitive IDs before storing on blockchain

### Blockers faced:
- GOROOT pointing wrong → Fixed by deleting User-level GOROOT
- Accidentally committed Fabric binaries → Fixed with git rm --cached + .gitignore

### Tomorrow's goal:
- Write registerLand() chaincode function
- Write transferOwnership() with multi-signature validation
- Write flagDispute() for our custom Dispute Resolution module
- Make the chaincode compile successfully with go build

## Day 3 — 08 March 2026
### What I built:
- main.go — chaincode entry point with SmartContract struct
- chaincode.go — 8 complete smart contract functions
- All functions compile successfully with go build

### What I learned:
- Go silence = success: zero output from go build means zero errors
- Composite keys in Fabric: CreateCompositeKey("transfer", [landID, txID])
  allows querying ALL transfers for a land using GetStateByPartialCompositeKey
- Role-based access at chaincode level: GetAttributeValue("role") reads
  directly from X.509 certificate — cannot be faked by the application layer
- Fraud score pattern: AI computes score BEFORE calling chaincode,
  chaincode enforces the threshold (>0.75 = block)
- SetEvent() emits blockchain events — backend can listen and react
- go mod tidy automatically resolves all missing go.sum entries

### Blockers faced:
- missing go.sum entries → Fixed with go get + go mod tidy
- main.go was empty → Created it in VS Code with correct content

### Tomorrow's goal:
- Set up Hyperledger Fabric test network with our 3-channel design
- Configure crypto-config.yaml for all organizations
- Configure configtx.yaml for channel definitions
- Start the network with docker-compose
