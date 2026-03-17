# 🏛️ Blockchain Land & Property Registration System

> A production-grade, government-level land registry built on **Hyperledger Fabric 2.5.9** — fully functional with live blockchain network, REST API, and Next.js frontend.

![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger%20Fabric-2.5.9-blue)
![Go](https://img.shields.io/badge/Go-1.21-cyan)
![Node.js](https://img.shields.io/badge/Node.js-24.x-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

---

## 🔥 What Makes This Different

- **Permissioned blockchain** — enterprise-grade Hyperledger Fabric, not public Ethereum
- **3-channel architecture** — public records, private mortgage data, internal government approvals
- **Live network** — 9 Docker containers running Fabric 2.5.9 with real TLS certificates
- **Dual storage** — blockchain for immutability + PostgreSQL for fast queries
- **Dispute Resolution** — smart contract handles court stay orders with 90-day arbitration
- **Fraud Detection** — ML fraud score field on every transfer (≤0.75 threshold enforced on-chain)
- **IPFS Integration** — document hashes stored on-chain, files on IPFS via Pinata

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│         Search │ Land Detail │ Register Form             │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────────┐
│              Node.js + Express Backend                   │
│         REST API │ Fabric Gateway │ PostgreSQL           │
└──────────┬──────────────────────────┬───────────────────┘
           │ gRPC (TLS)               │ TCP
┌──────────▼──────────┐    ┌──────────▼──────────┐
│  Hyperledger Fabric  │    │    PostgreSQL 16     │
│  2.5.9 Network       │    │  land_records table  │
│  9 Docker containers │    │  transfer_records    │
└──────────────────────┘    └─────────────────────┘
```

### Channel Design
| Channel | Organizations | Purpose |
|---------|--------------|---------|
| `land-registry-channel` | RegistryDept + RevenueDept | Public land records |
| `mortgage-channel` | RegistryDept + BankOrg | Private mortgage data |
| `gov-internal-channel` | RegistryDept + RevenueDept | Internal approvals |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Hyperledger Fabric 2.5.9 |
| Smart Contracts | Go 1.21 (chaincode) |
| Backend | Node.js 24 + Express |
| Fabric SDK | @hyperledger/fabric-gateway |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Database | PostgreSQL 16 |
| Storage | IPFS via Pinata |
| Container | Docker + Docker Compose |
| OS | Windows 11 + WSL2 Ubuntu 24.04 |

---

## 📋 Smart Contract Functions

| Function | Description | Access |
|----------|-------------|--------|
| `RegisterLand` | Register new land asset on ledger | Registrar only |
| `ApproveLandRegistration` | Move PENDING → ACTIVE | Registrar only |
| `TransferOwnership` | Transfer with fraud score check | Owner + Registrar |
| `VerifyOwnership` | Verify owner via Aadhaar hash | Public |
| `GetLand` | Query land record | Public |
| `GetLandHistory` | Full chain of title | Public |
| `FlagDispute` | Open 90-day arbitration | Registrar only |
| `ResolveDispute` | Close dispute + optional new owner | Registrar only |

---

## 🚀 Getting Started

### Prerequisites
- Docker Desktop with WSL2 integration enabled
- Node.js 18+
- Go 1.21+
- PostgreSQL 16
- WSL2 Ubuntu 24.04

### 1. Clone the Repository
```bash
git clone https://github.com/Hiteshbhattacharjee/blockchain-land-registry.git
cd blockchain-land-registry
```

### 2. Download Fabric Binaries
```bash
cd blockchain
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.9 1.5.7
```

### 3. Start the Fabric Network
```bash
cd blockchain/network
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}

# Generate crypto material
cryptogen generate --config=./crypto-config.yaml --output="organizations"

# Generate genesis blocks
mkdir -p channel-artifacts
configtxgen -profile LandRegistryGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
configtxgen -profile LandRegistryChannel -outputBlock ./channel-artifacts/land-registry-channel-genesis.block -channelID land-registry-channel
configtxgen -profile MortgageChannel -outputBlock ./channel-artifacts/mortgage-channel-genesis.block -channelID mortgage-channel
configtxgen -profile GovInternalChannel -outputBlock ./channel-artifacts/gov-internal-channel-genesis.block -channelID gov-internal-channel

# Start containers
docker compose up -d

# Join channels (osnadmin)
osnadmin channel join --channelID land-registry-channel \
    --config-block ./channel-artifacts/land-registry-channel-genesis.block \
    -o localhost:7053 \
    --ca-file ./organizations/ordererOrganizations/orderer.landregistry.gov/orderers/orderer.orderer.landregistry.gov/tls/ca.crt \
    --client-cert ./organizations/ordererOrganizations/orderer.landregistry.gov/orderers/orderer.orderer.landregistry.gov/tls/server.crt \
    --client-key ./organizations/ordererOrganizations/orderer.landregistry.gov/orderers/orderer.orderer.landregistry.gov/tls/server.key
```

### 4. Start the Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your CRYPTO_PATH and DB credentials
npm install
npm run dev
```

### 5. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📅 Build Log

| Day | What Was Built |
|-----|---------------|
| Day 1 | Project scaffold, GitHub setup, monorepo folder structure |
| Day 2 | Go installation, Fabric 2.5.9 binaries, models.go data structures |
| Day 3 | Go chaincode — 8 smart contract functions, go build passes |
| Day 4 | Network config — crypto-config.yaml, configtx.yaml, docker-compose.yaml |
| Day 5 | Live 9-container Fabric network, 3 channels created via osnadmin |
| Day 6 | Chaincode installed + invoked, LAND001 registered on ledger |
| Day 7 | Node.js Express backend + Fabric Gateway SDK connected |
| Day 8 | PostgreSQL integration — blockchain sync with upsert pattern |
| Day 9 | Next.js frontend — search, land detail, register pages |
| Day 10 | Documentation, cleanup, portfolio-ready |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/land/` | Get all land records |
| GET | `/api/land/:landId` | Get land from blockchain + sync DB |
| POST | `/api/land/register` | Register new land on blockchain |

---

## 📁 Project Structure

```
blockchain-land-registry/
├── blockchain/
│   ├── chaincode/land-registry/   # Go smart contracts
│   │   ├── main.go
│   │   ├── chaincode.go           # 8 contract functions
│   │   └── models.go              # LandAsset, TransferRecord structs
│   └── network/
│       ├── configtx.yaml          # Channel configuration
│       ├── crypto-config.yaml     # Certificate authorities
│       ├── docker-compose.yaml    # 9 container network
│       └── scripts/               # Network up/down scripts
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── fabric.js          # Fabric Gateway connection
│   │   │   └── database.js        # PostgreSQL pool
│   │   ├── routes/land.js         # REST API routes
│   │   └── services/
│   │       ├── landService.js     # Blockchain interactions
│   │       └── dbService.js       # PostgreSQL operations
│   └── database/migrations/       # SQL migration files
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Home + search
│   │   ├── land/[id]/page.tsx     # Land detail
│   │   └── register/page.tsx      # Register form
│   └── lib/api.ts                 # API service layer
└── DAILY_LOG.md
```

---

## 👨‍💻 Author

**Hitesh Bhattacharjee**
- B.Tech Computer Science (Blockchain Specialization) — Year 3
- General Secretary, PDTC (Project Design and Technology Club)
- GitHub: [@Hiteshbhattacharjee](https://github.com/Hiteshbhattacharjee)

---

## 📄 License

MIT